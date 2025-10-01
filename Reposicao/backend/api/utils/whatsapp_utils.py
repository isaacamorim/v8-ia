import requests
import os

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")  # seu token permanente
WHATSAPP_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID")  # phone_number_id gerado no app
WHATSAPP_API_URL = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_ID}/messages"


def enviar_pedido_whatsapp(pedido: dict):
    """Envia mensagem formatada de pedido via WhatsApp Cloud API"""

    # Texto do pedido
    itens_texto = "\n".join(
        [
            f"• {i['codigo']} - {i['nome']} | Qtd: {i['quantidade']}"
            for i in pedido["itens"]
        ]
    )
    mensagem = (
        f"🛠️ *PEDIDO DE REPOSIÇÃO DE PEÇAS*\n\n"
        f"*Cliente:* {pedido['cliente']['nome']}\n"
        f"*CNPJ:* {pedido['cliente']['cnpj']}\n"
        f"*Data:* {pedido['data']}\n\n"
        f"*Itens:*\n{itens_texto}"
    )

    payload = {
        "messaging_product": "whatsapp",
        "to": pedido["cliente"]["contato"],  # ex.: "+5511999999999"
        "type": "text",
        "text": {"body": mensagem},
    }

    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    r = requests.post(WHATSAPP_API_URL, headers=headers, json=payload)

    if r.status_code == 200:
        return True, r.json().get("messages", [{}])[0].get("id", "")
    else:
        return False, r.text
