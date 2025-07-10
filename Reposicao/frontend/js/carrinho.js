/* js/carrinho.js */
function adicionarAoCarrinho(id, descricao, quantidade) {
    const carrinho = JSON.parse(localStorage.getItem('carrinho_reposicao') || '[]');
    const existente = carrinho.find(item => item.id === id);
    if (existente) existente.quantidade += quantidade;
    else carrinho.push({ id, descricao, quantidade });
    localStorage.setItem('carrinho_reposicao', JSON.stringify(carrinho));
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    if (!lista) return;
    lista.innerHTML = '';
    const carrinho = JSON.parse(localStorage.getItem('carrinho_reposicao') || '[]');
    carrinho.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.descricao} - ${item.quantidade}`;
        lista.appendChild(li);
    });
}
window.onload = renderizarCarrinho;