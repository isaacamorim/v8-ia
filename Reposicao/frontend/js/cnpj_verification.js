// frontend/js/cnpj_verification.js
const formVerificacao = document.getElementById("verificacaoRapida");
const docQuick = document.getElementById("docQuick");

const senhaBox = document.getElementById("senhaBox");
const senhaInput = document.getElementById("senhaInput");
const formSenha = document.getElementById("formSenha");
const senhaTitle = document.getElementById("senhaTitle");
const senhaDescricao = document.getElementById("senhaDescricao");

let cnpjGlobal = "";  // usado entre verificação e senha

formVerificacao.addEventListener("submit", async (e) => {
    e.preventDefault();
    const documento = docQuick.value.trim();

    if (!documento) return alert("Informe seu CNPJ ou CPF");

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/cnpj/verificar?documento=${encodeURIComponent(documento)}`);
        const data = await res.json();

        if (data.status === "existente") {
            cnpjGlobal = documento;

            senhaBox.style.display = "block";
            senhaInput.value = "";
            senhaInput.focus();

            senhaTitle.textContent = data.requires_password ? "Login" : "Definir Senha";
            senhaDescricao.textContent = data.requires_password
                ? `Olá ${data.nome || "cliente"}, digite sua senha para acessar.`
                : `Olá ${data.nome || "cliente"}, defina uma nova senha para continuar.`;

            formVerificacao.style.display = "none";

        } else if (data.status === "nao_encontrado") {
            alert(data.mensagem || "CNPJ/CPF não cadastrado.");
        } else {
            alert(data.mensagem || "Erro ao verificar documento.");
        }
    } catch (err) {
        alert("Erro de conexão com o servidor.");
        console.error(err);
    }
});

formSenha.addEventListener("submit", async (e) => {
    e.preventDefault();
    const senha = senhaInput.value.trim();
    if (!senha) return alert("Informe a senha.");

    try {
        const rota = senhaTitle.textContent === "Login" ? "login" : "definir-senha";

        const res = await fetch(`http://127.0.0.1:5000/api/cnpj/${rota}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documento: cnpjGlobal, senha }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
            alert("Acesso liberado!");
            document.getElementById("verifyOverlay").style.display = "none";
            document.getElementById("appHeader").style.display = "flex";
            document.getElementById("conteudoPrincipal").style.display = "block";

            document.getElementById("clientStatusText").textContent = `${data.usuario.nome} (${data.usuario.cnpj})`;

        } else {
            alert(data.error || "Erro ao autenticar.");
        }
    } catch (err) {
        alert("Erro no servidor.");
        console.error(err);
    }
});
