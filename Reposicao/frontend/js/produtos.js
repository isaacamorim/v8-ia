function renderizarProduto(produto) {
    const el = document.createElement('div');
    el.className = 'produto';

    const titulo = document.createElement('h4');
    titulo.textContent = produto.descricao;

    const seletor = criarSeletorQuantidade(produto);
    const botao = document.createElement('button');
    botao.textContent = 'Adicionar';
    botao.onclick = () => {
        const qtd = parseInt(seletor.querySelector('select').value);
        adicionarAoCarrinho(produto.id, produto.descricao, qtd);
    };

    el.appendChild(titulo);
    el.appendChild(seletor);
    el.appendChild(botao);

    return el;
}

function calcularQuantidadesDisponiveis(produto) {
    const opcoes = [];
    const base = produto.minima || 1;
    const passo = produto.passo || 1;
    for (let i = 0; i < 10; i++) {
        opcoes.push(base + i * passo);
    }
    return opcoes;
}
  