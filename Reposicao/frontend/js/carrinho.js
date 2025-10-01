/* js/carrinho.js */
let carrinho = [];

/* ---------------- Notificação ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            document.querySelector('.cart-sidebar').classList.add('active');
        });
    }

    // Fecha o carrinho clicando fora
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.cart-sidebar');
        if (!sidebar.contains(e.target) && !e.target.closest('.cart-icon')) {
            sidebar.classList.remove('active');
        }
    });
});

/* ---------- Notificação com animação ---------- */
function mostrarNotificacao(mensagem, cor = "green") {
    const notif = document.getElementById('notification');
    if (!notif) return;

    notif.textContent = mensagem;
    notif.className = `notification ${cor} show`;

    notif.classList.remove('fade');
    void notif.offsetWidth; // força reflow
    notif.classList.add('fade');

    setTimeout(() => {
        notif.classList.remove('show');
    }, 2500);
}

/* ---------- Animação na alteração de quantidade ---------- */
function animarQuantidade(inputEl) {
    if (!inputEl) return;
    inputEl.classList.add('pulse');
    setTimeout(() => inputEl.classList.remove('pulse'), 300);
}

/* --- Alterar quantidade local e no servidor --- */
function alterarQuantidade(id, novaQtd) {
    novaQtd = parseInt(novaQtd);

    const produto = carrinho.find(p => p.id === parseInt(id));
    if (!produto) return;

    if (isNaN(novaQtd) || novaQtd < produto.qtd_minima) {
        novaQtd = produto.qtd_minima;
    }
    if (novaQtd % produto.passo_qtd !== 0) {
        novaQtd = Math.ceil(novaQtd / produto.passo_qtd) * produto.passo_qtd;
    }

    produto.qtd = novaQtd;

    const input = document.querySelector(`.qtd-input[data-id="${id}"]`);
    animarQuantidade(input);

    atualizarCarrinhoSidebar();
    atualizarBadgeCarrinho();
    mostrarNotificacao(`Quantidade alterada`, "yellow");

    atualizarQuantidadeNoServidor(id, novaQtd);
}

/* ---------------- Adicionar ---------------- */
function adicionarAoCarrinho(id, descricao, qtd, cod, imagem, qtdMin = 1, passoQtd = 1) {
    id = parseInt(id);
    qtd = parseInt(qtd);

    const existente = carrinho.find(item => item.id === id);

    if (existente) {
        existente.qtd = qtd;
        existente.qtd_minima = qtdMin;
        existente.passo_qtd = passoQtd;
        atualizarQuantidadeNoServidor(id, qtd, () => {
            mostrarNotificacao(`Quantidade atualizada de ${descricao}`, "yellow");
        });
    } else {
        carrinho.push({ id, descricao, qtd, cod, imagem, qtd_minima: qtdMin, passo_qtd: passoQtd });
        salvarNoServidor({ id, qtd }, () => {
            mostrarNotificacao(`Adicionado: ${descricao}`, "green");
        });
    }

    atualizarBadgeCarrinho();
    atualizarCarrinhoSidebar();
}

/* ---------------- Atualizar badge do carrinho ---------------- */
function atualizarBadgeCarrinho() {
    const totalProdutosDistintos = new Set(carrinho.map(p => p.id)).size;
    document.getElementById('cartCount').textContent = totalProdutosDistintos;
}

/* --- Alterar quantidade no servidor --- */
function atualizarQuantidadeNoServidor(id, novaQtd, callback) {
    fetch("http://127.0.0.1:5000/api/carrinho/quantidade", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: obterSessionId(),
            produto_id: parseInt(id),
            quantidade: parseInt(novaQtd),
            cnpj_temp: obterCNPJLogado()
        })
    })
        .then(res => {
            if (res.ok && typeof callback === "function") callback();
        })
        .catch(() => console.warn("Erro ao atualizar quantidade no servidor."));
}

