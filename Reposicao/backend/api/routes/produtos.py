from flask import Blueprint, jsonify, request
from ..models.produto import Produto

produtos_bp = Blueprint("produtos", __name__)


@produtos_bp.route("/reposicao", methods=["GET"])
def listar_produtos():
    prods = Produto.query.filter_by(JRO_MOSTRA_REPOSICAO=True).all()
    return jsonify([p.to_dict() for p in prods])


@produtos_bp.route("/reposicao/search", methods=["GET"])
def buscar_produtos():
    q = request.args.get("q", "")
    prods = Produto.query.filter(
        Produto.JRO_MOSTRA_REPOSICAO == True, Produto.JRO_PALAVRAS_CHAVE.ilike(f"%{q}%")
    ).all()
    return jsonify([p.to_dict() for p in prods])
