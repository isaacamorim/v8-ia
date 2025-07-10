from flask import Blueprint, request, jsonify, session
from ..extensions import db, bcrypt
from ..models.cliente import Cliente
from ..utils.auth_utils import validar_documento, gerar_senha_padrao

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/check-cnpj", methods=["POST"])
def check_cnpj():
    data = request.json
    doc = data.get("cnpj")
    if not doc or not validar_documento(doc):
        return jsonify({"error": "Documento inválido."}), 400

    cliente = Cliente.query.filter_by(JND_CODERP=doc).first()
    if not cliente:
        return jsonify({"exists": False, "mensagem": "CNPJ não encontrado."}), 200

    if not cliente.JND_SENHA_HASH:
        padrao = gerar_senha_padrao(doc)
        cliente.JND_SENHA_HASH = bcrypt.generate_password_hash(padrao).decode()
        db.session.commit()
        return jsonify({"exists": True, "senha_definida": False, "mensagem": "Senha padrão definida."}), 200

    return jsonify({"exists": True, "senha_definida": True, "mensagem": "Senha já cadastrada."}), 200

@auth_bp.route("/definir-senha", methods=["POST"])
def definir_senha():
    data = request.json
    doc = data.get("cnpj")
    nova_senha = data.get("nova_senha")
    if not doc or not nova_senha:
        return jsonify({"error": "CNPJ e nova senha são obrigatórios."}), 400

    cliente = Cliente.query.filter_by(JND_CODERP=doc).first()
    if not cliente:
        return jsonify({"error": "Cliente não encontrado."}), 404

    cliente.JND_SENHA_HASH = bcrypt.generate_password_hash(nova_senha).decode()
    db.session.commit()
    return jsonify({"mensagem": "Senha definida com sucesso."}), 200
