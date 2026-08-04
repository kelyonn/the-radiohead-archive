export class PostProcessor {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        this.composer = null;
        this.bloomPass = null;
        this.filmGrainPass = null;
        this.chromaticAberrationPass = null;
        this.vignettePass = null;
        this.colorGradingPass = null;
        this.currentEraColor = { r: 1.0, g: 1.0, b: 1.0 };
        
        this.init();
    }
    
    init() {
        if (typeof THREE.EffectComposer === 'undefined') {
            console.warn('EffectComposer not available, post-processing disabled');
            return;
        }
        
        this.composer = new THREE.EffectComposer(this.renderer);
        
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        if (typeof THREE.UnrealBloomPass !== 'undefined') {
            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                2.5,  // Increased strength for more visible bloom
                0.6,  // Increased radius
                0.95   // Increased threshold
            );
            this.composer.addPass(this.bloomPass);
        }
        
        this.filmGrainPass = this.createFilmGrainPass();
        if (this.filmGrainPass) {
            this.composer.addPass(this.filmGrainPass);
        }
        
        this.chromaticAberrationPass = this.createChromaticAberrationPass();
        if (this.chromaticAberrationPass) {
            this.composer.addPass(this.chromaticAberrationPass);
        }
        
        this.vignettePass = this.createVignettePass();
        if (this.vignettePass) {
            this.composer.addPass(this.vignettePass);
        }
        
        this.colorGradingPass = this.createColorGradingPass();
        if (this.colorGradingPass) {
            this.composer.addPass(this.colorGradingPass);
        }
    }
    
    createFilmGrainPass() {
        if (typeof THREE.ShaderPass === 'undefined') {
            return null;
        }
        
        const filmGrainShader = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                intensity: { value: 0.15 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                
                float random(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    float noise = random(vUv + time) * intensity;
                    gl_FragColor = color + vec4(noise, noise, noise, 0.0);
                }
            `
        };
        
        try {
            const pass = new THREE.ShaderPass(filmGrainShader);
            pass.renderToScreen = false;
            return pass;
        } catch (e) {
            console.warn('Film grain pass creation failed:', e);
            return null;
        }
    }
    
    createChromaticAberrationPass() {
        if (typeof THREE.ShaderPass === 'undefined') {
            return null;
        }
        
        const chromaticShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: 0.005 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                
                void main() {
                    vec2 offset = (vUv - 0.5) * amount;
                    float r = texture2D(tDiffuse, vUv + offset).r;
                    float g = texture2D(tDiffuse, vUv).g;
                    float b = texture2D(tDiffuse, vUv - offset).b;
                    gl_FragColor = vec4(r, g, b, 1.0);
                }
            `
        };
        
        try {
            const pass = new THREE.ShaderPass(chromaticShader);
            pass.renderToScreen = true;
            return pass;
        } catch (e) {
            console.warn('Chromatic aberration pass creation failed:', e);
            return null;
        }
    }
    
    createVignettePass() {
        if (typeof THREE.ShaderPass === 'undefined') {
            return null;
        }
        
        const vignetteShader = {
            uniforms: {
                tDiffuse: { value: null },
                offset: { value: 1.0 },
                darkness: { value: 1.5 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float offset;
                uniform float darkness;
                varying vec2 vUv;
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
                    float dist = length(uv);
                    float vignette = smoothstep(0.8, 0.3, dist);
                    color.rgb = mix(color.rgb * darkness, color.rgb, vignette);
                    gl_FragColor = color;
                }
            `
        };
        
        try {
            const pass = new THREE.ShaderPass(vignetteShader);
            pass.renderToScreen = false;
            return pass;
        } catch (e) {
            console.warn('Vignette pass creation failed:', e);
            return null;
        }
    }
    
    createColorGradingPass() {
        if (typeof THREE.ShaderPass === 'undefined') {
            return null;
        }
        
        const colorGradingShader = {
            uniforms: {
                tDiffuse: { value: null },
                colorShift: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
                saturation: { value: 1.0 },
                contrast: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec3 colorShift;
                uniform float saturation;
                uniform float contrast;
                varying vec2 vUv;
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    
                    // Apply color shift
                    color.rgb *= colorShift;
                    
                    // Apply saturation
                    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    color.rgb = mix(vec3(gray), color.rgb, saturation);
                    
                    // Apply contrast
                    color.rgb = ((color.rgb - 0.5) * contrast) + 0.5;
                    
                    gl_FragColor = color;
                }
            `
        };
        
        try {
            const pass = new THREE.ShaderPass(colorGradingShader);
            pass.renderToScreen = true;
            return pass;
        } catch (e) {
            console.warn('Color grading pass creation failed:', e);
            return null;
        }
    }
    
    setEraColor(color) {
        this.currentEraColor = color;
        if (this.colorGradingPass && this.colorGradingPass.uniforms) {
            this.colorGradingPass.uniforms.colorShift.value.set(color.r, color.g, color.b);
        }
    }
    
    resize(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }
    
    render() {
        if (this.composer) {
            if (this.filmGrainPass && this.filmGrainPass.uniforms) {
                this.filmGrainPass.uniforms.time.value += 0.01;
            }
            if (this.bloomPass) {
                this.bloomPass.renderToScreen = false;
            }
            if (this.vignettePass) {
                this.vignettePass.renderToScreen = false;
            }
            if (this.colorGradingPass) {
                this.colorGradingPass.renderToScreen = true;
            }
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
