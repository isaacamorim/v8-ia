import os


class Config:
    DB_USER = os.getenv("DB_USER", "")
    DB_PASS = os.getenv("DB_PASS", "")
    DB_HOST = os.getenv("DB_HOST", "")
    DB_PORT = os.getenv("DB_PORT", "")
    DB_SERVICE = os.getenv("DB_SERVICE", "ORCL")
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/srv/laser/uploads")
    ALLOWED_EXTENSIONS = {"step", "stp", "pdf"}
