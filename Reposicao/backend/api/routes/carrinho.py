# routes/carrinho.py
from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.carrinho import CarrinhoTemp
from ..models.produto import Produto

carrinho_bp = Blueprint("carrinho", __name__)


# === GET: Buscar carrinho só pelo CNPJ, filtrando apenas itens ativos ===
import base64


@carrinho_bp.route("/<cnpj_temp>", methods=["GET"])
def get_carrinho_por_cnpj(cnpj_temp):
    try:
        itens = (
            db.session.query(CarrinhoTemp, Produto)
            .join(Produto, CarrinhoTemp.JCT_PROID == Produto.JRO_PROID)
            .filter(CarrinhoTemp.JCT_CNPJ_TEMP == cnpj_temp)
            .all()
        )

        resultado = []
        for item, produto in itens:
            # Se o campo for bytes, converte para base64 string
            imagem_str = None
            if hasattr(produto, "IMG_IMAGEM") and produto.IMG_IMAGEM:
                try:
                    imagem_str = base64.b64encode(produto.IMG_IMAGEM).decode("utf-8")
                except Exception:
                    imagem_str = None

            resultado.append(
                {
                    "produto_id": item.JCT_PROID,
                    "quantidade": item.JCT_QUANTIDADE,
                    "status": item.JCT_STATUS,
                    "descricao": produto.JRO_DESCRI,
                    "codigo": produto.JRO_PROERP,
                    "imagem": imagem_str,  # já convertido
                }
            )

        return jsonify(resultado)

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"erro": f"Erro ao buscar carrinho: {str(e)}"}), 500

# === POST: Adicionar item ao carrinho pelo CNPJ ===
@carrinho_bp.route("/adicionar", methods=["POST"])
def adicionar_item():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"erro": "JSON ausente"}), 400

        session_id = data.get("session_id")
        produto_id = data.get("produto_id")
        quantidade = data.get("quantidade")
        cnpj_temp = data.get("cnpj_temp")

        if not all([session_id, produto_id, quantidade, cnpj_temp]):
            return jsonify({"erro": "Campos obrigatórios ausentes"}), 400

        try:
            produto_id = int(produto_id)
            quantidade = int(quantidade)
        except ValueError:
            return jsonify({"erro": "IDs e quantidades precisam ser inteiros"}), 400

        item = CarrinhoTemp(
            JCT_SESSION_ID=session_id,
            JCT_PROID=produto_id,
            JCT_QUANTIDADE=quantidade,
            JCT_STATUS="ATIVO",
            JCT_CNPJ_TEMP=cnpj_temp,
        )

        db.session.add(item)
        db.session.commit()
        return jsonify({"message": "Adicionado ao carrinho."}), 201

    except Exception as e:
        import traceback

        traceback.print_exc()
        db.session.rollback()
        return jsonify({"erro": f"Erro ao adicionar item: {str(e)}"}), 500

# === PUT: Atualizar status do item pelo CNPJ ===
@carrinho_bp.route("/status", methods=["PUT"])
def atualizar_status():
    try:
        data = request.json
        produto_id = data.get("produto_id")
        cnpj_temp = data.get("cnpj_temp")
        status = data.get("status")

        if not all([produto_id, cnpj_temp, status]):
            return jsonify({"erro": "Campos obrigatórios ausentes"}), 400

        item = CarrinhoTemp.query.filter_by(
            JCT_PROID=produto_id, JCT_CNPJ_TEMP=cnpj_temp
        ).first()

        if item:
            item.JCT_STATUS = status
            db.session.commit()
            return jsonify({"message": "Status atualizado"}), 200

        return jsonify({"error": "Item não encontrado"}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Erro ao atualizar status: {str(e)}"}), 500
