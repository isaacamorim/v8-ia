// frontend/js/produtos.js
// produtos.js
async function carregarProdutos(filtros = {}) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-pulse"></i> Carregando produtos...</div>`;

    try {
        let url = "http://127.0.0.1:5000/api/produtos/reposicao";
        const params = new URLSearchParams();

        if (filtros.palavras_chave?.length > 0) {
            params.set("tags", filtros.palavras_chave.join(","));
        }
        if (filtros.busca?.trim()) {
            params.set("q", filtros.busca.trim());
        }
        if ([...params].length > 0) url += "?" + params.toString();

        const response = await fetch(url);
        const produtos = await response.json();

        grid.innerHTML = "";

        if (!Array.isArray(produtos) || produtos.length === 0) {
            grid.innerHTML = "<p>Nenhum produto encontrado.</p>";
            return;
        }

        produtos.forEach(produto => {
            const card = criarCardProduto(produto);
            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Erro em carregarProdutos:", err);
        grid.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}
window.carregarProdutos = carregarProdutos;

/* -------- Criar card -------- */
function criarCardProduto(produto) {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const imgSrc = produto.imagem
        ? `data:image/jpeg;base64,${produto.imagem}`
        : "img/sem-imagem.jpg";

    card.innerHTML = `
        <img src="${imgSrc}" alt="Imagem do produto ${produto.descricao}" class="product-image">
        <h4 class="product-title">${produto.descricao}</h4>
        <p class="product-code">Cód: ${produto.cod}</p>
        <div class="product-actions">
            <input type="number" class="qtd-input" 
                value="${produto.minima}" 
                min="${produto.minima}" 
                step="${produto.passo}">
            <button class="add-to-cart" 
                data-id="${produto.id}" 
                data-desc="${produto.descricao}" 
                data-cod="${produto.cod}" 
                data-img="${imgSrc}">
                <i class="fas fa-plus-circle"></i> Adicionar
            </button>
        </div>
    `;

    card.querySelector(".add-to-cart").addEventListener("click", (e) => {
        const btn = e.currentTarget;
        const input = btn.parentElement.querySelector(".qtd-input");
        const qtd = parseInt(input.value) || 1;

        adicionarAoCarrinho(
            btn.dataset.id,
            btn.dataset.desc,
            qtd,
            btn.dataset.cod,
            btn.dataset.img
        );
    });

    return card;
}

/* -------- Barras de busca -------- */
const btnBuscar = document.getElementById("btnBuscar");
const searchBarContainer = document.getElementById("searchBarContainer");
const searchInput = document.getElementById("searchInput");
const btnCloseSearch = document.getElementById("btnCloseSearch");

// Abrir/fechar barra de busca
btnBuscar.addEventListener("click", () => {
    if (searchBarContainer.style.display === "none" || searchBarContainer.style.display === "") {
        searchBarContainer.style.display = "block";
        searchInput.focus();
    } else {
        searchBarContainer.style.display = "none";
        searchInput.value = "";
    }
});

// Fechar busca no botão "X"
btnCloseSearch.addEventListener("click", () => {
    searchBarContainer.style.display = "none";
    searchInput.value = "";
    carregarProdutos({ palavras_chave: Array.from(palavrasChaveSelecionadas) }); // limpa busca mas mantém filtros
});

// Buscar ao pressionar ENTER
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const termo = searchInput.value.trim();
        carregarProdutos({
            busca: termo,
            palavras_chave: Array.from(palavrasChaveSelecionadas)
        });
    }
});
