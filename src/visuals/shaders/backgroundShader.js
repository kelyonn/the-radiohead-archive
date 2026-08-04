export const backgroundVertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const backgroundFragmentShader = `
    uniform float time;
    uniform vec3 eraColor;
    uniform float audioLevel;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
        vec2 uv = vUv;
        
        // Animated gradient
        vec3 color1 = vec3(0.0, 0.0, 0.0);
        vec3 color2 = eraColor * 0.3;
        vec3 color3 = eraColor * 0.1;
        
        float gradient = sin(uv.y * 3.14159 + time * 0.5) * 0.5 + 0.5;
        vec3 baseColor = mix(color1, mix(color2, color3, gradient), 0.3);
        
        // Noise distortion
        float n = smoothNoise(uv * 5.0 + time * 0.3);
        n = n * 0.1;
        
        // Audio-reactive pulsing
        float pulse = sin(time * 2.0 + uv.x * 10.0) * audioLevel * 0.2;
        
        vec3 finalColor = baseColor + vec3(n) + pulse;
        
        // Vignette
        float dist = distance(uv, vec2(0.5));
        float vignette = 1.0 - smoothstep(0.3, 0.8, dist);
        
        gl_FragColor = vec4(finalColor * vignette, 0.15);
    }
`;

export function createBackgroundMaterial(uniforms) {
    return new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            eraColor: { value: new THREE.Vector3(1, 1, 1) },
            audioLevel: { value: 0 },
            ...uniforms
        },
        vertexShader: backgroundVertexShader,
        fragmentShader: backgroundFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
}
