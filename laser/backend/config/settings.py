import os


class Config:
    DB_USER = os.getenv("DB_USER", "HORIZONTE")
    DB_PASS = os.getenv("DB_PASS", "LARANJA")
    DB_HOST = os.getenv("DB_HOST", "10.42.92.200")
    DB_PORT = os.getenv("DB_PORT", "1521")
    DB_SERVICE = os.getenv("DB_SERVICE", "ORCL")
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/srv/laser/uploads")
    ALLOWED_EXTENSIONS = {"step", "stp", "pdf"}
