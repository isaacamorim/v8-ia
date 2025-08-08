# routes/carrinho.py
from flask import Blueprint, request, jsonify, session
from ..extensions import db
from ..models.carrinho import CarrinhoTemp
from ..models.produto import Produto

carrinho_bp = Blueprint("carrinho", __name__)


# === Rota para buscar itens do carrinho com base no session_id ===
@carrinho_bp.route("/<session_id>", methods=["GET"])
def get_carrinho(session_id):
    itens = (
        db.session.query(CarrinhoTemp, Produto)
        .join(Produto, CarrinhoTemp.JCT_PROID == Produto.JRO_PROID)
        .filter(CarrinhoTemp.JCT_SESSION_ID == session_id)
        .all()
    )
    return jsonify(
        [
            {
                "produto_id": item.JCT_PROID,
                "quantidade": item.JCT_QUANTIDADE,
                "status": item.JCT_STATUS,
                "descricao": produto.JRO_DESCRI,
                "codigo": produto.JRO_PROERP,
                "imagem": produto.JRO_IMAGEM,
            }
            for item, produto in itens
        ]
    )


# === Rota para adicionar item ao carrinho ===
@carrinho_bp.route("/adicionar", methods=["POST"])
def adicionar_item():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"erro": "JSON ausente"}), 400

        session_id = data.get("session_id")
        produto_id = data.get("produto_id")
        quantidade = data.get("quantidade")
        cnpj = data.get("cnpj_temp", "")  # se estiver enviando o CNPJ opcionalmente

        if not all([session_id, produto_id, quantidade]):
            return jsonify({"erro": "Campos obrigatórios ausentes"}), 400

        produto_id = int(produto_id)
        quantidade = int(quantidade)

        item = CarrinhoTemp(
            JCT_SESSION_ID=session_id,
            JCT_PROID=produto_id,
            JCT_QUANTIDADE=quantidade,
            JCT_STATUS="ATIVO",
            JCT_CNPJ_TEMP=cnpj,
        )

        db.session.add(item)
        db.session.commit()
        return jsonify({"message": "Adicionado ao carrinho."}), 201

    except Exception as e:
        return jsonify({"erro": f"Erro ao adicionar item: {str(e)}"}), 500

# === Rota para atualizar o status de um item do carrinho ===
@carrinho_bp.route("/status", methods=["PUT"])
def atualizar_status():
    data = request.json
    item = CarrinhoTemp.query.filter_by(
        JCT_SESSION_ID=data["session_id"], JCT_PROID=data["produto_id"]
    ).first()

    if item:
        item.JCT_STATUS = data["status"]
        db.session.commit()
        return jsonify({"message": "Status atualizado"}), 200

    return jsonify({"error": "Item não encontrado"}), 404
