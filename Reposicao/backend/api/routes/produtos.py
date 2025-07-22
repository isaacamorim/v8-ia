# routes / produtos.py
from flask import Blueprint, jsonify, request
from ..models.produto import Produto
from sqlalchemy import or_

produtos_bp = Blueprint("produtos", __name__)


@produtos_bp.route("/reposicao", methods=["GET"])
def listar_produtos():
    prods = Produto.query.filter(Produto.JPC_MOSTRA_REPOSICAO.in_([1, "1", True])).all()
    return jsonify([p.to_dict() for p in prods])


@produtos_bp.route("/reposicao/search", methods=["GET"])
def buscar_produtos():
    termo = request.args.get("q", "").strip()

    if not termo:
        return jsonify([])

    palavras = termo.lower().split()

    query = Produto.query.filter(Produto.JPC_MOSTRA_REPOSICAO.in_([1, True]))

    filtros = []
    for palavra in palavras:
        like = f"%{palavra}%"
        filtros.append(Produto.JRO_DESCRI.ilike(like))
        filtros.append(Produto.JPC_PALAVRAS_CHAVE.ilike(like))
        filtros.append(Produto.JRO_PROERP.ilike(like))

    query = query.filter(or_(*filtros))
    resultados = query.all()

    return jsonify([p.to_dict() for p in resultados])
