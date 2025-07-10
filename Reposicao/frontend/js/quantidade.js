@ -1, 25 + 0, 0 @@
function criarSeletorQuantidade(produto) {
    const container = document.createElement('div');
    container.className = 'quantity-selector';

    const label = document.createElement('span');
    label.textContent = 'Quantidade: ';
    container.appendChild(label);

    const select = document.createElement('select');
    select.className = 'quantity-select';

    const opcoes = produto.calcularQuantidadesDisponiveis();
    opcoes.forEach(qtd => {
        const option = document.createElement('option');
        option.value = qtd;
        option.textContent = `${qtd} unidades`;
        select.appendChild(option);
    });

    container.appendChild(select);
    return container;
}

// Uso na renderização de produtos
productCard.appendChild(criarSeletorQuantidade(produto));