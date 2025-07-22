// filtros.js
const filtroSidebar = document.querySelector('.filter-sidebar');
const btnFiltrar = document.getElementById('btnFiltrar');
const btnAplicarFiltro = document.querySelector('.apply-filter');
const filtroContainer = document.querySelector('.filter-options');

let palavrasChaveSelecionadas = new Set();

const palavrasChaveDisponiveis = [
    "motor", "correia", "sensor", "eixo", "plataforma", "valvula", "painel"
];

function inicializarFiltroLateral(callback) {
    if (!btnFiltrar || !filtroSidebar) return;

    btnFiltrar.addEventListener('click', () => {
        filtroSidebar.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.filter-sidebar') === null && e.target !== btnFiltrar) {
            filtroSidebar.classList.remove('active');
        }
    });

    renderizarFiltros();

    btnAplicarFiltro.addEventListener('click', () => {
        filtroSidebar.classList.remove('active');
        atualizarEstadoVisualDoBotao();
        if (typeof callback === 'function') {
            callback(getFiltrosAtuais());
        }
    });
}

function renderizarFiltros() {
    filtroContainer.innerHTML = '';

    palavrasChaveDisponiveis.forEach(tag => {
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

    // ✅ Cria botão de limpar SEM guardar em variável fixa
    const limparBtn = document.createElement('button');
    limparBtn.className = 'apply-filter';
    limparBtn.style.backgroundColor = '#777';
    limparBtn.textContent = 'Limpar filtros';
    limparBtn.addEventListener('click', () => {
        limparFiltros();
        atualizarEstadoVisualDoBotao();
    });
    filtroContainer.appendChild(limparBtn);
}


function limparFiltros() {
    palavrasChaveSelecionadas.clear();
    renderizarFiltros();
    atualizarEstadoVisualDoBotao();
}

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

function getFiltrosAtuais() {
    return {
        palavras_chave: Array.from(palavrasChaveSelecionadas)
    };
}

window.inicializarFiltroLateral = inicializarFiltroLateral;
