import os
import sys
import cx_Oracle

# Ajuste o path para encontrar o módulo de configuração do banco
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PATH_TO_BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, PATH_TO_BACKEND_DIR)

try:
    from config.db_config import get_db_connection
except ImportError as e:
    print(f"Erro ao importar 'get_db_connection' de 'config.db_config': {e}")
    sys.exit(1)

# Funções de teste incremental para diagnosticar passo a passo


def test_connection():
    """Testa se a conexão com o banco funciona e retorna uma versão do Oracle."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM v$version")
        version = cursor.fetchone()
        print("Versão do Oracle:", version[0] if version else version)
    except cx_Oracle.Error as err:
        print("Erro ao testar conexão:", err)
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass


def test_simple_table(limit=5):
    """Busca algumas linhas da tabela I_SEQ_OF_COLAB sem filtro."""
    sql = f"SELECT * FROM I_SEQ_OF_COLAB WHERE ROWNUM <= {limit}"
    print(f"Executando: {sql}")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = cursor.fetchall()
        print(f"Linhas retornadas: {len(rows)}")
        for row in rows:
            print(row)
    except cx_Oracle.Error as err:
        print("Erro ao buscar tabela simples:", err)
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass


def test_filter_only(operator_id):
    """Testa filtro primário em I_SEQ_OF_COLAB, mas sem join: usa SOC_COLABID (id interno)."""
    sql = """
    SELECT SOC_CODIOF, SOC_COLABID, SOC_SEQUEN
      FROM I_SEQ_OF_COLAB
     WHERE SOC_DATA_EXCLUSAO IS NULL
       AND SOC_COLABID = :op_id
    """
    print(
        f"\nExecutando filtro em SOC_COLABID = {operator_id} (provável zero de resultado)"
    )
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, op_id=operator_id)
        rows = cursor.fetchall()
        print(f"Linhas retornadas (filtrando por SOC_COLABID): {len(rows)}")
        for row in rows:
            print(row)
    except cx_Oracle.Error as err:
        print("Erro no filtro SOC_COLABID:", err)
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass


def test_join_colab(operator_code):
    """Testa join em J_COLAB e filtra pelo código do operador (JLB_CODERP)."""
    sql = """
    SELECT i.SOC_CODIOF, i.SOC_COLABID, c.JLB_CODERP, c.JLB_NOMECB
      FROM I_SEQ_OF_COLAB i
      JOIN J_COLAB c
        ON i.SOC_COLABID = c.JLB_COLABID
     WHERE i.SOC_DATA_EXCLUSAO IS NULL
       AND c.JLB_CODERP = :op_code
    """
    print(f"\nExecutando join com J_COLAB e filtro JLB_CODERP = '{operator_code}'")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql, op_code=operator_code)
        rows = cursor.fetchall()
        print(f"Linhas retornadas (join em J_COLAB): {len(rows)}")
        for row in rows:
            print(row)
    except cx_Oracle.Error as err:
        print("Erro no join J_COLAB:", err)
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass


if __name__ == "__main__":
    print("1) Teste de Conexão")
    test_connection()

    print("\n2) Teste de Tabela Simples (I_SEQ_OF_COLAB)")
    test_simple_table(limit=5)

    op_id = input(
        "\n3) Digite o código interno do operador (SOC_COLABID) para teste do filtro simples (ex: 38): "
    )
    if op_id.strip():
        test_filter_only(op_id.strip())
    else:
        print("Nenhum código SOC_COLABID fornecido.")

    op_code = input(
        "\n4) Digite o código do operador (JLB_CODERP) para teste do join com J_COLAB (ex: 0011): "
    )
    if op_code.strip():
        test_join_colab(op_code.strip())
    else:
        print("Nenhum código JLB_CODERP fornecido.")

    print(
        "\nPróximos passos: após confirmar que o join em J_COLAB retorna linhas, podemos adicionar o join em J_OF e demais cláusulas gradualmente."
    )


##"C:\Users\nh_9\AppData\Local\Programs\Python\Python313\python.exe" "Z:\Isaac\compartilhado\Site\SITE HTML\v8 ia\laser\lasernew\laser_project_cleaned\home\ubuntu\laser_project\/laser/backend/scripts/test_oracle_query.py"
