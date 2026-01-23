import { ShapeGenerators } from './ShapeGenerators.js';

export class ParticleSystem {
    constructor(scene, onProgress) {
        this.scene = scene;
        this.particleCount = 15000;
        this.radius = 20;
        this.onProgress = onProgress;
        
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.targetPositions = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);
        this.targetColors = new Float32Array(this.particleCount * 3);
        
        this.material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });
        
        this.baseScale = 1;
        this.points = null;
        this.morphProgress = 0;
        this.isMorphing = false;
    }
    
    async generateParticles() {
        const nebula = ShapeGenerators.generateNebula(this.particleCount, this.radius);
        
        this.positions.set(nebula.positions);
        this.targetPositions.set(nebula.positions);
        this.colors.set(nebula.colors);
        this.targetColors.set(nebula.colors);
        
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
        if (!this.points) return;
        
        if (!this.isMorphing) {
            this.points.rotation.y += 0.001;
        }
        
        const breathing = Math.sin(time * 0.001) * 0.1 + 1;
        this.points.scale.set(breathing, breathing, breathing);
    }
}
