from flask import Blueprint, request, jsonify, session
from app import db, bcrypt
from models.cliente import Cliente
from utils.auth_utils import validar_documento, gerar_senha_padrao

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/check-cnpj", methods=["POST"])
def check_cnpj():
    data = request.json
    doc = data.get("cnpj")
    if not validar_documento(doc):
        return jsonify({"error": "Documento inválido."}), 400
    cliente = Cliente.query.filter_by(JND_CODERP=doc).first()
    if not cliente:
        # TODO: enviar notificação via WhatsApp sobre novo CNPJ
        return jsonify({"exists": False}), 200

    if not cliente.JND_SENHA_HASH:
        padrao = gerar_senha_padrao(doc)
        cliente.JND_SENHA_HASH = bcrypt.generate_password_hash(padrao).decode()
        db.session.commit()
    return jsonify({"exists": True}), 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    doc = data.get("cnpj")
    senha = data.get("senha")
    cliente = Cliente.query.filter_by(JND_CODERP=doc).first()
    if not cliente or not cliente.check_password(senha, bcrypt):
        return jsonify({"error": "Credenciais incorretas."}), 401
    session["cliente"] = cliente.JND_CODERP
    return jsonify({"message": "Login bem-sucedido."}), 200
