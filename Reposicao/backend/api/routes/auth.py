from flask import Blueprint, request, jsonify
from utils.validators import validar_documento, gerar_senha_padrao
from utils.auth_utils import hash_senha, verificar_senha
import cx_Oracle
from datetime import datetime

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/check-cnpj", methods=["POST"])
def check_cnpj():
    documento = request.json.get("documento")

    valido, tipo = validar_documento(documento)
    if not valido:
        return jsonify({"success": False, "error": "Documento inválido"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT END_CODEND, END_RAZAO, JND_ATIVO_PORTAL, JND_SENHA_HASH FROM J_ENDERE WHERE END_CGC = :cgc",
            [documento],
        )
        result = cursor.fetchone()

        if result:
            cliente_id, razao_social, ativo_portal, senha_hash = result
            return jsonify(
                {
                    "success": True,
                    "existe": True,
                    "tem_senha": senha_hash is not None,
                    "cliente": {
                        "id": cliente_id,
                        "nome": razao_social,
                        "ativo": ativo_portal == "S",
                    },
                }
            )
        else:
            return jsonify({"success": True, "existe": False})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    documento = request.json.get("documento")
    senha = request.json.get("senha")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT END_CODEND, END_RAZAO, JND_SENHA_HASH FROM J_ENDERE WHERE END_CGC = :cgc",
            [documento],
        )
        result = cursor.fetchone()

        if result:
            cliente_id, razao_social, senha_hash = result
            if verificar_senha(senha, senha_hash):
                return jsonify(
                    {
                        "success": True,
                        "cliente": {"id": cliente_id, "nome": razao_social},
                    }
                )
            else:
                return jsonify({"success": False, "error": "Senha incorreta"}), 401
        else:
            return jsonify({"success": False, "error": "Documento não encontrado"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@auth_bp.route("/definir-senha", methods=["POST"])
def definir_senha():
    documento = request.json.get("documento")
    senha = request.json.get("senha")

    if len(senha) < 4:
        return (
            jsonify(
                {"success": False, "error": "A senha deve ter pelo menos 4 caracteres"}
            ),
            400,
        )

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        senha_hash = hash_senha(senha)

        cursor.execute(
            """
            UPDATE J_ENDERE 
            SET JND_SENHA_HASH = :senha_hash,
                JND_ATIVO_PORTAL = 'S',
                JND_DATA_CADASTRO_PORTAL = SYSDATE
            WHERE END_CGC = :cgc
            """,
            [senha_hash, documento],
        )

        if cursor.rowcount == 0:
            return jsonify({"success": False, "error": "Documento não encontrado"}), 404

        conn.commit()
        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
