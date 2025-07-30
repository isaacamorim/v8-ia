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
        # Obtenção do documento (mantido igual)
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

        # CONSULTA CORRIGIDA (sem alias conflitante)
        sql = text(
            """
            SELECT 
                JND_ENDID, 
                JMP_NFANTA, 
                JND_NUMCGC,  
                NUMDOC,      
                JMP_ERAZAO
            FROM J_V_ENDERECO_COMPLEMENTO
            WHERE JND_NUMCGC = :cnpj
                AND JMP_TIPEMP = 'B'
            """
        )
        res = db.session.execute(sql, {"cnpj": cnpj_limpo}).mappings().fetchone()

        if res:
            # Acesse as colunas EM MINÚSCULAS conforme mostrado no log
            return (
                jsonify(
                    {
                        "status": "existente",
                        "documento_formatado": res["numdoc"], 
                        "nome": res["jmp_erazao"],  # minúscula
                        "fantasia": res["jmp_nfanta"],  # minúscula
                        "mensagem": "CNPJ/CPF encontrado.",
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
    try:
        data = request.get_json()
        documento = data.get("documento", "").strip()
        senha = data.get("senha", "").strip()

        if not documento or not senha:
            return jsonify({"error": "Documento e senha são obrigatórios"}), 400

        if not validar_documento(documento):
            return jsonify({"error": "Documento inválido"}), 400

        if len(senha) < 4:
            return jsonify({"error": "A senha deve ter pelo menos 4 caracteres"}), 400

        cnpj_limpo = limpar_documento(documento)

        # Buscar cliente
        cliente = (
            db.session.execute(
                text(
                    """
                SELECT jnd_endid, jnd_descri, numdoc, jnc_senha_hash
                FROM j_v_endereco_complemento
                WHERE jnd_numcgc = :cnpj AND jmp_tipemp = 'B'
            """
                ),
                {"cnpj": cnpj_limpo},
            )
            .mappings()
            .fetchone()
        )

        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404

        if cliente["jnc_senha_hash"]:
            return jsonify({"error": "Senha já cadastrada"}), 400

        # Atualizar senha
        db.session.execute(
            text(
                """
                UPDATE j_endere
                SET jnc_senha_hash = J_CRIPT(P_PASSWORD => :senha)
                WHERE jnd_endid = :endid
            """
            ),
            {"senha": senha, "endid": cliente["jnd_endid"]},
        )
        db.session.commit()

        # Criar sessão (se desejar)
        criar_sessao_usuario(
            cliente["jnd_endid"], formatar_documento(documento), cliente["jnd_descri"]
        )

        return (
            jsonify(
                {
                    "success": True,
                    "mensagem": "Senha definida com sucesso",
                    "usuario": {
                        "nome": cliente["numdoc"],
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
