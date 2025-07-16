document.addEventListener('DOMContentLoaded', () => {
    renderCarrinho();
});

// Adiciona um produto ao carrinho
function adicionarAoCarrinho(id, descricao, quantidade) {
    let carrinho = JSON.parse(localStorage.getItem('reposicao_carrinho')) || [];

    const existente = carrinho.find(item => item.id === id);
    if (existente) {
        existente.quantidade += quantidade;
    } else {
        carrinho.push({ id, descricao, quantidade });
    }

    localStorage.setItem('reposicao_carrinho', JSON.stringify(carrinho));
    renderCarrinho();
}

// Renderiza o carrinho na sidebar
function renderCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('reposicao_carrinho')) || [];
    const container = document.getElementById('cartItems');
    const totalSpan = document.getElementById('cartTotalValue');
    const btnFinalizar = document.getElementById('finalizeOrder');

    container.innerHTML = '';

    if (carrinho.length === 0) {
        container.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Seu carrinho está vazio</p></div>';
        totalSpan.textContent = '0';
        btnFinalizar.disabled = true;
        return;
    }

    carrinho.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <strong>${item.descricao}</strong><br>
            Quantidade: ${item.quantidade}
            <button onclick="removerDoCarrinho(${item.id})" class="remove-item">x</button>
        `;
        container.appendChild(div);
    });

    totalSpan.textContent = carrinho.length;
    btnFinalizar.disabled = false;
}

// Remove um item do carrinho
function removerDoCarrinho(id) {
    let carrinho = JSON.parse(localStorage.getItem('reposicao_carrinho')) || [];
    carrinho = carrinho.filter(item => item.id !== id);
    localStorage.setItem('reposicao_carrinho', JSON.stringify(carrinho));
    renderCarrinho();
}
