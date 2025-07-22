// frontend/js/produtos.js
async function carregarProdutos(filtros = {}) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-pulse"></i> Carregando produtos...</div>`;

    try {
        // Montar a URL com filtros
        let url = "http://127.0.0.1:5000/api/produtos/reposicao";
        const params = new URLSearchParams();

        if (filtros.palavras_chave && filtros.palavras_chave.length > 0) {
            params.set("tags", filtros.palavras_chave.join(","));
        }

        if ([...params].length > 0) {
            url += "?" + params.toString();
        }

        const response = await fetch(url);
        const produtos = await response.json();

        grid.innerHTML = "";

        if (!Array.isArray(produtos) || produtos.length === 0) {
            grid.innerHTML = "<p>Nenhum produto disponível.</p>";
            return;
        }

        produtos.forEach((produto) => {
            const card = criarCardProduto(produto);
            grid.appendChild(card);
        });

        // Vincula evento aos botões de adicionar
        document.querySelectorAll(".add-to-cart").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const descricao = btn.dataset.desc;
                const cod = btn.dataset.cod;
                const imagem = btn.dataset.img;

                // Pega a quantidade relacionada ao input do lado
                const input = btn.parentElement.querySelector(".qtd-input");
                const qtd = parseInt(input.value) || 1;

                // Chama a função do carrinho
                adicionarAoCarrinho(id, descricao, qtd, cod, imagem);
            });
        });


    } catch (err) {
        console.error("Erro ao carregar produtos:", err);
        grid.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

// Expor globalmente para ser usado por filtros e cnpj_verification
window.carregarProdutos = carregarProdutos;


async function buscarProdutosPorTexto(termo) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-pulse"></i> Buscando produtos...</div>`;

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/produtos/reposicao/search?q=${encodeURIComponent(termo)}`);
        const produtos = await response.json();

        grid.innerHTML = "";

        if (produtos.length === 0) {
            grid.innerHTML = "<p>Nenhum produto encontrado.</p>";
            return;
        }

        produtos.forEach(produto => {
            const card = criarCardProduto(produto);
            grid.appendChild(card);
        });

        // Após criar os cards, adicionar eventos aos botões
        document.querySelectorAll(".add-to-cart").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const descricao = btn.dataset.desc;
                const cod = btn.dataset.cod;
                const imagem = btn.dataset.img;

                const input = btn.parentElement.querySelector(".qtd-input");
                const qtd = parseInt(input.value) || 1;

                adicionarAoCarrinho(id, descricao, qtd, cod, imagem);
            });
        });


    } catch (err) {
        console.error("Erro na busca:", err);
        grid.innerHTML = "<p>Erro ao buscar produtos.</p>";
    }
}

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
            <input type="number" 
                    class="qtd-input" 
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

    return card;
}


// --botao buscar -- \\
const btnBuscar = document.getElementById("btnBuscar");
const searchToggleArea = document.getElementById("searchToggleArea");
const searchBarContainer = document.getElementById("searchBarContainer");
const searchInput = document.getElementById("searchInput");
const btnCloseSearch = document.getElementById("btnCloseSearch");

// Quando clica no botão "Buscar"
btnBuscar.addEventListener("click", () => {
    searchToggleArea.style.display = "none";
    searchBarContainer.style.display = "flex";
    searchInput.focus();
});

// Quando clica no "X"
btnCloseSearch.addEventListener("click", () => {
    searchBarContainer.style.display = "none";
    searchToggleArea.style.display = "flex";
    searchInput.value = "";
    carregarProdutos(); // Limpa busca
});

// Ao pressionar Enter na busca
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const termo = searchInput.value.trim();
        if (termo.length > 0) {
            buscarProdutosPorTexto(termo);
        }
    }
});


document.getElementById('btnBuscar').addEventListener('click', () => {
    const searchSection = document.getElementById('searchSection');

    // Alterna visibilidade
    if (searchSection.style.display === 'none' || searchSection.style.display === '') {
        searchSection.style.display = 'block';
        document.getElementById('searchInput').focus(); // foca no input
    } else {
        searchSection.style.display = 'none';
    }
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const termo = e.target.value.trim();
        if (termo.length > 0) {
            buscarProdutosPorTexto(termo); // função que você já tem
        }
    }
});