/* --- Remover item do carrinho --- */
function removerDoCarrinho(id) {
    const index = carrinho.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
        const produto = carrinho[index];
        carrinho.splice(index, 1);
        mostrarNotificacao(`Removido: ${produto.descricao}`, "red");
        atualizarCarrinhoSidebar();
        atualizarBadgeCarrinho();
        marcarComoExcluidoNoServidor(id);
    }
}

/* ---------------- Atualizações de UI ---------------- */
function atualizarCarrinhoSidebar() {
    const container = document.querySelector('.cart-items');
    container.innerHTML = '';

    carrinho.forEach(p => {
        const imgSrc = p.imagem
            ? `data:image/jpeg;base64,${p.imagem}`
            : 'img/sem-imagem.jpg';

        const el = document.createElement('div');
        el.classList.add('cart-item');
        el.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
                <img src="${imgSrc}" class="cart-item-image" style="width:50px; height:50px; object-fit:cover; border-radius:6px;">
                <div class="cart-item-info">
                    <div class="cart-item-title">${p.descricao}</div>
                    <small>${p.cod}</small>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <input type="number" 
                        value="${p.qtd}" 
                        min="${p.qtd_minima}" 
                        step="${p.passo_qtd}" 
                        class="qtd-input" 
                        data-id="${p.id}">
                <button data-id="${p.id}" class="remove-btn">🗑</button>
            </div>
        `;
        container.appendChild(el);
    });

    container.querySelectorAll('.qtd-input').forEach(input => {
        input.addEventListener('change', e => {
            alterarQuantidade(input.dataset.id, parseInt(input.value));
        });
    });

    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            removerDoCarrinho(btn.dataset.id);
        });
    });
}

/* ---------------- API ---------------- */
function salvarNoServidor(item, callback) {
    fetch("http://127.0.0.1:5000/api/carrinho/adicionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: obterSessionId(),
            produto_id: parseInt(item.id),
            quantidade: parseInt(item.qtd),
            cnpj_temp: obterCNPJLogado()
        })
    })
        .then(res => {
            if (res.ok && typeof callback === "function") callback();
        })
        .catch(() => console.warn("Erro ao salvar item no servidor."));
}


function marcarComoExcluidoNoServidor(id) {
    fetch("http://127.0.0.1:5000/api/carrinho/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: obterSessionId(),
            produto_id: id,
            cnpj_temp: obterCNPJLogado(),
            status: "EXCLUIDO"
        })
    }).catch(() => console.warn("Erro ao marcar como excluído."));
}

async function carregarCarrinhoDoServidor() {
    const cnpj = obterCNPJLogado();
    if (!cnpj) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/carrinho/${cnpj}`);
        if (!res.ok) return;

        const dados = await res.json();
        if (!Array.isArray(dados)) return;

        carrinho = dados
            .filter(item => item.status === 'ATIVO')
            .map(item => ({
                id: item.produto_id,
                descricao: item.descricao,
                qtd: item.quantidade,
                cod: item.codigo,
                imagem: item.imagem,
                qtd_minima: item.qtd_minima || 1,
                passo_qtd: item.passo_qtd || 1,
                cnpj_temp: cnpj
            }));

        atualizarBadgeCarrinho();
        atualizarCarrinhoSidebar();
    } catch (err) {
        console.warn("Erro ao carregar carrinho do servidor:", err);
    }
}

/* ---------------- Utilidades ---------------- */
function obterSessionId() {
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        localStorage.setItem("session_id", sessionId);
    }
    return sessionId;
}

function obterCNPJLogado() {
    return localStorage.getItem("cnpj_logado") || "";
}

/* ---------------- Eventos ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    carregarCarrinhoDoServidor();
});

window.adicionarAoCarrinho = adicionarAoCarrinho;

function trocarCliente(cnpj) {
    localStorage.setItem("cnpj_logado", cnpj);
    carrinho = [];
    atualizarBadgeCarrinho();
    atualizarCarrinhoSidebar();
    carregarCarrinhoDoServidor();
}
