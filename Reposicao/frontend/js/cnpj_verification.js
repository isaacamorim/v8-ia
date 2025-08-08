// frontend/js/cnpj_verification.js

const formVerificacao = document.getElementById("verificacaoRapida");
const formSenha = document.getElementById("formSenha");
const docQuick = document.getElementById("docQuick");
const senhaInput = document.getElementById("senhaInput");
const senhaTitle = document.getElementById("senhaTitle");
const senhaDescricao = document.getElementById("senhaDescricao");
const boxVerificacao = document.getElementById("boxVerificacao");
const boxSenha = document.getElementById("boxSenha");

let cnpjGlobal = "";
let requiresPassword = false;

formVerificacao.addEventListener("submit", async e => {
    e.preventDefault();
    const documento = docQuick.value.trim();
    if (!documento) return alert("Informe o CNPJ/CPF");

    try {
        const res = await fetch(
            `http://127.0.0.1:5000/api/cnpj/verificar?documento=${encodeURIComponent(documento)}`
        );
        const data = await res.json();

        if (data.status === "existente") {
            cnpjGlobal = documento;
            requiresPassword = data.requires_password ?? true;

            senhaBox.style.display = "block";
            boxVerificacao.style.display = "none";
            senhaInput.value = "";
            senhaInput.focus();

            senhaTitle.textContent = requiresPassword ? "Login" : "Criar Senha";
            senhaDescricao.textContent = requiresPassword
                ? `Olá ${data.nome}, digite sua senha para continuar.`
                : `Olá ${data.nome}, defina uma senha para continuar.`;
        }

        else {
            alert(data.mensagem || data.error || "Não encontrado");
        }
    } catch (err) {
        console.error(err);
        alert("Erro de conexão com o servidor.");
    }
});

formSenha.addEventListener("submit", async e => {
    e.preventDefault();

    const senha = document.getElementById("novaSenha").value.trim();
    const confirmar = document.getElementById("confirmarSenha").value.trim();

    if (!senha || !confirmar) return alert("Preencha ambos os campos de senha.");
    if (senha !== confirmar) return alert("As senhas não coincidem.");

    const rota = requiresPassword ? "login" : "definir-senha";
    try {
        const res = await fetch(
            `http://127.0.0.1:5000/api/cnpj/${rota}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documento: cnpjGlobal, senha })
            }
        );
        const data = await res.json();

        if (res.ok && data.success) {
            alert(data.mensagem);
            document.getElementById("verifyOverlay").style.display = "none";
            document.getElementById("appHeader").style.display = "flex";
            document.getElementById("conteudoPrincipal").style.display = "flex";
            document.getElementById("clientStatusText").textContent =
                `${data.usuario.nome} (${data.usuario.cnpj})`;
            carregarProdutos();
        } else {
            alert(data.error || data.mensagem || "Erro ao autenticar.");
        }
    } catch (err) {
        console.error(err);
        alert("Erro de conexão ao autenticar.");
    }
});

function voltarParaVerificacao() {
    boxSenha.style.display = "none";
    boxVerificacao.style.display = "block";
}
