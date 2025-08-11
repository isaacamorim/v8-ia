/* js/carrinho.js */
let carrinho = [];

/* ---------------- Notificação ---------------- */
function mostrarNotificacao(mensagem, cor = "green") {
    const antiga = document.querySelector('.notification');
    if (antiga) antiga.remove();

    const box = document.createElement("div");
    box.className = `notification ${cor}`;
    box.textContent = mensagem;
    document.body.appendChild(box);

    setTimeout(() => box.remove(), 2500);
}

/* ---------------- Adicionar / Alterar / Remover ---------------- */
function adicionarAoCarrinho(id, descricao, qtd, cod, imagem) {
    const existente = carrinho.find(item => item.id === id);

    if (existente) {
        existente.qtd = qtd;
        mostrarNotificacao(`Quantidade atualizada de ${descricao}`, "yellow");
    } else {
        carrinho.push({ id, descricao, qtd, cod, imagem });
        mostrarNotificacao(`Adicionado: ${descricao}`, "green");
    }

    atualizarBadgeCarrinho();
    atualizarCarrinhoSidebar();
    salvarNoServidor({ id, qtd });
}

function alterarQuantidade(id, novaQtd) {
    novaQtd = parseInt(novaQtd);
    if (isNaN(novaQtd) || novaQtd < 1) return;

    const produto = carrinho.find(p => p.id === id);
    if (produto) {
        produto.qtd = novaQtd;
        atualizarCarrinhoSidebar();
        atualizarBadgeCarrinho();
        mostrarNotificacao(`Quantidade alterada`, "yellow");
        salvarNoServidor({ id, qtd: novaQtd });
    }
}

function removerDoCarrinho(id) {
    const index = carrinho.findIndex(p => p.id === id);
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
function atualizarBadgeCarrinho() {
    const total = carrinho.reduce((acc, p) => acc + p.qtd, 0);
    document.getElementById('cartCount').textContent = total;
}

function atualizarCarrinhoSidebar() {
    const container = document.querySelector('.cart-items');
    container.innerHTML = '';

    carrinho.forEach(p => {
        // Se a imagem vier como Base64, monta o src
        const imgSrc = p.imagem
            ? `data:image/jpeg;base64,${p.imagem}`
            : 'img/sem-imagem.jpg';

        const el = document.createElement('div');
        el.classList.add('cart-item');
        el.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <img src="${imgSrc}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
                <div>
                    <strong>${p.descricao}</strong><br>
                    <small>${p.cod}</small>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                <input type="number" value="${p.qtd}" min="1" class="qty-input" data-id="${p.id}">
                <button data-id="${p.id}" class="remove-btn">🗑</button>
            </div>
        `;
        container.appendChild(el);
    });

    container.querySelectorAll('.qty-input').forEach(input => {
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
function salvarNoServidor(item) {
    fetch("http://127.0.0.1:5000/api/carrinho/adicionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: obterSessionId(),
            produto_id: item.id,
            quantidade: item.qtd,
            cnpj_temp: obterCNPJLogado()
        })
    }).catch(() => console.warn("Erro ao salvar item no servidor."));
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
    const cnpj = obterCNPJLogado(); // vem do localStorage
    if (!cnpj) {
        console.warn("Nenhum CNPJ logado encontrado.");
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/carrinho/${cnpj}`);
        if (!res.ok) {
            console.warn(`Erro ao buscar carrinho: ${res.status} ${res.statusText}`);
            return;
        }

        const dados = await res.json();
        if (!Array.isArray(dados)) {
            console.warn("Resposta inesperada do servidor:", dados);
            return;
        }

        carrinho = dados
            .filter(item => item.status === 'ATIVO')
            .map(item => ({
                id: item.produto_id,
                descricao: item.descricao,
                qtd: item.quantidade,
                cod: item.codigo,
                imagem: item.imagem, // já vem em Base64 ou null
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

document.querySelector('.cart-icon').addEventListener('click', () => {
    document.querySelector('.cart-sidebar').classList.add('active');
});

document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.cart-sidebar');
    if (!sidebar.contains(e.target) && !e.target.closest('.cart-icon')) {
        sidebar.classList.remove('active');
    }
});

window.adicionarAoCarrinho = adicionarAoCarrinho;

function trocarCliente(cnpj) {
    localStorage.setItem("cnpj_logado", cnpj);
    carrinho = [];
    atualizarBadgeCarrinho();
    atualizarCarrinhoSidebar();
    carregarCarrinhoDoServidor(); // busca do banco
}
