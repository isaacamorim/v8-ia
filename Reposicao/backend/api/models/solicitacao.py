# pode ser usado futuramente para gravar solicitações enviadas
from app import db


class Solicitacao(db.Model):
    __tablename__ = "J_SOLICITACAO"
    # campos: id, cliente, data, status...
    pass
