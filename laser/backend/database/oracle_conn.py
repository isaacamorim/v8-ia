import cx_Oracle
from config import settings


def get_db_connection():
    return cx_Oracle.connect(
        user=settings.DB_USER,
        password=settings.DB_PASS,
        dsn=cx_Oracle.makedsn(
            settings.DB_HOST, settings.DB_PORT, service_name=settings.DB_SERVICE
        ),
    )
