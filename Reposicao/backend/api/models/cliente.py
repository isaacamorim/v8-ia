from app import db


class Cliente(db.Model):
    __tablename__ = "J_ENDERE"
    JND_ENDID = db.Column(db.Integer, primary_key=True)
    JND_CODERP = db.Column(db.String(20), unique=True, nullable=False)
    JND_TIPCGC = db.Column(db.Integer)
    JND_NUMTEL = db.Column(db.String(20))
    JND_E_MAIL = db.Column(db.String(255))
    JND_SENHA_HASH = db.Column(db.String(255))
    JND_ATIVO_PORTAL = db.Column(db.Boolean, default=False)

    def check_password(self, senha, bcrypt):
        return bcrypt.check_password_hash(self.JND_SENHA_HASH, senha)
