import requests
import os

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")  # Token de WhatsApp Cloud API
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")  # ID de número de WhatsApp Cloud API

API_URL = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"

# order debe tener: phone, customer_name, address, products (list), total, id, receipt_url

def send_order_whatsapp(order):
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    body = {
        "messaging_product": "whatsapp",
        "to": order.get("phone"),
        "type": "template",
        "template": {
            "name": "pedido_confirmado",  # Debes crear esta plantilla en WhatsApp Cloud API
            "language": {"code": "es_AR"},
            "components": [
                {"type": "body", "parameters": [
                    {"type": "text", "text": order.get("customer_name", "")},
                    {"type": "text", "text": order.get("address", "")},
                    {"type": "text", "text": build_products(order.get("products", []))},
                    {"type": "text", "text": str(order.get("total", ""))},
                    {"type": "text", "text": str(order.get("id", ""))}
                ]}
            ]
        }
    }
    # Si tienes comprobante, puedes enviar como media (opcional)
    if order.get("receipt_url"):
        body["type"] = "image"
        body["image"] = {"link": order["receipt_url"]}
    r = requests.post(API_URL, headers=headers, json=body)
    return r.json()

def build_products(products):
    lines = []
    for p in products:
        qty = p.get('qty', p.get('cantidad', 1))
        name = p.get('name', p.get('nombre', ''))
        line = f"- {qty} x {name}"
        # Mostrar bebidas gratis si existen
        bebidas = p.get('bebidas')
        descripcion_bebidas = p.get('descripcionBebidas')
        if bebidas or descripcion_bebidas:
            # Mostrar formato: Bebidas gratis: Pepsi, Pepsi, 7up
            if descripcion_bebidas:
                # Convertir a formato: Bebidas gratis: Pepsi, Pepsi, 7up
                bebidas_list = []
                for bebida, cantidad in (bebidas or {}).items():
                    bebidas_list.extend([bebida] * cantidad)
                if bebidas_list:
                    line += f"\n    Bebidas gratis: {', '.join(bebidas_list)}"
                else:
                    # Fallback a descripcionBebidas si no hay objeto bebidas
                    line += f"\n    Bebidas gratis: {descripcion_bebidas.replace('x ', '').replace('  ', ' ')}"
            else:
                # Solo objeto bebidas
                bebidas_list = []
                for bebida, cantidad in bebidas.items():
                    bebidas_list.extend([bebida] * cantidad)
                line += f"\n    Bebidas gratis: {', '.join(bebidas_list)}"
        lines.append(line)
    return "\n".join(lines)
