# backend/api/laser/controllers_v2.py

from flask import Blueprint, request, jsonify, send_file
import cx_Oracle
import os
from datetime import datetime, timedelta

# Ajuste para importar a configuração do banco de dados do local correto
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PATH_TO_BACKEND_CONFIG = os.path.join(
    SCRIPT_DIR, "..", "..", "config"
)  # Navega duas pastas acima para backend/config
sys.path.insert(0, PATH_TO_BACKEND_CONFIG)

try:
    from db_config import get_db_connection
except ImportError as e:
    print(f"Erro ao importar 'get_db_connection' de 'db_config': {e}")
    try:
        sys.path.insert(
            0, os.path.join(os.path.dirname(__file__), "..", "..")
        )  # backend/
        from config.db_config import get_db_connection
    except ImportError:
        raise ImportError(
            "Não foi possível encontrar db_config.py. Verifique o PYTHONPATH e a estrutura do projeto."
        )

laser_v2_bp = Blueprint("laser_v2_bp", __name__, url_prefix="/api/laser")


@laser_v2_bp.route("/sequencing_v2", methods=["GET"])
def get_sequencing_v2():
    operator_code = request.args.get("operator_code")
    if not operator_code:
        return (
            jsonify({"success": False, "error": "Código do operador não fornecido"}),
            400,
        )

    query = """
    SELECT i.SOC_CODIOF, i.SOC_COLABID, i.SOC_SEQUEN, i.SOC_EMPRESA, i.SOC_CODSEQ, 
                c.JLB_CODERP, c.JLB_NOMECB,
                p.JRO_PROERP, p.JRO_DESCRI, p.JRO_UNIMED,
                o.JOF_QTPROG AS QUANTIDADE_PROGRAMADA,
                SUM(l.JFL_QTREAL) AS QUANTIDADE_REALIZADA,
                pc.JPC_DESENHO_ENG
            FROM I_SEQ_OF_COLAB i
            JOIN J_COLAB c ON i.SOC_COLABID = c.JLB_COLABID
            JOIN J_OF o ON o.JOF_CODIOF = i.SOC_CODIOF AND o.JOF_EMPRESA = i.SOC_EMPRESA AND o.JOF_DATA_EXCLUSAO IS NULL AND o.JOF_DTENCE IS NULL
            JOIN J_PRODUTO p ON p.JRO_PROID = o.JOF_PROID
            LEFT JOIN J_PRODUTO_COMPLEMENTO pc ON pc.JPC_PROID = o.JOF_PROID
            LEFT JOIN J_OFLANC l ON l.JFL_CODIOF = i.SOC_CODIOF AND l.JFL_CODSEQ = i.SOC_CODSEQ AND l.JFL_EMPRESA = i.SOC_EMPRESA AND l.JFL_DATA_EXCLUSAO IS NULL
        WHERE i.SOC_DATA_EXCLUSAO IS NULL
            AND c.JLB_CODERP = :operator_code
        GROUP BY i.SOC_CODIOF, i.SOC_COLABID, i.SOC_SEQUEN, i.SOC_EMPRESA, i.SOC_CODSEQ, 
                c.JLB_CODERP, c.JLB_NOMECB,
                p.JRO_PROERP, p.JRO_DESCRI, p.JRO_UNIMED,
                o.JOF_QTPROG,
                pc.JPC_DESENHO_ENG
        ORDER BY i.SOC_EMPRESA, i.SOC_SEQUEN
    """

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, operator_code=operator_code)

        columns = [col[0] for col in cursor.description]
        jobs = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return jsonify({"success": True, "jobs": jobs})
    except cx_Oracle.Error as e:
        print(f"Erro Oracle ao buscar sequenciamento: {e}")
        return jsonify({"success": False, "error": f"Erro no banco de dados: {e}"}), 500
    except Exception as e:
        print(f"Erro inesperado ao buscar sequenciamento: {e}")
        return (
            jsonify({"success": False, "error": f"Erro inesperado no servidor: {e}"}),
            500,
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@laser_v2_bp.route("/download_step", methods=["GET"])
def download_step_file():
    file_path = request.args.get("file_path")
    if not file_path:
        return (
            jsonify({"success": False, "error": "Caminho do arquivo não fornecido"}),
            400,
        )

    if ".." in file_path:
        return jsonify({"success": False, "error": "Caminho de arquivo inválido"}), 400

    try:
        if os.path.exists(file_path) and os.path.isfile(file_path):
            file_name = os.path.basename(file_path)
            return send_file(file_path, as_attachment=True, download_name=file_name)
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Arquivo .step não encontrado ou não é um arquivo válido",
                    }
                ),
                404,
            )
    except Exception as e:
        print(f"Erro ao tentar acessar o arquivo .step: {e}")
        return (
            jsonify(
                {"success": False, "error": f"Erro no servidor ao acessar arquivo: {e}"}
            ),
            500,
        )


