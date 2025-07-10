@ -1,21 +0,0 @@
class Produto:
    def __init__(
        self,
        id,
        codigo,
        descricao,
        mostra_reposicao,
        palavras_chave,
        qtd_minima,
        passo_qtd,
    ):
        self.id = id
        self.codigo = codigo
        self.descricao = descricao
        self.mostra_reposicao = mostra_reposicao
        self.palavras_chave = palavras_chave
        self.qtd_minima = qtd_minima
        self.passo_qtd = passo_qtd

    def calcular_quantidades_disponiveis(self):
        return [self.qtd_minima + (i * self.passo_qtd) for i in range(20)]