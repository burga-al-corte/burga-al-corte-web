import importlib
import importlib.util

# Import requests dynamically to avoid hard failure at static analysis
requests = importlib.import_module('requests') if importlib.util.find_spec('requests') else None

# Import Flask dynamically (avoid static import errors when package not installed)
if importlib.util.find_spec('flask'):
    flask = importlib.import_module('flask')
    Flask = flask.Flask
    request = flask.request
    jsonify = flask.jsonify
else:
    Flask = None
    request = None
    jsonify = None

from db_client import mark_order_paid, save_payment_log, get_order_details
from whatsapp_sender import send_order_whatsapp

# If Flask is available, create the app; otherwise create a dummy app with a simple logger
if Flask:
    app = Flask(__name__)
else:
    class _DummyLogger:
        def error(self, *args, **kwargs):
            print("[webhook][ERROR]:", *args)
        def warning(self, *args, **kwargs):
            print("[webhook][WARN]:", *args)
        def info(self, *args, **kwargs):
            print("[webhook][INFO]:", *args)

    class _DummyApp:
        logger = _DummyLogger()
        def run(self, *args, **kwargs):
            raise RuntimeError('Flask is not installed. Install it with: pip install flask')

    app = _DummyApp()

MERCADOPAGO_ACCESS_TOKEN = "<YOUR_ACCESS_TOKEN>"

@app.route("/api/mercadopago/webhook", methods=["POST"])
def mp_webhook():
    data = request.get_json(force=True)
    save_payment_log(data)

    payment_id = None
    if "id" in data:
        payment_id = data["id"]
    elif "data" in data and "id" in data["data"]:
        payment_id = data["data"]["id"]
    elif "action" in data and "id" in data:
        payment_id = data["id"]

    if not payment_id:
        return jsonify({"ok": False, "error": "no payment id found"}), 400

    # Verificar con Mercado Pago
    headers = {"Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}"}
    r = requests.get(f"https://api.mercadopago.com/v1/payments/{payment_id}", headers=headers)
    if r.status_code != 200:
        return jsonify({"ok": False, "error": r.text}), 500
    payment_info = r.json()

    status = payment_info.get("status")
    external_ref = payment_info.get("external_reference")
    receipt_url = payment_info.get("receipt_url") or payment_info.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code_base64")

    if status == "approved":
        mark_order_paid(external_ref or payment_id, {
            "payment_id": payment_id,
            "status": "Pagado",
            "paid_at": payment_info.get("date_approved"),
            "receipt_url": receipt_url,
            "raw": payment_info
        })
        order = get_order_details(external_ref or payment_id)
        if order:
            try:
                send_order_whatsapp(order)
            except Exception as e:
                # Log and continue; do not fail the webhook if WhatsApp sending fails
                app.logger.error(f"Error sending WhatsApp for order {external_ref or payment_id}: {e}")
        else:
            app.logger.warning(f"Order {external_ref or payment_id} not found in DB; skipping WhatsApp")
    else:
        mark_order_paid(external_ref or payment_id, {
            "payment_id": payment_id,
            "status": status,
            "raw": payment_info
        })
    return jsonify({"ok": True}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
