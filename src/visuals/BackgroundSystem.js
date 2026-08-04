import { ShapeGenerators } from './ShapeGenerators.js';
import { createParticleShaderMaterial } from './shaders/particleShader.js';
import { createBackgroundMaterial } from './shaders/backgroundShader.js';

export class BackgroundSystem {
    constructor(scene, camera, particleCount = 12000) {
        this.scene = scene;
        this.camera = camera;
        this.particleCount = particleCount;
        
        // Particle system
        this.particleGeometry = new THREE.BufferGeometry();
        this.particlePositions = new Float32Array(this.particleCount * 3);
        this.particleColors = new Float32Array(this.particleCount * 3);
        this.particleMaterial = createParticleShaderMaterial({ size: { value: 0.15 } });
        this.particles = null;
        
        // 3D geometries removed
        
        // Animation state
        this.time = 0;
        this.audioLevel = 0;
        this.backgroundPlane = null;
        this.currentEraColor = new THREE.Vector3(1, 1, 1);
        
        this.init();
    }
    
    init() {
        // Create background plane with shader
        this.createBackgroundPlane();
        
        // Initialize particles
        this.generateParticles();
    }
    
    createBackgroundPlane() {
        const geometry = new THREE.PlaneGeometry(200, 200);
        const material = createBackgroundMaterial();
        this.backgroundPlane = new THREE.Mesh(geometry, material);
        this.backgroundPlane.position.z = -100;
        this.scene.add(this.backgroundPlane);
    }
    
    setEraColor(color) {
        this.currentEraColor.set(color.r, color.g, color.b);
        if (this.backgroundPlane && this.backgroundPlane.material.uniforms) {
            this.backgroundPlane.material.uniforms.eraColor.value.set(color.r, color.g, color.b);
        }
    }
    
    generateParticles() {
        // Get poster dimensions
        let posterWidth = 300;
        let posterHeight = 300;
        if (window.innerWidth <= 480) {
            posterWidth = 150;
            posterHeight = 150;
        } else if (window.innerWidth <= 768) {
            posterWidth = 200;
            posterHeight = 200;
        }
        
        const screenSpread = ShapeGenerators.generateScreenSpread(
            this.particleCount,
            this.camera,
            posterWidth,
            posterHeight
        );
        
        this.particlePositions.set(screenSpread.positions);
        this.particleColors.set(screenSpread.colors);
        
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));
        
        this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.particles.position.z = -20; // Starting position - will move with scroll
        this.scene.add(this.particles);
    }
    
    morphToEra(eraId, duration = 2.5) {
        // Update era color for background shader
        const eraColors = {
            'in_rainbows': { r: 1, g: 0, b: 0.5 },
            'ok_computer': { r: 0, g: 1, b: 1 },
            'kid_a': { r: 1, g: 1, b: 1 }
        };
        
        if (eraColors[eraId]) {
            this.setEraColor(eraColors[eraId]);
        }
    }
    
    setAudioLevel(level) {
        this.audioLevel = level;
    }
    
    update(time) {
        this.time = time * 0.001;
        
        // Update background shader
        if (this.backgroundPlane && this.backgroundPlane.material.uniforms) {
            this.backgroundPlane.material.uniforms.time.value = this.time;
            this.backgroundPlane.material.uniforms.audioLevel.value = this.audioLevel;
        }
        
        // Animate particles with subtle motion (throttled for performance)
        if (this.particles && this.particles.visible) {
            const positions = this.particleGeometry.attributes.position.array;
            const updateInterval = 2; // Update every 2 frames
            const frame = Math.floor(this.time * 60) % updateInterval;
            
            if (frame === 0) {
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += Math.sin(this.time + i * 0.001) * 0.01;
                    positions[i + 1] += Math.cos(this.time * 1.2 + i * 0.001) * 0.01;
                    positions[i + 2] += Math.sin(this.time * 0.8 + i * 0.001) * 0.005;
                }
                this.particleGeometry.attributes.position.needsUpdate = true;
            }
            
            // Subtle rotation
            this.particles.rotation.y += 0.0002;
        }
        
    }
}
