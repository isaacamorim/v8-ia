// filtros.js
// ===== SIDEBARS =====
const filtroSidebar = document.querySelector('.filter-sidebar');
const cartSidebar = document.querySelector('.cart-sidebar');
const btnFiltrar = document.getElementById('btnFiltrar');
const btnCart = document.querySelector('.cart-icon');
const btnAplicarFiltro = document.querySelector('.apply-filter');
const filtroContainer = document.querySelector('.filter-options');

let palavrasChaveSelecionadas = new Set();
let palavrasChaveDisponiveis = new Set(); // carregado dinamicamente da API
let termoBusca = "";

/* -------- Funções auxiliares -------- */
function abrirSidebar(sidebar) {
    fecharTodasSidebars();
    sidebar?.classList.add("active");
}

function fecharTodasSidebars() {
    [filtroSidebar, cartSidebar].forEach(sb => sb?.classList.remove("active"));
}

/* -------- Inicializar Filtro Lateral -------- */
function inicializarFiltroLateral(callback) {
    window._filtroCallback = callback;

    if (btnFiltrar && filtroSidebar) {
        btnFiltrar.addEventListener("click", () => {
            abrirSidebar(filtroSidebar);
        });

        if (btnAplicarFiltro) {
            btnAplicarFiltro.addEventListener("click", () => {
                callback && callback(getFiltrosAtuais());
                filtroSidebar.classList.remove("active");
            });
        }
    }

    carregarPalavrasChaveDaAPI();
}

/* -------- Fechar sidebars clicando fora -------- */
document.addEventListener("click", (e) => {
    if (
        filtroSidebar.contains(e.target) ||
        cartSidebar.contains(e.target) ||
        btnFiltrar.contains(e.target) ||
        btnCart.contains(e.target)
    ) return;

    if (e.target.classList.contains("apply-filter") || e.target.classList.contains("clear-filter")) {
        return;
    }

    fecharTodasSidebars();
});

/* -------- Buscar palavras-chave -------- */
async function carregarPalavrasChaveDaAPI() {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/produtos/reposicao");
        if (!res.ok) return;

        const produtos = await res.json();
        const todasPalavras = new Set();

        produtos.forEach(produto => {
            if (produto.palavras_chave) {
                produto.palavras_chave.split(";").forEach(tag => {
                    const normalizada = tag.trim().toUpperCase();
                    if (normalizada) todasPalavras.add(normalizada);
                });
            }
        });

        palavrasChaveDisponiveis = todasPalavras;
        renderizarFiltros();
    } catch (err) {
        console.warn("⚠️ Erro ao carregar palavras-chave da API:", err);
    }
}

/* -------- Renderizar checkboxes -------- */
function renderizarFiltros() {
    filtroContainer.innerHTML = '';

    Array.from(palavrasChaveDisponiveis).sort().forEach(tag => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '0.5rem';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = tag;
        checkbox.checked = palavrasChaveSelecionadas.has(tag);

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) palavrasChaveSelecionadas.add(tag);
            else palavrasChaveSelecionadas.delete(tag);

            atualizarEstadoVisualDoBotao();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(tag));
        filtroContainer.appendChild(label);
    });

    // botão limpar
    const limparBtn = document.createElement('button');
    limparBtn.className = 'clear-filter btn-limpar';
    limparBtn.textContent = 'Limpar filtros';
    limparBtn.addEventListener('click', () => {
        limparFiltros(window._filtroCallback);
    });
    filtroContainer.appendChild(limparBtn);
}

/* -------- Limpar filtros -------- */
function limparFiltros(callback) {
    palavrasChaveSelecionadas.clear();
    renderizarFiltros();
    atualizarEstadoVisualDoBotao();
    callback && callback(getFiltrosAtuais());
}

/* -------- Estado do botão filtros -------- */
function atualizarEstadoVisualDoBotao() {
    if (!btnFiltrar) return;

    if (palavrasChaveSelecionadas.size > 0) {
        btnFiltrar.style.backgroundColor = "#c00";
        btnFiltrar.style.color = "#fff";
    } else {
        btnFiltrar.style.backgroundColor = "#ddd";
        btnFiltrar.style.color = "#000";
    }
}

/* -------- Input de busca -------- */
const inputBusca = document.querySelector(".filter-search");
if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
        termoBusca = e.target.value.trim();
    });
}

/* -------- Retornar filtros atuais -------- */
function getFiltrosAtuais() {
    return {
        palavras_chave: Array.from(palavrasChaveSelecionadas),
        busca: termoBusca
    };
}

/* -------- Exportar -------- */
window.inicializarFiltroLateral = inicializarFiltroLateral;
