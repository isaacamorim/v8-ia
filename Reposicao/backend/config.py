# config.py
import os


class Config:
    DB_USER = os.getenv("DB_USER", "HORIZONTE")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "LARANJA")
    DB_HOST = os.getenv("DB_HOST", "10.42.92.200")
    DB_PORT = os.getenv("DB_PORT", "1521")
    DB_SERVICE = os.getenv("DB_SERVICE", "ORCL")
    DSN = f"{DB_HOST}:{DB_PORT}/{DB_SERVICE}"

    SQLALCHEMY_DATABASE_URI = f"oracle+cx_oracle://{DB_USER}:{DB_PASSWORD}@{DSN}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configurações do WhatsApp
    WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "55119989335816")

    # Chave secreta para sessões
    SECRET_KEY = os.getenv("SECRET_KEY", "segredo_dev")

    # flask-session
    SESSION_TYPE = "filesystem"
    SESSION_PERMANENT = False
    SESSION_FILE_DIR = "./.flask_session/"
