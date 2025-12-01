"""
desktop_view.py

Utilities and PyQt widgets to parse product "nombre" fields and display free-beverage
information extracted from names like: "promo variant (4x Pepsi, 2x 7 up)".

This module is intentionally self-contained so it can be integrated into an existing
PyQt-based desktop application. It does NOT modify any Firebase data; it only interprets
and displays the text found in the `nombre` field.

Usage:
    python backend/desktop_view.py

or import the helper functions into the existing desktop app and use
    parse_nombre_producto(nombre)
    format_item_for_display(item)

The demo will show two tabs: "Registro de Ventas" and "Recaudación", both rendering
orders and extracting beverage info into its own column (styled in gray / smaller font).

Compatible with PyQt5 or PyQt6 (tries PyQt5 first, then PyQt6).
"""

import sys
import re
from typing import Tuple, Optional, List, Dict

# PyQt5/PyQt6 compatibility shim using dynamic imports to avoid static-analysis errors
import importlib
import importlib.util

QtWidgets = None
QtGui = None
QtCore = None
QT_VERSION = None

if importlib.util.find_spec('PyQt5'):
    QtWidgets = importlib.import_module('PyQt5.QtWidgets')
    QtGui = importlib.import_module('PyQt5.QtGui')
    QtCore = importlib.import_module('PyQt5.QtCore')
    Qt = QtCore
    QT_VERSION = 'PyQt5'
elif importlib.util.find_spec('PyQt6'):
    QtWidgets = importlib.import_module('PyQt6.QtWidgets')
    QtGui = importlib.import_module('PyQt6.QtGui')
    QtCore = importlib.import_module('PyQt6.QtCore')
    Qt = QtCore
    QT_VERSION = 'PyQt6'
else:
    raise ImportError('Requires PyQt5 or PyQt6')


def parse_nombre_producto(nombre: str) -> Tuple[str, Optional[str]]:
    """Parsea el campo `nombre` y extrae el texto entre paréntesis si existe.

    Ejemplos:
      "promo variant (4x Pepsi, 2x 7 up)" -> ("promo variant", "4x Pepsi, 2x 7 up")
      "promo AX-100" -> ("promo AX-100", None)

    Retorna:
      (nombre_base, bebidas_str_or_none)
    """
    if not nombre or not isinstance(nombre, str):
        return nombre or '', None

    # Buscar paréntesis al final (puede haber paréntesis en medio de nombre; asumimos la convención del producto)
    m = re.match(r'^\s*(.*?)\s*\(([^)]+)\)\s*$', nombre.strip())
    if m:
        nombre_base = m.group(1).strip()
        bebidas = m.group(2).strip()
        return nombre_base, bebidas

    return nombre.strip(), None


def format_item_for_display(item: Dict) -> Dict:
    """Normaliza un item del pedido para la UI.

    Acepta un diccionario que puede contener campos como:
      - nombre
      - cantidad (string o int)
      - precio (string o int)
      - subtotal

    Calcula el total por item usando `subtotal` si existe, si no usa precio*cantidad.
    Extrae las bebidas con `parse_nombre_producto`.

    Retorna un dict con claves: product_name, bebidas (str|None), cantidad (int), total (int)
    """
    nombre_raw = item.get('nombre') or item.get('nombre_producto') or ''
    cantidad_raw = item.get('cantidad') or 1
    try:
        cantidad = int(cantidad_raw)
    except Exception:
        try:
            cantidad = int(float(cantidad_raw))
        except Exception:
            cantidad = 1

    # subtotal puede venir como string
    subtotal_raw = item.get('subtotal')
    total = None
    if subtotal_raw is not None:
        try:
            total = int(float(subtotal_raw))
        except Exception:
            total = None

    if total is None:
        precio_raw = item.get('precio') or 0
        try:
            precio = int(float(precio_raw))
        except Exception:
            precio = 0
        total = precio * cantidad

    nombre_base, bebidas = parse_nombre_producto(nombre_raw)

    return {
        'product_name': nombre_base,
        'bebidas': bebidas,  # string like '4x Pepsi, 2x 7 up' or None
        'cantidad': cantidad,
        'total': total,
        'raw': item
    }


