let viewer3D = null;
let autoRotateEnabled = false;

function carregarModelo3D(caminhoDoArquivo, opcoes = {}) {
    try {
        if (viewer3D) viewer3D.destroy();

        viewer3D = new Viewer3D('modelo3d', caminhoDoArquivo, {
            backgroundColor: 0xf8f9fa,
            modelColor: 0x6c757d,
            autoRotate: false,
            ...opcoes
        });

        console.log('Modelo carregado:', caminhoDoArquivo);
    } catch (error) {
        console.error('Erro ao carregar modelo:', error);
        document.getElementById('modelo3d').innerHTML = `
            <div class="loading">
                <div>❌</div>
                <div>Erro ao carregar modelo</div>
                <button class="btn" onclick="carregarModelo3D('${caminhoDoArquivo}')">TENTAR NOVAMENTE</button>
            </div>
        `;
    }
}

function resetarCamera() {
    if (viewer3D?.controls) {
        viewer3D.controls.reset();
    }
}

function toggleAutoRotate() {
    if (viewer3D?.controls) {
        autoRotateEnabled = !autoRotateEnabled;
        viewer3D.controls.autoRotate = autoRotateEnabled;

        const btn = event.target;
        btn.textContent = autoRotateEnabled ? 'Parar Rotação' : 'Auto Rotação';
        btn.style.backgroundColor = autoRotateEnabled ? '#dc3545' : '#28a745';
    }
}

window.addEventListener('beforeunload', () => {
    if (viewer3D) viewer3D.destroy();
});
