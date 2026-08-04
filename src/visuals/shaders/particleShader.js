export const particleVertexShader = `
    attribute vec3 color;
    
    uniform float size;
    
    varying vec3 vColor;
    varying float vDistance;
    
    void main() {
        vec3 pos = position;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vDistance = -mvPosition.z;
        vColor = color;
        
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

export const particleFragmentShader = `
    varying vec3 vColor;
    
    void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        if (dist > 0.5) {
            discard;
        }
        
        float alpha = 1.0 - (dist * 2.0);
        alpha = pow(alpha, 2.0);
        
        gl_FragColor = vec4(vColor, alpha);
    }
`;

export function createParticleShaderMaterial(uniforms) {
    return new THREE.ShaderMaterial({
        uniforms: {
            size: { value: 0.2 },
            ...uniforms
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
}
