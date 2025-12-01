import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    cred = credentials.Certificate(os.path.join(os.getcwd(), "serviceAccountKey.json"))
    firebase_admin.initialize_app(cred)

db = firestore.client()

def save_payment_log(payload):
    db.collection("mercadopago_logs").add({
        "payload": payload,
        "received_at": firestore.SERVER_TIMESTAMP
    })

def mark_order_paid(order_id, data):
    """Marca un pedido como pagado en la colección `pedidos`.

    Se usa la colección `pedidos` porque la web guarda los pedidos allí.
    """
    doc_ref = db.collection("pedidos").document(str(order_id))
    doc_ref.set(data, merge=True)
    return doc_ref.get().to_dict()

def get_order_details(order_id):
    """Obtiene detalles del pedido desde `pedidos` y normaliza la forma

    Retorna un diccionario con campos amigables para `whatsapp_sender.send_order_whatsapp`:
      { phone, customer_name, address, products, total, id, receipt_url }
    """
    doc_ref = db.collection("pedidos").document(str(order_id))
    snap = doc_ref.get()
    if not snap.exists:
        return None
    data = snap.to_dict() or {}

    # Normalizar productos/items
    raw_items = data.get('items') or data.get('productos') or []
    products = []
    for it in raw_items:
        products.append({
            'cantidad': it.get('cantidad') or it.get('qty') or 1,
            'precio': it.get('precio') or it.get('price') or 0,
            'nombre': it.get('nombre') or it.get('name') or '',
            'producto_id': it.get('producto_id') or it.get('id')
        })

    normalized = {
        'phone': data.get('telefono') or data.get('phone') or '',
        'customer_name': data.get('nombre_cliente') or data.get('nombre') or data.get('nombreCliente') or '',
        'address': data.get('direccion') or data.get('direccion_entrega') or '',
        'products': products,
        'total': data.get('total') or data.get('monto') or 0,
        'id': data.get('id_pedido') or str(order_id),
        'receipt_url': data.get('receipt_url') or data.get('comprobante') or None,
        # preserve original raw doc for advanced use
        '_raw': data
    }

    return normalized
