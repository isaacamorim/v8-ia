# ========== 3. routes/cnpj_verification.py ==========
from flask import Blueprint, request, jsonify, session
from sqlalchemy.sql import text
from ..models.cliente import Cliente
from ..utils.cnpj_utils import (
    limpar_cnpj,
    validar_documento,
    gerar_senha_padrao,
    formatar_documento,
    limpar_documento,
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
    try:
        # Coleta do documento
        if request.method == "POST":
            data = request.get_json()
            documento = data.get("documento", "").strip() if data else ""
        else:
            documento = request.args.get("documento", "").strip()

        if not documento:
            return (
                jsonify({"status": "erro", "mensagem": "Documento não fornecido"}),
                400,
            )

        if not validar_documento(documento):
            return jsonify({"status": "erro", "mensagem": "Documento inválido"}), 400

        cnpj_limpo = limpar_documento(documento)

        sql = text(
            """
            SELECT 
                JND_ENDID, 
                JMP_NFANTA, 
                JND_DESCRI, 
                JND_NUMCGC,  
                JMP_ERAZAO,
                JNC_SENHA_HASH
            FROM J_V_ENDERECO_COMPLEMENTO
            WHERE JND_NUMCGC = :cnpj
                AND JMP_TIPEMP = 'B'
        """
        )
        res = db.session.execute(sql, {"cnpj": cnpj_limpo}).mappings().fetchone()

        if res:
            senha_hash = res["jnc_senha_hash"]

            if senha_hash and senha_hash.strip():
                # Caso 1: tem senha
                return (
                    jsonify(
                        {
                            "status": "existente_com_senha",
                            "requires_password": True,
                            "documento_formatado": formatar_documento(documento),
                            "nome": res["jmp_erazao"],
                            "social": res["jmp_nfanta"],
                            "mensagem": "CNPJ/CPF encontrado. Digite sua senha para continuar.",
                        }
                    ),
                    200,
                )
            else:
                # Caso 2: não tem senha definida
                return (
                    jsonify(
                        {
                            "status": "existente_sem_senha",
                            "requires_password": False,
                            "documento_formatado": formatar_documento(documento),
                            "nome": res["jmp_erazao"],
                            "social": res["jmp_nfanta"],
                            "mensagem": "CNPJ/CPF encontrado. Defina uma senha para continuar.",
                        }
                    ),
                    200,
                )

        # Caso 3: não encontrado
        return (
            jsonify(
                {
                    "status": "nao_encontrado",
                    "documento_formatado": formatar_documento(documento),
                    "mensagem": "CNPJ/CPF não cadastrado.",
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"status": "erro", "mensagem": f"Erro interno: {str(e)}"}), 500

@cnpj_bp.route("/login", methods=["POST"])
def fazer_login():
    try:
        data = request.get_json()
        documento = data.get("documento", "").strip()
        senha = data.get("senha", "").strip()

        if not documento or not senha:
            return jsonify({"error": "Documento e senha são obrigatórios"}), 400

        if not validar_documento(documento):
            return jsonify({"error": "Documento inválido"}), 400

        cnpj_limpo = limpar_documento(documento)

        sql = text(
            """
            SELECT JND_ENDID, JND_DESCRI, NUMDOC
            FROM J_V_ENDERECO_COMPLEMENTO
            WHERE JND_NUMCGC = :cnpj
                AND JMP_TIPEMP = 'B'
                AND JNC_SENHA_HASH = J_CRIPT(P_PASSWORD => :senha)
        """
        )
        res = (
            db.session.execute(sql, {"cnpj": cnpj_limpo, "senha": senha})
            .mappings()
            .fetchone()
        )

        if not res:
            return jsonify({"error": "Senha incorreta ou CNPJ não encontrado"}), 401

        criar_sessao_usuario(
            res["jnd_endid"],
            formatar_documento(documento),
            res["jnd_descri"] or "Cliente",
        )

        return (
            jsonify(
                {
                    "success": True,
                    "mensagem": "Login realizado com sucesso",
                    "usuario": {
                        "nome": res["numdoc"] or "Cliente",
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
    """
    Define a senha para quem ainda não tem.
    Recebe JSON: { documento: string, senha: string }
    """
    try:
        data = request.get_json() or {}
        documento = data.get("documento", "").strip()
        senha = data.get("senha", "").strip()

        # validações básicas
        if not documento or not senha:
            return jsonify({"error": "Documento e senha são obrigatórios"}), 400
        if not validar_documento(documento):
            return jsonify({"error": "Documento inválido"}), 400
        if len(senha) < 4:
            return jsonify({"error": "Senha deve ter pelo menos 4 caracteres"}), 400

        cnpj_limpo = limpar_cnpj(documento)

        # buscar cliente na view
        cliente = (
            db.session.execute(
                text(
                    """
                    SELECT 
                        JND_ENDID, 
                        JND_NUMCGC, 
                        JNC_SENHA_HASH
                    FROM J_V_ENDERECO_COMPLEMENTO
                    WHERE JND_NUMCGC = :cnpj
                        AND JMP_TIPEMP = 'B'
                """
                ),
                {"cnpj": cnpj_limpo},
            )
            .mappings()
            .fetchone()
        )

        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404

        # se já tiver senha
        if cliente["jnc_senha_hash"]:
            return jsonify({"error": "Senha já definida"}), 400

        # grava nova senha criptografada no *tabela base* J_ENDERE
        db.session.execute(
            text(
                """
                UPDATE J_ENDERECO_COMPLEMENTO
                SET JNC_SENHA_HASH = J_CRIPT(P_PASSWORD => :senha)
                WHERE JNC_ENDID = :endid
            """
            ),
            {"senha": senha, "endid": cliente["jnd_endid"]},
        )
        db.session.commit()

        # criar sessão e retornar sucesso
        criar_sessao_usuario(
            cliente["jnd_endid"], formatar_documento(documento), "Cliente"
        )

        return (
            jsonify(
                {
                    "success": True,
                    "mensagem": "Senha definida e login realizado com sucesso",
                    "usuario": {
                        "nome": formatar_documento(documento),
                        "cnpj": formatar_documento(documento),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500


@cnpj_bp.route("/sugerir-senha", methods=["POST"])
def sugerir_senha():
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

@cnpj_bp.route("/logout", methods=["POST"])
def fazer_logout():
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
def sugerir_senha_api():
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
