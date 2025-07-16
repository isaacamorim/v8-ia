# models/cliente.py
from ..extensions import db

class Cliente(db.Model):
    __tablename__ = "J_V_ENDERECO_COMPLEMENTO"
    JND_ENDID = db.Column(db.Integer, primary_key=True)
    JND_CODERP = db.Column(db.String(20), unique=True, nullable=False)
    JND_TIPCGC = db.Column(db.Integer)
    JND_NUMCGC = db.Column(db.String(14), unique=True, nullable=False)
    NUMDOC = db.Column(db.String(4000))
    JND_NUMTEL = db.Column(db.String(20))
    JND_E_MAIL = db.Column(db.String(255))
    JNC_SENHA_HASH = db.Column(db.String(255))
    JNC_ATIVO_PORTAL = db.Column(db.Integer)
    JMP_ERAZAO = db.Column(db.String(255), nullable=False)

    def check_password(self, senha):
        from ..extensions import bcrypt
        return bcrypt.check_password_hash(self.JNC_SENHA_HASH, senha)
