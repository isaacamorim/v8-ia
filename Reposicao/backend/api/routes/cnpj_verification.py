# ========== 3. routes/cnpj_verification.py ==========
from flask import Blueprint, request, jsonify, session
from ..models.cliente import Cliente
from ..utils.cnpj_utils import (
    limpar_cnpj,
    validar_documento,
    gerar_senha_padrao,
    formatar_documento,
)
from ..utils.auth_utils import (
    hash_senha,
    verificar_senha,
    criar_sessao_usuario,
)
from ..extensions import db

cnpj_bp = Blueprint("cnpj", __name__)


@cnpj_bp.route("/verificar", methods=["POST", "GET"])
def verificar_cnpj():
    """Verifica se CNPJ/CPF existe no sistema"""
    try:
        if request.method == "POST":
            data = request.get_json()
            documento = data.get("documento", "").strip() if data else ""
        else:  # GET
            documento = request.args.get("documento", "").strip()

        if not documento:
            return (
                jsonify({"status": "erro", "mensagem": "Documento não fornecido"}),
                400,
            )

        if not validar_documento(documento):
            return jsonify({"status": "erro", "mensagem": "Documento inválido"}), 400

        cnpj_limpo = limpar_cnpj(documento)
        cliente = Cliente.query.filter_by(JND_NUMCGC=cnpj_limpo).first()

        if cliente:
            tem_senha = bool(cliente.JNC_SENHA_HASH)
            return (
                jsonify(
                    {
                        "status": "existente",
                        "requires_password": tem_senha,
                        "documento_formatado": formatar_documento(documento),
                        "nome": cliente.NUMDOC or "Cliente",
                        "social": cliente.JMP_ERAZAO,
                        "mensagem": (
                            "CNPJ encontrado no sistema"
                            if tem_senha
                            else "Defina sua senha para continuar"
                        ),
                    }
                ),
                200,
            )

        else:
            return (
                jsonify(
                    {
                        "status": "nao_encontrado",
                        "documento_formatado": formatar_documento(documento),
                        "mensagem": "CNPJ/CPF não cadastrado. Solicite acesso à nossa empresa.",
                    }
                ),
                200,
            )

    except Exception as e:
        return jsonify({"status": "erro", "mensagem": f"Erro interno: {str(e)}"}), 500


@cnpj_bp.route("/login", methods=["POST"])
def fazer_login():
    """Faz login com CNPJ/CPF e senha"""
    try:
        data = request.get_json()
        documento = data.get("documento", "").strip()
        senha = data.get("senha", "").strip()

        if not documento or not senha:
            return jsonify({"error": "Documento e senha são obrigatórios"}), 400

        if not validar_documento(documento):
            return jsonify({"error": "Documento inválido"}), 400

        cnpj_limpo = limpar_cnpj(documento)
        cliente = Cliente.query.filter_by(JND_CODERP=cnpj_limpo).first()

        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404

        if not cliente.JNC_SENHA_HASH:
            return (
                jsonify({"error": "Senha não definida. Defina sua senha primeiro."}),
                400,
            )

        # Verificar senha
        if not verificar_senha(senha, cliente.JNC_SENHA_HASH):
            return jsonify({"error": "Senha incorreta"}), 401

        # Criar sessão
        criar_sessao_usuario(
            cliente.JND_ENDID,
            formatar_documento(documento),
            cliente.JND_CONTAT or "Cliente",
        )

        return (
            jsonify(
                {
                    "success": True,
                    "mensagem": "Login realizado com sucesso",
                    "usuario": {
                        "nome": cliente.NUMDOC or "Cliente",
                        "cnpj": formatar_documento(documento),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500


@cnpj_bp.route("/definir-senha", methods=["POST"])
def definir_senha():
    """Define senha para cliente que não possui"""
    try:
        data = request.get_json()
        documento = data.get("documento", "").strip()
        senha = data.get("senha", "").strip()

        if not documento or not senha:
            return jsonify({"error": "Documento e senha são obrigatórios"}), 400

        if not validar_documento(documento):
            return jsonify({"error": "Documento inválido"}), 400

        if len(senha) < 4:
            return jsonify({"error": "Senha deve ter pelo menos 4 caracteres"}), 400

        cnpj_limpo = limpar_cnpj(documento)
        cliente = Cliente.query.filter_by(JND_CODERP=cnpj_limpo).first()

        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404

        # Verificar se já tem senha definida
        if cliente.JND_SENHA_HASH:
            return jsonify({"error": "Cliente já possui senha definida"}), 400

        # Definir senha
        cliente.JND_SENHA_HASH = hash_senha(senha)
        db.session.commit()

        # Fazer login automaticamente
        criar_sessao_usuario(
            cliente.JND_ENDID,
            formatar_documento(documento),
            cliente.JND_CONTAT or "Cliente",
        )

        return (
            jsonify(
                {
                    "success": True,
                    "mensagem": "Senha definida e login realizado com sucesso",
                    "usuario": {
                        "nome": cliente.NUMDOC or "Cliente",
                        "cnpj": formatar_documento(documento),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500


@cnpj_bp.route("/alterar-senha", methods=["PUT"])
def alterar_senha():
    """Altera senha do usuário logado"""
    try:
        if not session.get("usuario_logado"):
            return jsonify({"error": "Login necessário"}), 401

        data = request.get_json()
        senha_atual = data.get("senha_atual", "").strip()
        senha_nova = data.get("senha_nova", "").strip()

        if not senha_atual or not senha_nova:
            return jsonify({"error": "Senha atual e nova senha são obrigatórias"}), 400

        if len(senha_nova) < 4:
            return (
                jsonify({"error": "Nova senha deve ter pelo menos 4 caracteres"}),
                400,
            )

        cliente_id = session.get("cliente_id")
        cliente = Cliente.query.get(cliente_id)

        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404

        # Verificar senha atual
        if not verificar_senha(senha_atual, cliente.JND_SENHA_HASH):
            return jsonify({"error": "Senha atual incorreta"}), 401

        # Alterar senha
        cliente.JND_SENHA_HASH = hash_senha(senha_nova)
        db.session.commit()

        return jsonify({"success": True, "mensagem": "Senha alterada com sucesso"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500


@cnpj_bp.route("/logout", methods=["POST"])
def fazer_logout():
    """Faz logout do usuário"""
    try:
        session.clear()
        return (
            jsonify({"success": True, "mensagem": "Logout realizado com sucesso"}),
            200,
        )
    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500


@cnpj_bp.route("/status", methods=["GET"])
def verificar_status():
    """Verifica se usuário está logado"""
    try:
        if session.get("usuario_logado"):
            return (
                jsonify(
                    {
                        "logado": True,
                        "usuario": {
                            "nome": session.get("nome"),
                            "cnpj": session.get("cnpj"),
                        },
                    }
                ),
                200,
            )
        else:
            return jsonify({"logado": False}), 200
    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500


@cnpj_bp.route("/sugerir-senha", methods=["POST"])
def sugerir_senha():
    """Sugere senha padrão baseada no documento"""
    try:
        data = request.get_json()
        documento = data.get("documento", "").strip()

        if not documento:
            return jsonify({"error": "Documento não fornecido"}), 400

        if not validar_documento(documento):
            return jsonify({"error": "Documento inválido"}), 400

        senha_sugerida = gerar_senha_padrao(documento)

        return (
            jsonify(
                {
                    "success": True,
                    "senha_sugerida": senha_sugerida,
                    "mensagem": f"Senha sugerida: {senha_sugerida} (últimos 4 dígitos do documento)",
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500
    