import pywhatkit
from datetime import datetime


def enviar_pedido(data: dict) -> bool:
    cnpj = data.get("cnpj")
    itens = data.get("itens", [])
    mensagem = ["🛠️ PEDIDO DE REPOSIÇÃO DE PEÇAS", f"CNPJ: {cnpj}", "�Produtos:"]
    for i in itens:
        mensagem.append(
            f"• Código: {i['codigo']} - {i['descricao']} | Qtd: {i['quantidade']}"
        )
    mensagem.append(f"⏰ {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    texto = "\n".join(mensagem)
    try:
        # numero configurado na empresa
        pywhatkit.sendwhatmsg_instantly("+551900000000")
        return True
    except Exception:
        return False
