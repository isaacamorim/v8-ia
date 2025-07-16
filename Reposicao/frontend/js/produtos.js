// frontend/js/produtos.js
async function carregarProdutos() {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-pulse"></i> Carregando produtos...</div>`;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/produtos/reposicao");
        const produtos = await response.json();

        if (!Array.isArray(produtos) || produtos.length === 0) {
            grid.innerHTML = "<p>Nenhum produto disponível.</p>";
            return;
        }

        grid.innerHTML = "";

        produtos.forEach((produto) => {
            const card = document.createElement("div");
            card.classList.add("product-card");

            const imgSrc = produto.imagem
                ? `data:image/jpeg;base64,${produto.imagem}`
                : "https://raw.githubusercontent.com/github/explore/main/topics/image/image.png";


            card.innerHTML = `
        <img src="${imgSrc}" alt="Imagem do produto ${produto.descricao}" class="product-image">
        <h4 class="product-title">${produto.descricao}</h4>
        <p class="product-code">Cód: ${produto.cod}</p>
        <div class="product-actions">
            <button class="add-to-cart" data-id="${produto.id}" data-min="${produto.minima}" data-passo="${produto.passo}">
                <i class="fas fa-plus-circle"></i> Adicionar
            </button>
        </div>
        `;

            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        grid.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

// Expondo globalmente
window.carregarProdutos = carregarProdutos;
