/**
 * Visualizador 3D Modular
 * Uso: new Viewer3D(containerId, filePath, options)
 */
class Viewer3D {
    constructor(containerId, filePath, options = {}) {
        this.container = document.getElementById(containerId);
        this.filePath = filePath;
        this.options = {
            backgroundColor: options.backgroundColor || 0xf0f0f0,
            modelColor: options.modelColor || 0x808080,
            cameraDistance: options.cameraDistance || 100,
            enableControls: options.enableControls !== false,
            autoRotate: options.autoRotate || false,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;

        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Container não encontrado:', this.container);
            return;
        }

        this.setupScene();
        this.setupLights();
        this.loadModel();
        this.animate();
        this.setupResize();
    }

    setupScene() {
        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);

        // Câmera
        const containerRect = this.container.getBoundingClientRect();
        this.camera = new THREE.PerspectiveCamera(
            75,
            containerRect.width / containerRect.height,
            0.1,
            1000
        );
        this.camera.position.z = this.options.cameraDistance;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(containerRect.width, containerRect.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Limpa o container e adiciona o canvas
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Controles
        if (this.options.enableControls && typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = this.options.autoRotate;
            this.controls.autoRotateSpeed = 2.0;
        }
    }

    setupLights() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Luz direcional principal
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Luz de preenchimento
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, -10, -5);
        this.scene.add(fillLight);
    }

    loadModel() {
        const fileExtension = this.filePath.toLowerCase().split('.').pop();

        const onProgress = (progress) => {
            if (progress.lengthComputable) {
                const percentComplete = progress.loaded / progress.total * 100;
                console.log(`Carregando: ${Math.round(percentComplete)}%`);
            }
        };

        const onError = (error) => {
            console.error('Erro ao carregar modelo:', error);
            this.showError('Erro ao carregar modelo 3D');
        };

        switch (fileExtension) {
            case 'stl':
                this.loadSTL(onProgress, onError);
                break;
            case 'glb':
            case 'gltf':
                this.loadGLTF(onProgress, onError);
                break;
            case 'obj':
                this.loadOBJ(onProgress, onError);
                break;
            default:
                console.error('Formato de arquivo não suportado:', fileExtension);
                this.showError('Formato de arquivo não suportado');
        }
    }

    loadSTL(onProgress, onError) {
        if (typeof THREE.STLLoader === 'undefined') {
            console.error('STLLoader não está disponível');
            onError('STLLoader não carregado');
            return;
        }

        const loader = new THREE.STLLoader();
        loader.load(this.filePath, (geometry) => {
            const material = new THREE.MeshPhongMaterial({
                color: this.options.modelColor,
                shininess: 100,
                specular: 0x111111
            });

            this.model = new THREE.Mesh(geometry, material);
            this.model.castShadow = true;
            this.model.receiveShadow = true;

            this.scene.add(this.model);
            this.centerModel();
            this.adjustCamera();
        }, onProgress, onError);
    }

    loadGLTF(onProgress, onError) {
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.error('GLTFLoader não está disponível');
            onError('GLTFLoader não carregado');
            return;
        }

        const loader = new THREE.GLTFLoader();
        loader.load(this.filePath, (gltf) => {
            this.model = gltf.scene;
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(this.model);
            this.centerModel();
            this.adjustCamera();
        }, onProgress, onError);
    }

    loadOBJ(onProgress, onError) {
        if (typeof THREE.OBJLoader === 'undefined') {
            console.error('OBJLoader não está disponível');
            onError('OBJLoader não carregado');
            return;
        }

        const loader = new THREE.OBJLoader();
        loader.load(this.filePath, (obj) => {
            this.model = obj;
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: this.options.modelColor
                    });
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(this.model);
            this.centerModel();
            this.adjustCamera();
        }, onProgress, onError);
    }

    centerModel() {
        if (!this.model) return;

        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
    }

    adjustCamera() {
        if (!this.model) return;

        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Ajusta a distância da câmera baseada no tamanho do modelo
        const distance = maxDim * 2;
        this.camera.position.set(distance, distance, distance);
        this.camera.lookAt(0, 0, 0);

        if (this.controls) {
            this.controls.maxDistance = distance * 3;
            this.controls.minDistance = maxDim * 0.5;
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div style="
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                color: #666; 
                font-family: Arial, sans-serif;
                text-align: center;
                flex-direction: column;
            ">
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <div>${message}</div>
            </div>
        `;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    setupResize() {
        window.addEventListener('resize', () => this.onWindowResize());

        // Observer para mudanças no container
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(() => this.onWindowResize());
            resizeObserver.observe(this.container);
        }
    }

    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const containerRect = this.container.getBoundingClientRect();

        this.camera.aspect = containerRect.width / containerRect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(containerRect.width, containerRect.height);
    }

    // Método para destruir o visualizador
    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

loadNewModel(filePath) {
    // Remove modelo anterior
    if (this.model) {
        this.scene.remove(this.model);
        this.model = null;
    }

    this.filePath = filePath;
    this.loadModel();
}