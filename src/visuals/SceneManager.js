import { PostProcessor } from './PostProcessor.js';

export class SceneManager {
    constructor(containerId, isMobile = false) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.isMobile = isMobile;
        this.scene = new THREE.Scene();
        
        const aspect = window.innerWidth / window.innerHeight;
        const fov = isMobile ? 60 : 75;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.z = 50;
        
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: !isMobile,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setAnimationLoop(null); // We'll use our own RAF
        this.renderer.shadowMap.enabled = false; // Disable shadows for performance
        this.container.appendChild(this.renderer.domElement);
        
        if (!isMobile) {
            this.postProcessor = new PostProcessor(this.renderer, this.scene, this.camera);
        } else {
            this.postProcessor = null;
        }
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        if (this.postProcessor) {
            this.postProcessor.resize(width, height);
        }
    }
    
    update() {
        if (this.postProcessor) {
            this.postProcessor.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
