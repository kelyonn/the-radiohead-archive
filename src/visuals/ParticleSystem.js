import { ShapeGenerators } from './ShapeGenerators.js';
import { createParticleShaderMaterial } from './shaders/particleShader.js';

export class ParticleSystem {
    constructor(scene, camera, onProgress, particleCount = 15000) {
        this.scene = scene;
        this.camera = camera;
        this.particleCount = particleCount;
        this.radius = 20;
        this.onProgress = onProgress;
        
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.targetPositions = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);
        this.targetColors = new Float32Array(this.particleCount * 3);
        
        this.material = createParticleShaderMaterial();
        
        this.baseScale = 1;
        this.points = null;
        this.morphProgress = 0;
        this.isMorphing = false;
        this.mousePosition = new THREE.Vector3(0, 0, 0);
        this.interactionStrength = 0.0;
        this.audioLevel = 0.0;
    }
    
    setMousePosition(x, y, z) {
        this.mousePosition.set(x, y, z);
        if (this.material && this.material.uniforms) {
            this.material.uniforms.mousePosition.value.copy(this.mousePosition);
        }
    }
    
    setInteractionStrength(strength) {
        this.interactionStrength = strength;
        if (this.material && this.material.uniforms) {
            this.material.uniforms.interactionStrength.value = strength;
        }
    }
    
    setAudioLevel(level) {
        this.audioLevel = level;
        if (this.material && this.material.uniforms) {
            this.material.uniforms.audioLevel.value = level;
        }
    }
    
    async generateParticles() {
        // Get poster dimensions based on screen size
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
        
        this.positions.set(screenSpread.positions);
        this.targetPositions.set(screenSpread.positions);
        this.colors.set(screenSpread.colors);
        this.targetColors.set(screenSpread.colors);
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
        
        if (this.onProgress) {
            this.onProgress(100, `GENERATING PARTICLES: ${this.particleCount}/${this.particleCount}`);
        }
    }
    
    morphToShape(shapeType, duration = 2) {
        if (this.isMorphing) return;
        
        this.isMorphing = true;
        let targetShape;
        
        switch(shapeType) {
            case 'nebula':
                targetShape = ShapeGenerators.generateNebula(this.particleCount, this.radius);
                break;
            case 'grid':
                targetShape = ShapeGenerators.generateGrid(this.particleCount, this.radius);
                break;
            case 'terrain':
                targetShape = ShapeGenerators.generateTerrain(this.particleCount, this.radius);
                break;
            default:
                this.isMorphing = false;
                return;
        }
        
        this.targetPositions.set(targetShape.positions);
        this.targetColors.set(targetShape.colors);
        
        const startPositions = new Float32Array(this.positions);
        const startColors = new Float32Array(this.colors);
        
        const timeline = gsap.timeline({
            onComplete: () => {
                this.isMorphing = false;
            }
        });
        
        timeline.to({ progress: 0 }, {
            progress: 1,
            duration: duration,
            ease: 'power2.inOut',
            onUpdate: (self) => {
                const t = self.progress;
                const easeT = t < 0.5 
                    ? 2 * t * t 
                    : -1 + (4 - 2 * t) * t;
                
                for (let i = 0; i < this.particleCount * 3; i++) {
                    this.positions[i] = startPositions[i] + (this.targetPositions[i] - startPositions[i]) * easeT;
                    this.colors[i] = startColors[i] + (this.targetColors[i] - startColors[i]) * easeT;
                }
                
                this.geometry.attributes.position.needsUpdate = true;
                this.geometry.attributes.color.needsUpdate = true;
            }
        });
    }
    
    update(time) {
        // No animations - particles are static
    }
}
