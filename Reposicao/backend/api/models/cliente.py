from backend.api.app import db


class ClienteTemp(db.Model):
    __tablename__ = "clientes_temp"

    id = db.Column(db.Integer, primary_key=True)
    cnpj = db.Column(db.String(14), unique=True)
    nome = db.Column(db.String(100))
    telefone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    data_solicitacao = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            "id": self.id,
            "cnpj": self.cnpj,
            "nome": self.nome,
            "telefone": self.telefone,
            "email": self.email,
            "data_solicitacao": self.data_solicitacao.isoformat(),
        }
