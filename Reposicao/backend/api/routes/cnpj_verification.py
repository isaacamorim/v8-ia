from flask import Blueprint, request, jsonify
from backend.api.models.cliente import Cliente
from backend.api.utils.cnpj_utils import limpar_cnpj, validar_documento
from backend.api.app import db, bcrypt

cnpj_bp = Blueprint("cnpj", __name__)


@cnpj_bp.route("/verificar", methods=["POST"])
def verificar_cnpj():
    data = request.get_json()
    documento = data.get("documento")

    if not documento:
        return jsonify({"error": "Documento não fornecido"}), 400

    if not validar_documento(documento):
        return jsonify({"error": "Documento inválido"}), 400

    cnpj_limpo = limpar_cnpj(documento)

    # Consultar banco principal
    cliente = Cliente.query.filter_by(JND_CODERP=cnpj_limpo).first()

    if cliente:
        return jsonify(
            {
                "status": "existente",
                "requires_password": bool(cliente.JND_SENHA_HASH),
                "mensagem": (
                    "CNPJ encontrado no sistema"
                    if cliente.JND_SENHA_HASH
                    else "Defina sua senha para continuar"
                ),
            }
        )
    else:
        return jsonify(
            {
                "status": "nao_encontrado",
                "mensagem": "CNPJ não cadastrado. Solicite acesso!",
            }
        )


@cnpj_bp.route("/definir-senha", methods=["POST"])
def definir_senha():
    data = request.get_json()
    documento = data.get("documento")
    senha = data.get("senha")

    if not all([documento, senha]):
        return jsonify({"error": "Dados incompletos"}), 400

    cnpj_limpo = limpar_cnpj(documento)
    cliente = Cliente.query.filter_by(JND_CODERP=cnpj_limpo).first()

    if not cliente:
        return jsonify({"error": "Cliente não encontrado"}), 404

    # Gerar hash da senha
    senha_hash = bcrypt.generate_password_hash(senha).decode("utf-8")
    cliente.JND_SENHA_HASH = senha_hash

    try:
        db.session.commit()
        return jsonify({"success": True, "mensagem": "Senha definida com sucesso!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