@laser_v2_bp.route("/submit_apontamento", methods=["POST"])
def submit_apontamento():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Dados não fornecidos"}), 400

    # Adicionado 'soc_empresa' aos campos obrigatórios
    required_fields = [
        "of_numero",
        "operador_codigo",
        "data_inicio",
        "tempo_total_pdf",
        "quantidade_realizada",
        "soc_codseq",
        "soc_empresa",
    ]
    for field in required_fields:
        if field not in data or data[field] is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Campo obrigatório ausente ou nulo: {field}",
                    }
                ),
                400,
            )

    of_numero = data.get("of_numero")
    operador_codigo = data.get("operador_codigo")
    data_inicio_str = data.get("data_inicio")
    tempo_total_pdf_str = data.get("tempo_total_pdf")
    quantidade_realizada = data.get("quantidade_realizada")
    soc_codseq = data.get("soc_codseq")
    soc_empresa = data.get("soc_empresa")  # Novo campo empresa

    try:
        dt_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d %H:%M:%S")
        time_parts = tempo_total_pdf_str.split(":")
        hours = int(time_parts[0])
        minutes = int(time_parts[1])
        seconds_micro = time_parts[2].split(".")
        seconds = int(seconds_micro[0])
        microseconds = int(seconds_micro[1]) * 1000
        delta_tempo = timedelta(
            hours=hours, minutes=minutes, seconds=seconds, microseconds=microseconds
        )
        dt_afim = dt_inicio + delta_tempo
        quantidade_realizada = int(quantidade_realizada)

    except ValueError as ve:
        print(f"Erro ao converter datas/horas/quantidade: {ve}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": f"Formato de data/hora/quantidade inválido: {ve}",
                }
            ),
            400,
        )
    except Exception as e:
        print(f"Erro no processamento de dados: {e}")
        return (
            jsonify({"success": False, "error": f"Erro ao processar dados: {e}"}),
            500,
        )

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Adicionado SOF_EMPRESA ao INSERT
        sql_insert = """
        INSERT INTO S_APONTAMENTO_OF 
            (SOF_CODIOF, SOF_OPERAD, SOF_DTINIC, SOF_DTAFIM, SOF_OPERAC, SOF_QNTBOA, SOF_EMPRESA, SOF_DATCAD)
        VALUES 
            (:of_numero, :operador_codigo, :dt_inicio, :dt_afim, :soc_codseq, :quantidade_realizada, :soc_empresa, SYSDATE)
        """

        cursor.execute(
            sql_insert,
            of_numero=of_numero,
            operador_codigo=operador_codigo,
            dt_inicio=dt_inicio,
            dt_afim=dt_afim,
            soc_codseq=soc_codseq,
            quantidade_realizada=quantidade_realizada,
            soc_empresa=soc_empresa,
        )  # Novo parâmetro empresa
        conn.commit()
        return jsonify(
            {"success": True, "message": "Apontamento registrado com sucesso!"}
        )

    except cx_Oracle.Error as e:
        print(f"Erro Oracle ao registrar apontamento: {e}")
        (error_obj,) = e.args
        return (
            jsonify(
                {
                    "success": False,
                    "error": f"Erro no banco de dados ao registrar apontamento: {error_obj.message}",
                }
            ),
            500,
        )
    except Exception as e:
        print(f"Erro inesperado ao registrar apontamento: {e}")
        return (
            jsonify({"success": False, "error": f"Erro inesperado no servidor: {e}"}),
            500,
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# --- INICIAR APONTAMENTO ---
@laser_v2_bp.route("/apontamento/start", methods=["POST"])
def start_apontamento():
    data = request.get_json()
    required_fields = ["of_id", "empresa_id", "operator_code"]
    for field in required_fields:
        if field not in data:
            return (
                jsonify(
                    {"success": False, "error": f"Campo obrigatório ausente: {field}"}
                ),
                400,
            )

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Garantir que SOF_CODTUR seja sempre 1, mesmo se não vier do frontend
        # Garantir que SOF_OPERAC tenha um valor padrão (1) se não for fornecido
        sql = """
            INSERT INTO S_APONTAMENTO_OF 
            (SOF_CODIOF, SOF_OPERAD, SOF_DTINIC, SOF_STATUS, SOF_EMPRESA, SOF_OPERAC, SOF_CODTUR, SOF_DATCAD)
            VALUES 
            (:of_id, :operator_code, SYSDATE, 'A', :empresa_id, :operac, 1, SYSDATE)
            RETURNING SOF_APONTAOFID INTO :new_id
        """
        new_id = cursor.var(int)
        cursor.execute(
            sql,
            {
                "of_id": data["of_id"],
                "operator_code": data["operator_code"],
                "empresa_id": data["empresa_id"],
                "operac": data.get("operac", 1),  # Valor padrão 1 se não for fornecido
                "new_id": new_id,
            },
        )
        conn.commit()
        return jsonify({"success": True, "apontamento_id": new_id.getvalue()[0]})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# --- PAUSAR APONTAMENTO ---
@laser_v2_bp.route("/apontamento/pause", methods=["POST"])
def pause_apontamento():
    data = request.get_json()
    apontamento_id = data.get("apontamento_id")
    if not apontamento_id:
        return (
            jsonify({"success": False, "error": "ID do apontamento não informado"}),
            400,
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
            UPDATE S_APONTAMENTO_OF
            SET SOF_DTAFIM = SYSDATE
            WHERE SOF_APONTAOFID = :id
        """
        cursor.execute(sql, {"id": apontamento_id})
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# --- FINALIZAR MANUALMENTE ---
@laser_v2_bp.route("/apontamento/finish", methods=["POST"])
def finish_apontamento():
    data = request.get_json()
    apontamento_id = data.get("apontamento_id")
    quantidade = data.get("quantidade_boa")

    if not apontamento_id or quantidade is None:
        return jsonify({"success": False, "error": "Dados obrigatórios ausentes"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        sql = """
            UPDATE S_APONTAMENTO_OF
            SET SOF_DTAFIM = SYSDATE,
                SOF_QNTBOA = :qtd,
                SOF_STATUS = 'C'
            WHERE SOF_APONTAOFID = :id
        """
        cursor.execute(sql, {"id": apontamento_id, "qtd": quantidade})
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# --- LISTAR APONTAMENTOS DA OF ---
@laser_v2_bp.route("/apontamento/list/<string:of_id>", methods=["GET"])
def list_apontamentos(of_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        sql = """
            SELECT 
                SOF_CODIOF,
                SOF_OPERAD,
                TO_CHAR(SOF_DTINIC, 'DD/MM/YYYY HH24:MI:SS') AS SOF_DTINIC,
                TO_CHAR(SOF_DTAFIM, 'DD/MM/YYYY HH24:MI:SS') AS SOF_DTAFIM,
                SOF_QNTBOA
            FROM S_APONTAMENTO_OF 
            WHERE SOF_CODIOF = :of_id
            ORDER BY SOF_DTINIC DESC
        """
        cursor.execute(sql, {"of_id": of_id})
        results = cursor.fetchall()

        apontamentos = []
        for row in results:
            apontamentos.append(
                {
                    "SOF_CODIOF": row[0],
                    "SOF_OPERAD": row[1],
                    "SOF_DTINIC": row[2],
                    "SOF_DTAFIM": row[3],
                    "SOF_QNTBOA": row[4],
                }
            )

        return jsonify(
            {"success": True, "apontamentos": apontamentos, "total": len(apontamentos)}
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# --- CONFIRMAR EM LOTE OS PDFs PENDENTES ---
@laser_v2_bp.route("/apontamento/confirm_batch", methods=["POST"])
def confirm_batch():
    data = request.get_json()
    apontamento_id = data.get("apontamento_id")
    items = data.get("items", [])
    operator_code = data.get("operator_code")
    soc_empresa = data.get("soc_empresa")
    soc_codseq = data.get("soc_codseq")

    if not apontamento_id or not operator_code or not soc_empresa or not soc_codseq:
        return (
            jsonify({"success": False, "error": "Dados obrigatórios ausentes"}),
            400,
        )

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Processar cada item
        for item in items:
            data_inicio_str = item.get("start_time")
            tempo_total_pdf_str = item.get("total_time")
            quantidade_realizada = item.get("qtd_apontar", 0)

            try:
                # Converter datas e tempos (mesma lógica do submit_apontamento)
                dt_inicio = datetime.strptime(data_inicio_str, "%Y-%m-%d %H:%M:%S")
                time_parts = tempo_total_pdf_str.split(":")
                hours = int(time_parts[0])
                minutes = int(time_parts[1])
                seconds_micro = time_parts[2].split(".")
                seconds = int(seconds_micro[0])
                microseconds = int(seconds_micro[1]) * 1000
                delta_tempo = timedelta(
                    hours=hours,
                    minutes=minutes,
                    seconds=seconds,
                    microseconds=microseconds,
                )
                dt_afim = dt_inicio + delta_tempo
                quantidade_realizada = int(quantidade_realizada)

            except Exception as e:
                print(f"Erro no processamento de dados do item: {e}")
                continue  # Pula item inválido mas continua processando os demais

            try:
                # Inserir apontamento (mesmo insert do submit_apontamento)
                sql_insert = """
                INSERT INTO S_APONTAMENTO_OF 
                    (SOF_CODIOF, SOF_OPERAD, SOF_DTINIC, SOF_DTAFIM, 
                     SOF_OPERAC, SOF_QNTBOA, SOF_EMPRESA, SOF_DATCAD)
                VALUES 
                    (:of_numero, :operador_codigo, :dt_inicio, :dt_afim, 
                     :soc_codseq, :quantidade_realizada, :soc_empresa, SYSDATE)
                """

                cursor.execute(
                    sql_insert,
                    of_numero=apontamento_id,
                    operador_codigo=operator_code,
                    dt_inicio=dt_inicio,
                    dt_afim=dt_afim,
                    soc_codseq=soc_codseq,
                    quantidade_realizada=quantidade_realizada,
                    soc_empresa=soc_empresa,
                )

            except cx_Oracle.Error as e:
                print(f"Erro Oracle ao registrar item: {e}")
                conn.rollback()
                return (
                    jsonify(
                        {"success": False, "error": f"Erro no banco de dados: {e}"}
                    ),
                    500,
                )

        conn.commit()
        return jsonify(
            {
                "success": True,
                "message": f"{len(items)} apontamentos registrados com sucesso!",
            }
        )

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro inesperado: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
