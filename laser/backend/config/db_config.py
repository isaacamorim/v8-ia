import os
import cx_Oracle
import logging

# Configurações do banco de dados (do settings.py fornecido pelo usuário)
DB_USER = os.getenv("DB_USER", "HORIZONTE")
DB_PASS = os.getenv("DB_PASS", "LARANJA")
DB_HOST = os.getenv("DB_HOST", "10.42.92.200")
DB_PORT = os.getenv("DB_PORT", "1521")
DB_SERVICE = os.getenv("DB_SERVICE", "ORCL")

# String de conexão DSN (Data Source Name)
# Formato comum: host:port/service_name
dsn = f"{DB_HOST}:{DB_PORT}/{DB_SERVICE}"

def init_oracle_client():
    try:
        # Tenta inicializar o cliente Oracle. Em alguns sistemas/configurações pode ser necessário.
        # Se o Instant Client não estiver no PATH/LD_LIBRARY_PATH, você pode especificar o diretório aqui.
        # Ex: cx_Oracle.init_oracle_client(lib_dir="/opt/oracle/instantclient_21_3")
        # Por enquanto, vamos assumir que o ambiente está configurado ou que o cx_Oracle o encontrará.
        # Se houver problemas de "DPI-1047: Cannot locate a 64-bit Oracle Client library", 
        # precisaremos garantir que o Instant Client esteja instalado e acessível.
        # Para o sandbox, pode ser necessário instalar o instant client via shell.
        logging.info("Tentando inicializar o cliente Oracle...")
        # cx_Oracle.init_oracle_client() # Comentado por enquanto, pois pode não ser necessário ou causar problemas se o client não estiver configurado
        logging.info("Cliente Oracle inicializado (ou já estava). DSN: %s", dsn)
    except Exception as e:
        logging.error(f"Erro ao inicializar o cliente Oracle: {e}")
        # Não relançar a exceção aqui, pois a conexão pode funcionar mesmo assim em alguns casos.

# Chamada para inicializar o cliente quando este módulo é carregado.
# init_oracle_client() # Comentado para evitar problemas iniciais no sandbox.

def get_db_connection():
    """Estabelece e retorna uma conexão com o banco de dados Oracle."""
    try:
        logging.debug(f"Tentando conectar ao Oracle com DSN: {dsn}, User: {DB_USER}")
        connection = cx_Oracle.connect(user=DB_USER, password=DB_PASS, dsn=dsn, encoding="UTF-8")
        logging.info("Conexão com o Oracle estabelecida com sucesso.")
        return connection
    except cx_Oracle.Error as e:
        logging.error(f"Erro ao conectar ao Oracle Database: {e}")
        error_obj, = e.args
        logging.error(f"Oracle Error Code: {error_obj.code}")
        logging.error(f"Oracle Error Message: {error_obj.message}")
        if error_obj.code == 12541: # TNS:no listener
            logging.error("Verifique se o listener do Oracle está em execução no host e porta especificados.")
        elif error_obj.code == 12514: # TNS:listener does not currently know of service requested
            logging.error("Verifique se o SERVICE_NAME está correto.")
        elif error_obj.code == 1017: # ORA-01017: invalid username/password; logon denied
            logging.error("Usuário ou senha inválidos.")
        # Adicionar mais tratamentos de erro específicos conforme necessário
        raise # Relança a exceção para ser tratada pela rota que chamou

# Exemplo de como usar (não será executado quando importado):
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    try:
        conn = get_db_connection()
        if conn:
            print("Conexão bem-sucedida!")
            # Exemplo de query
            # with conn.cursor() as cursor:
            #     cursor.execute("SELECT sysdate FROM dual")
            #     for row in cursor:
            #         print(row)
            conn.close()
    except Exception as e:
        print(f"Falha na conexão principal: {e}")