class OrdersTable(QtWidgets.QTableWidget):
    """Tabla simple para mostrar items de pedidos con columna para bebidas gratis."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setColumnCount(4)
        self.setHorizontalHeaderLabels(['Producto', 'Bebidas gratis', 'Cantidad', 'Total'])
        header = self.horizontalHeader()
        header.setSectionResizeMode(0, QtWidgets.QHeaderView.Stretch)
        header.setSectionResizeMode(1, QtWidgets.QHeaderView.Stretch)
        header.setSectionResizeMode(2, QtWidgets.QHeaderView.ResizeToContents)
        header.setSectionResizeMode(3, QtWidgets.QHeaderView.ResizeToContents)
        self.verticalHeader().setVisible(False)
        self.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
        self.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows)
        self.setAlternatingRowColors(True)

    def clear_and_load(self, items: List[Dict]):
        self.setRowCount(0)
        for it in items:
            display = format_item_for_display(it)
            self._append_row(display)

    def _append_row(self, display: Dict):
        row = self.rowCount()
        self.insertRow(row)

        # Producto (nombre)
        item_name = QtWidgets.QTableWidgetItem(display['product_name'])
        self.setItem(row, 0, item_name)

        # Bebidas gratis (si existe mostrar en gris y con fuente más pequeña)
        bebidas_widget = QtWidgets.QWidget()
        layout = QtWidgets.QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        if display['bebidas']:
            label_b = QtWidgets.QLabel(display['bebidas'])
            # Estilo: gris y más pequeño
            label_b.setStyleSheet('color: #666666; font-size: 11px;')
            layout.addWidget(label_b)
        else:
            label_b = QtWidgets.QLabel('')
            layout.addWidget(label_b)
        bebidas_widget.setLayout(layout)
        self.setCellWidget(row, 1, bebidas_widget)

        # Cantidad
        qty_item = QtWidgets.QTableWidgetItem(str(display['cantidad']))
        qty_item.setTextAlignment(QtGui.Qt.AlignCenter if hasattr(QtGui, 'Qt') else Qt.AlignmentFlag.AlignCenter)
        self.setItem(row, 2, qty_item)

        # Total (moneda formateada)
        total_formatted = f"${display['total']:,}".replace(',', '.')
        total_item = QtWidgets.QTableWidgetItem(total_formatted)
        total_item.setTextAlignment(QtGui.Qt.AlignRight if hasattr(QtGui, 'Qt') else Qt.AlignmentFlag.AlignRight)
        self.setItem(row, 3, total_item)


class OrdersTabsWidget(QtWidgets.QWidget):
    """Widget que contiene las pestañas Registro de Ventas y Recaudación."""

    def __init__(self, orders: List[Dict] = None, parent=None):
        super().__init__(parent)
        self.orders = orders or []

        layout = QtWidgets.QVBoxLayout()
        self.tabs = QtWidgets.QTabWidget()

        # Registro de Ventas tab
        self.registro_table = OrdersTable()
        reg_tab = QtWidgets.QWidget()
        reg_layout = QtWidgets.QVBoxLayout()
        reg_layout.addWidget(self.registro_table)
        reg_tab.setLayout(reg_layout)

        # Recaudación tab - in this simple UI we reuse the same table
        self.recaudacion_table = OrdersTable()
        rec_tab = QtWidgets.QWidget()
        rec_layout = QtWidgets.QVBoxLayout()
        rec_layout.addWidget(self.recaudacion_table)
        rec_tab.setLayout(rec_layout)

        self.tabs.addTab(reg_tab, 'Registro de Ventas')
        self.tabs.addTab(rec_tab, 'Recaudación / Reporte')

        layout.addWidget(self.tabs)
        self.setLayout(layout)

        # Load orders
        self.load_orders(self.orders)

    def load_orders(self, orders: List[Dict]):
        """Carga una lista de pedidos. Cada pedido puede tener `items` o `items`/`productos`.

        Formato esperado de `orders`:
          [ { 'id_pedido': '120', 'items': [ {...}, ... ], ... }, ... ]
        """
        rows_for_registro = []
        rows_for_recaudacion = []

        for pedido in orders:
            items = pedido.get('items') or pedido.get('productos') or []
            for it in items:
                rows_for_registro.append(it)
                rows_for_recaudacion.append(it)

        self.registro_table.clear_and_load(rows_for_registro)
        self.recaudacion_table.clear_and_load(rows_for_recaudacion)


# Demo runner
SAMPLE_ORDERS = [
    {
        'id_pedido': '120',
        'items': [
            {
                'nombre': 'promo variant (4x Pepsi, 2x 7 up)',
                'cantidad': '2',
                'precio': '36000',
                'subtotal': '72000',
                'producto_id': '13'
            }
        ],
        'metodo_pago': 'Efectivo',
        'nombre_cliente': 'hqwfdyqwgf|',
        'origen': 'local',
        'total': '72000'
    },
    {
        'id_pedido': '121',
        'items': [
            {
                'nombre': 'promo AX-100',
                'cantidad': '1',
                'precio': '28000',
                'subtotal': '28000',
                'producto_id': '14'
            }
        ],
        'metodo_pago': 'MercadoPago',
        'nombre_cliente': 'Cliente Demo',
        'origen': 'web',
        'total': '28000'
    }
]


def main():
    app = QtWidgets.QApplication(sys.argv)
    w = OrdersTabsWidget(SAMPLE_ORDERS)
    w.setWindowTitle(f'Venta - Vista rápida ({QT_VERSION})')
    w.resize(800, 400)
    w.show()
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
