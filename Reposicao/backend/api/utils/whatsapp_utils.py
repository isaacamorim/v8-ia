import requests
from backend.api.config import Config


def enviar_pedido_whatsapp(pedido):
    try:
        mensagem = formatar_mensagem_pedido(pedido)

        # Usando API do Twilio (exemplo)
        from twilio.rest import Client

        client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)

        message = client.messages.create(
            body=mensagem,
            from_="whatsapp:" + Config.TWILIO_WHATSAPP_NUMBER,
            to="whatsapp:" + Config.EMPRESA_WHATSAPP_NUMBER,
        )

        return True, message.sid
    except Exception as e:
        return False, str(e)


def formatar_mensagem_pedido(pedido):
    return f"""
🛠️ PEDIDO DE REPOSIÇÃO DE PEÇAS

👤 CLIENTE
CNPJ: {pedido['cliente']['cnpj']}
Nome: {pedido['cliente']['nome']}

📦 PRODUTOS SOLICITADOS
{formatar_itens_pedido(pedido['itens'])}

⏰ Data/Hora: {pedido['data']}
""".strip()


def formatar_itens_pedido(itens):
    return "\n".join(
        [
            f"• {item['codigo']} - {item['nome']}\n  Quantidade: {item['quantidade']} unidades"
            for item in itens
        ]
    )
