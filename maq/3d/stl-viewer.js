// stl-viewer.js

class STLViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container com id "${containerId}" não encontrado.`);
            return;
        }

        // Configurações padrão
        this.defaults = {
            initialFile: null,
            canvasId: 'stl-canvas-' + Math.random().toString(36).substr(2, 9),
            loadingId: 'stl-loading-' + Math.random().toString(36).substr(2, 9),
            fileInputId: 'stl-file-input-' + Math.random().toString(36).substr(2, 9),
            backgroundColor: 0xf5f5f5,
            modelColor: 0x999999,
            outlineColor: 0x000000
        };

        // Merge de opções
        this.options = { ...this.defaults, ...options };

        // Inicializa o visualizador
        this.init();
    }

    init() {
        // Cria elementos DOM
        this.createDOM();

        // Inicializa a cena Three.js
        this.initThreeJS();

        // Carrega arquivo inicial se especificado
        if (this.options.initialFile) {
            this.loadSTLFileFromURL(this.options.initialFile);
        }
    }

    createDOM() {
        // Cria o canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = this.options.canvasId;
        this.canvas.className = 'viewer-canvas';
        this.container.appendChild(this.canvas);

        // Cria elemento de loading
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = this.options.loadingId;
        this.loadingElement.className = 'loading';
        this.loadingElement.style.display = 'none';
        this.loadingElement.textContent = 'Carregando...';
        this.container.appendChild(this.loadingElement);

        // Cria input de arquivo
        this.fileInput = document.createElement('input');
        this.fileInput.id = this.options.fileInputId;
        this.fileInput.type = 'file';
        this.fileInput.className = 'file-input';
        this.fileInput.accept = '.stl';
        this.container.appendChild(this.fileInput);

        // Adiciona event listener
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    initThreeJS() {
        // Inicialização da cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        // Câmera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            10000
        );

        // Renderizador
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));

        // Pós-processamento para contorno
        this.composer = new THREE.EffectComposer(this.renderer);
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.outlinePass = new THREE.OutlinePass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            this.scene,
            this.camera
        );
        this.outlinePass.edgeStrength = 3.0;
        this.outlinePass.edgeGlow = 0.0;
        this.outlinePass.edgeThickness = 1.0;
        this.outlinePass.visibleEdgeColor.set(this.options.outlineColor);
        this.outlinePass.hiddenEdgeColor.set(this.options.outlineColor);
        this.composer.addPass(this.outlinePass);

        // Controles de órbita
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5000;

        // Iluminação
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Evento de redimensionamento
        window.addEventListener('resize', () => this.onWindowResize());

        // Inicia animação
        this.animate();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.stl')) {
            alert('Selecione um arquivo .stl válido');
            return;
        }
        this.loadSTLFile(file);
    }

    loadSTLFile(file) {
        this.showLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            this.parseSTL(e.target.result);
            this.showLoading(false);
        };
        reader.readAsArrayBuffer(file);
    }

    loadSTLFileFromURL(url) {
        this.showLoading(true);
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(data => {
                this.parseSTL(data);
                this.showLoading(false);
            })
            .catch(error => {
                console.error('Erro ao carregar o arquivo STL:', error);
                this.showLoading(false);
            });
    }

    parseSTL(arrayBuffer) {
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(arrayBuffer);
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
            color: this.options.modelColor,
            shininess: 30,
            specular: 0x111111,
            flatShading: true
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Remove modelo anterior se existir
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }

        // Adiciona novo modelo
        this.currentModel = mesh;
        this.scene.add(this.currentModel);

        // Aplica contorno
        this.outlinePass.selectedObjects = [this.currentModel];

        // Centraliza a câmera
        this.centerCamera(this.currentModel);
    }

    centerCamera(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.5;

        this.camera.position.copy(center).add(new THREE.Vector3(distance, distance, distance));
        this.controls.target.copy(center);
        this.controls.update();
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.outlinePass.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    showLoading(show) {
        this.loadingElement.style.display = show ? 'block' : 'none';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.composer.render();
    }
}