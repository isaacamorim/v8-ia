# pode ser usado futuramente para gravar solicitações enviadas
from api.app import db


class Solicitacao(db.Model):
    __tablename__ = "J_SOLICITACAO"
    # campos: id, cliente, data, status...
    pass
