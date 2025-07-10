from flask import Blueprint, request, jsonify
from services.whatsapp_service import enviar_pedido_whatsapp
from utils.auth_utils import get_cliente_por_id
from models.produto import get_produto_por_id
import cx_Oracle
from datetime import datetime

whatsapp_bp = Blueprint("whatsapp", __name__)


@whatsapp_bp.route("/enviar-pedido", methods=["POST"])
def enviar_pedido():
    cliente_id = request.json.get("cliente_id")
    session_id = request.json.get("session_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Recuperar dados do cliente
        cliente = get_cliente_por_id(cliente_id, cursor)

        # Recuperar itens do carrinho
        cursor.execute(
            """
            SELECT p.PRO_CODPRO, p.PRO_DESCRI, c.JCT_QUANTIDADE
            FROM J_CARRINHO_TEMP c
            JOIN J_PRODUTO p ON c.JCT_PROID = p.PRO_ID
            WHERE c.JCT_SESSION_ID = :session_id
            """,
            [session_id],
        )
        itens = cursor.fetchall()

        # Formatar pedido
        pedido = {
            "cliente": {
                "cnpj": cliente["cgc"],
                "nome": cliente["razao_social"],
                "contato": cliente["telefone"] or cliente["celular"],
            },
            "itens": [
                {"codigo": item[0], "nome": item[1], "quantidade": item[2]}
                for item in itens
            ],
            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
        }

        # Enviar via WhatsApp
        sucesso, resposta = enviar_pedido_whatsapp(pedido)

        if sucesso:
            # Limpar carrinho após envio
            cursor.execute(
                "DELETE FROM J_CARRINHO_TEMP WHERE JCT_SESSION_ID = :session_id",
                [session_id],
            )
            conn.commit()
            return jsonify({"success": True, "message_id": resposta})
        else:
            return jsonify({"success": False, "error": resposta}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
