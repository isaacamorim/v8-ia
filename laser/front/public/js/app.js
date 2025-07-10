// app.js

// Variáveis globais
let intervaloAtualizacao = null;
let selectedJob = null;

const operatorInput = document.getElementById("operator");
const loadBtn = document.getElementById("loadBtn");
const loadText = document.getElementById("loadText");
const loadSpinner = document.getElementById("loadSpinner");
const jobTable = document.getElementById('jobTable');
const jobBody = document.getElementById('jobBody');

// Ao carregar a página, configure eventos
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM carregado");

    // Conecta os botões do apontamento
    const btnStart = document.getElementById("startApontamentoBtn");
    const btnPause = document.getElementById("pauseApontamentoBtn");
    const btnFinish = document.getElementById("manualFinishApontamentoBtn");
    const btnConfirm = document.getElementById("confirmAllPendingBtn");

    if (btnStart) btnStart.addEventListener("click", iniciarApontamentoTeste);
    if (btnPause) btnPause.addEventListener("click", pauseApontamento);
    if (btnFinish) btnFinish.addEventListener("click", finishApontamento);
    if (btnConfirm) btnConfirm.addEventListener("click", confirmBatch);
});


async function iniciarApontamentoTeste() {
    const dadosTeste = {
        of_id: "OFTESTE123",
        empresa_id: "01",
        operator_code: "999",     // código fictício de operador
        operac: "OP01",           // código da operação
        codtur: "1"               // código do turno
    };

    try {
        const resp = await fetch("http://localhost:5000/api/laser/apontamento/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosTeste)
        });

        const json = await resp.json();
        console.log("Resultado:", json);

        if (json.success) {
            alert("✅ Apontamento inserido com sucesso! ID: " + json.apontamento_id);
        } else {
            alert("❌ Erro: " + json.error);
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao chamar API: " + err.message);
    }
}

let currentApontamentoId = null;

// Supondo que você tenha o operador e a OF já carregados no contexto:
const currentOperator = {
    codigo: operatorInput.value.trim()
};

const selectedOF = {
    of_id: "OF123", // substitua com valor real
    empresa_id: "01",
    soc_codseq: "SEQ1",
    soc_codtur: "1"
};

async function startApontamento() {
    const res = await fetch(`${API_BASE}/laser/apontamento/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            of_id: selectedOF.of_id,
            empresa_id: selectedOF.empresa_id,
            operator_code: currentOperator.codigo,
            operac: selectedOF.soc_codseq,
            codtur: selectedOF.soc_codtur
        })
    });
    const json = await res.json();
    if (json.success) {
        currentApontamentoId = json.apontamento_id;
        alert("Apontamento iniciado com sucesso.");
        document.getElementById("pauseApontamentoBtn").disabled = false;
        document.getElementById("manualFinishApontamentoBtn").disabled = false;
    } else {
        alert("Erro ao iniciar apontamento: " + json.error);
    }
}

async function pauseApontamento() {
    if (!currentApontamentoId) return alert("Nenhum apontamento ativo.");

    const res = await fetch(`${API_BASE}/laser/apontamento/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apontamento_id: currentApontamentoId })
    });

    const json = await res.json();
    if (json.success) {
        alert("Apontamento pausado.");
    } else {
        alert("Erro ao pausar: " + json.error);
    }
}

async function finishApontamento() {
    const qtd = prompt("Digite a quantidade boa:");
    if (!qtd || isNaN(qtd)) return alert("Quantidade inválida.");

    const res = await fetch(`${API_BASE}/laser/apontamento/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apontamento_id: currentApontamentoId,
            quantidade_boa: Number(qtd)
        })
    });

    const json = await res.json();
    if (json.success) {
        alert("Apontamento finalizado.");
    } else {
        alert("Erro ao finalizar: " + json.error);
    }
}

async function confirmBatch() {
    try {
        // Verificar se há apontamentos pendentes
        if (pendingApontamentos.length === 0) {
            showToast("info", "Nenhum apontamento pendente para confirmar.");
            return;
        }

        // Verificar se há um apontamento ativo
        if (!currentApontamentoId || currentApontamentoState !== "started") {
            showToast("error", "Nenhum apontamento ativo para associar estas confirmações.");
            return;
        }

        // Preparar os dados para envio
        const items = pendingApontamentos.map(item => ({
            pdf_filename: item.pdfFileName,
            start_time: item.startTime,
            total_time: item.totalTime,
            part_name: item.partName,
            qtd_pdf: item.qtdPdf,
            qtd_apontar: item.qtdApontar
        }));

        // Mostrar estado de carregamento
        const originalText = confirmAllPendingBtn.innerHTML;
        confirmAllPendingBtn.disabled = true;
        confirmAllPendingBtn.innerHTML = "Confirmando... <span class=\"loading\"></span>";

        // Enviar para o backend
        const res = await fetch(`${API_BASE}/api/laser/apontamento/confirm_batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                apontamento_id: currentApontamentoId,
                items
            })
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            throw new Error(json.error || "Erro ao confirmar os apontamentos");
        }

        // Sucesso!
        showToast("success", "Todos os PDFs confirmados com sucesso!");

        // Limpar lista de pendentes
        pendingApontamentos = [];
        renderPendingApontamentosTable();

        // Finalizar o apontamento
        currentApontamentoState = "idle";
        currentApontamentoId = null;
        updateApontamentoControlButtons();

    } catch (err) {
        console.error("Erro ao confirmar lote:", err);
        showToast("error", `Erro: ${err.message}`);
    } finally {
        // Restaurar estado do botão
        confirmAllPendingBtn.disabled = false;
        confirmAllPendingBtn.innerHTML = "Confirmar Todos os Apontamentos Pendentes";
    }
}


