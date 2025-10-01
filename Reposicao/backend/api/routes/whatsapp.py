from flask import Blueprint, request, jsonify
# from ..utils.auth_utils import get_cliente_por_id
# from ..models.produto import get_produto_por_id
# import cx_Oracle
from datetime import datetime

whatsapp_bp = Blueprint("whatsapp", __name__)


@whatsapp_bp.route("/enviar-pedido", methods=["POST"])
def enviar_pedido():
    cliente_id = request.json.get("cliente_id")
    session_id = request.json.get("session_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Recuperar cliente
        cliente = get_cliente_por_id(cliente_id, cursor)

        # Recuperar itens do carrinho
        cursor.execute(
            """
            SELECT p.PRO_CODPRO, p.PRO_DESCRI, c.JCT_QUANTIDADE, c.JCT_ID
            FROM J_CARRINHO_TEMP c
            JOIN J_PRODUTO p ON c.JCT_PROID = p.PRO_ID
            WHERE c.JCT_SESSION_ID = :session_id
                AND c.JCT_STATUS = 'ATIVO'
        """,
            [session_id],
        )
        itens = cursor.fetchall()

        if not itens:
            return jsonify({"success": False, "error": "Carrinho vazio"}), 400

        pedido = {
            "cliente": {
                "cnpj": cliente["cgc"],
                "nome": cliente["razao_social"],
                "contato": cliente["telefone"] or cliente["celular"],
            },
            "itens": [
                {"codigo": i[0], "nome": i[1], "quantidade": i[2], "id": i[3]}
                for i in itens
            ],
            "data": datetime.now().strftime("%d/%m/%Y %H:%M"),
        }

        sucesso, resposta = enviar_pedido_whatsapp(pedido)

        if sucesso:
            # Atualiza o status dos itens no carrinho
            for item in pedido["itens"]:
                cursor.execute(
                    """
                    UPDATE J_CARRINHO_TEMP
                    SET JCT_STATUS = 'ENVIADO'
                    WHERE JCT_ID = :id
                """,
                    [item["id"]],
                )
            conn.commit()

            return jsonify({"success": True, "message_id": resposta})
        else:
            return jsonify({"success": False, "error": resposta}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
