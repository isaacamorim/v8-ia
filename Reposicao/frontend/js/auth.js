/* js/auth.js */
function verificarCNPJ() {
    const cnpj = document.getElementById('cnpj').value;
    fetch('/api/auth/check-cnpj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj })
    }).then(r => r.json()).then(res => {
        if (res.exists) {
            window.location.href = 'login.html';
        } else {
            alert('CNPJ não encontrado. Envie uma mensagem para cadastro.');
        }
    });
}

function fazerLogin() {
    const cnpj = document.getElementById('cnpj_login').value;
    const senha = document.getElementById('senha').value;
    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj, senha })
    }).then(r => {
        if (r.ok) {
            window.location.href = 'index.html';
        } else {
            alert('Login incorreto');
        }
    });
}

function definirSenha() {
    const cnpj = document.getElementById('cnpj_definir').value;
    const nova = document.getElementById('nova_senha').value;
    fetch('/api/auth/definir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj, senha: nova })
    }).then(r => {
        if (r.ok) alert('Senha definida');
    });
  }