# routes / produtos.py
from flask import Blueprint, jsonify, request
from ..models.produto import Produto
from sqlalchemy import or_

produtos_bp = Blueprint("produtos", __name__)


@produtos_bp.route("/reposicao", methods=["GET"])
def listar_produtos():
    tags_param = request.args.get("tags")  # ex: "EMPACOTADEIRA,EVA"
    termo = request.args.get("q", "").strip()

    query = Produto.query.filter(Produto.JPC_MOSTRA_REPOSICAO.in_([1, "1", True]))

    # 🔹 filtro por tags
    if tags_param:
        tags = [t.strip().lower() for t in tags_param.split(",") if t.strip()]
        for tag in tags:
            like = f"%{tag}%"
            # aqui usamos AND (cada tag deve estar presente)
            query = query.filter(Produto.JPC_PALAVRAS_CHAVE.ilike(like))

    # 🔹 filtro por texto livre
    if termo:
        palavras = termo.lower().split()
        filtros = []
        for palavra in palavras:
            like = f"%{palavra}%"
            filtros.append(Produto.JRO_DESCRI.ilike(like))
            filtros.append(Produto.JPC_PALAVRAS_CHAVE.ilike(like))
            filtros.append(Produto.JRO_PROERP.ilike(like))
        query = query.filter(or_(*filtros))

    prods = query.all()
    return jsonify([p.to_dict() for p in prods])


#@produtos_bp.route("/reposicao/search", methods=["GET"])
#def buscar_produtos():
#    termo = request.args.get("q", "").strip()
#
#    if not termo:
#        return jsonify([])
#
#    palavras = termo.lower().split()
#
#    query = Produto.query.filter(Produto.JPC_MOSTRA_REPOSICAO.in_([1, True]))
#
#    filtros = []
#    for palavra in palavras:
#        like = f"%{palavra}%"
#        filtros.append(Produto.JRO_DESCRI.ilike(like))
#        filtros.append(Produto.JPC_PALAVRAS_CHAVE.ilike(like))
#        filtros.append(Produto.JRO_PROERP.ilike(like))
#
#    query = query.filter(or_(*filtros))
#    resultados = query.all()
#
#    return jsonify([p.to_dict() for p in resultados])