const API_BASE = 'http://localhost:5000/api';

// Carrega sequenciamento para o operador
async function loadSequencing() {
    const operatorId = operatorInput.value.trim();
    if (!operatorId) {
        alert('Digite o número do operador.');
        return;
    }

    // Estado de loading
    loadText.style.display = 'none';
    loadSpinner.style.display = 'inline-block';
    loadBtn.disabled = true;

    try {
        const res = await fetch(
            `${API_BASE}/laser/sequencing?operator=${operatorId}`
        );
        const json = await res.json();

        if (!json.success) {
            throw new Error(json.error || 'Erro desconhecido');
        }

        renderJobs(json.jobs);
        iniciarAtualizacaoAutomatica();
    } catch (err) {
        console.error(err);
        alert(`Erro ao buscar sequenciamento: ${err.message}`);
    } finally {
        // Restaura botão
        loadText.style.display = 'inline-block';
        loadSpinner.style.display = 'none';
        loadBtn.disabled = false;
    }
}

// Renderiza a tabela de jobs
function renderJobs(jobs) {
    jobBody.innerHTML = '';

    for (const job of jobs) {
        const fileName = job.stepPath.split('/').pop();
        const row = document.createElement('tr');

        row.innerHTML = `
        <td>${job.of}</td>
        <td>${job.sequencia}</td>
        <td>${job.produto}</td>
        <td>${job.quantidade}</td>
        <td>
        ${job.stepPath
                ? `<a href="${job.stepPath}" target="_blank">${fileName}</a>`
                : '<span style="color:#a00">—</span>'}
        </td>
        <td>
        ${job.stepPath
                ? `<button class="btn" onclick="abrirJob('${job.jobId}')">▶ Iniciar</button>`
                : `<button class="btn" disabled style="opacity:.5;cursor:default">Indisponível</button>`}
        </td>
    `;

        jobBody.appendChild(row);
    }

    jobTable.style.display = jobs.length ? 'table' : 'none';
}

// Atualização automática a cada 30s
function iniciarAtualizacaoAutomatica() {
    clearInterval(intervaloAtualizacao);
    intervaloAtualizacao = setInterval(loadSequencing, 30_000);
}

// Abre (ou copia + abre) o arquivo .STEP
async function abrirJob(jobId) {
    try {
        // 1. Verifica se já existe localmente
        const resp = await fetch(`/api/laser/verificar-arquivo/${jobId}`);
        const { existe, caminho } = await resp.json();

        // 2. Se não existir, copia do servidor
        if (!existe) {
            if (!confirm('Arquivo .STEP não encontrado. Deseja copiar do servidor?')) {
                return;
            }
            const copyRes = await fetch(`/api/laser/copiar-arquivo/${jobId}`, { method: 'POST' });
            if (!copyRes.ok) {
                throw new Error('Falha ao copiar arquivo');
            }
        }

        // 3. Abre no visualizador local
        window.open(`file://${caminho}`, '_blank');
    } catch (err) {
        alert(`Erro: ${err.message}`);
    }
}

// Completa o apontamento enviando o PDF
async function completeJob() {
    if (!selectedJob) {
        alert('Selecione primeiro um job (Iniciar).');
        return;
    }

    // Abre seletor de arquivo PDF
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';

    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        try {
            const form = new FormData();
            form.append('pdf', file);

            const resp = await fetch(`/api/laser/complete?jobId=${selectedJob}`, {
                method: 'POST',
                body: form
            });
            const json = await resp.json();

            if (!json.success) {
                throw new Error(json.error || 'Erro desconhecido');
            }

            alert('Apontamento concluído com sucesso!');
            loadSequencing();
        } catch (err) {
            alert(`Erro ao concluir apontamento: ${err.message}`);
        }
    };

    input.click();
}

// Notificações do navegador
function mostrarNotificacoes() {
    if (!("Notification" in window)) {
        alert("Notificações não suportadas!");
        return;
    }
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    new Notification("🛎️ Novas OFs", {
        body: "Você tem novas ordens de fabricação.",
        icon: "/Imgs/logo-notificacao.png"
    });
}

console.log("✅ app.js carregado com sucesso!");
