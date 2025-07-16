# routes/carrinho.py
from flask import Blueprint, request, jsonify, session
from ..extensions import db
from ..models.carrinho import CarrinhoTemp

carrinho_bp = Blueprint("carrinho", __name__)


@carrinho_bp.route("/<session_id>", methods=["GET"])
def get_carrinho(session_id):
    itens = CarrinhoTemp.query.filter_by(JCT_SESSION_ID=session_id).all()
    return jsonify(
        [{"produto_id": i.JCT_PROID, "quantidade": i.JCT_QUANTIDADE} for i in itens]
    )


@carrinho_bp.route("/adicionar", methods=["POST"])
def adicionar():
    data = request.json
    item = CarrinhoTemp(
        JCT_SESSION_ID=data["session_id"],
        JCT_PROID=data["produto_id"],
        JCT_QUANTIDADE=data["quantidade"],
        JCT_CNPJ_TEMP=session.get("cliente"),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Adicionado ao carrinho."}), 201
