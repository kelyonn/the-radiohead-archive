// All GLSL lives here.

export const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const particleVertex = /* glsl */ `
${NOISE_GLSL}
attribute vec3 positionB;
attribute float toneA;
attribute float toneB;
attribute vec4 aRand;

uniform float uMix;
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uVelocity;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3  uMouse;
uniform float uMouseForce;
uniform float uPulseR;
uniform float uPulseAmt;
uniform vec3  uPalA[3];
uniform vec3  uPalB[3];

varying vec3  vColor;
varying float vAlpha;

vec3 pal(vec3 c0, vec3 c1, vec3 c2, float t){
  return t < 0.5 ? mix(c0, c1, t * 2.0) : mix(c1, c2, (t - 0.5) * 2.0);
}

void main(){
  // staggered morph: each particle leaves/arrives at its own time
  float stag = aRand.x * 0.42;
  float t = clamp((uMix - stag) / 0.58, 0.0, 1.0);
  float te = t * t * (3.0 - 2.0 * t);
  float energy = sin(te * 3.14159265);

  vec3 p = mix(position, positionB, te);

  // idle flow field
  float ts = uTime * 0.12;
  vec3 q = p * 0.045 + vec3(aRand.y * 3.0, ts, aRand.z * 3.0);
  vec3 flow = vec3(snoise(q), snoise(q + 31.4), snoise(q + 71.7));
  float idleAmp = 0.55 + aRand.y * 0.9 + uBass * 3.2 + uVelocity * 4.0;
  p += flow * idleAmp;

  // disintegration burst while morphing
  vec3 dir = normalize(p + flow * 4.0 + 0.001);
  vec3 swirl = vec3(-p.z, 0.0, p.x) * 0.0;
  p += (flow * 26.0 + dir * 14.0) * energy * (0.4 + aRand.w);
  float a = energy * (aRand.y - 0.5) * 1.6;
  float ca = cos(a), sa = sin(a);
  p.xz = mat2(ca, -sa, sa, ca) * p.xz;

  // breathing with the low end
  p *= 1.0 + uBass * 0.055;

  // click pulse (expanding shock ring)
  float rd = length(p);
  float ring = exp(-pow((rd - uPulseR) * 0.16, 2.0)) * uPulseAmt;
  p += dir * ring * 4.5;

  // pointer repulsion + swirl
  vec3 dm = p - uMouse;
  float md2 = dot(dm, dm);
  float mf = exp(-md2 / 90.0) * uMouseForce;
  vec3 mdir = dm * inversesqrt(md2 + 0.01);
  p += mdir * mf * 7.0 + vec3(-mdir.y, mdir.x, 0.0) * mf * 3.0;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float sizeJitter = 0.45 + aRand.z * 1.1;
  float sz = uSize * sizeJitter * (1.0 + uHigh * 0.8 + ring * 1.5 + energy * 0.6);
  gl_PointSize = clamp(sz * uPixelRatio * (300.0 / -mv.z), 1.0, 22.0 * uPixelRatio);

  vec3 cA = pal(uPalA[0], uPalA[1], uPalA[2], clamp(toneA + (aRand.w - 0.5) * 0.12, 0.0, 1.0));
  vec3 cB = pal(uPalB[0], uPalB[1], uPalB[2], clamp(toneB + (aRand.w - 0.5) * 0.12, 0.0, 1.0));
  vec3 col = mix(cA, cB, te);
  float glow = 0.6 + aRand.w * 0.9 + uMid * 0.9 + ring * 2.0 + energy * 0.6;
  vColor = col * glow;
  vAlpha = smoothstep(220.0, 40.0, -mv.z);
}
`;

export const particleFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  float core = exp(-d * d * 5.5);
  float halo = (1.0 - d) * (1.0 - d) * 0.35;
  float a = (core + halo) * vAlpha;
  gl_FragColor = vec4(vColor, a * 0.23);
}
`;

export const bgVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;

export const bgFragment = /* glsl */ `
${NOISE_GLSL}
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform float uBass;
uniform float uProgress;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec2 uParallax;

float fbm(vec3 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a * snoise(p); p *= 2.02; a *= 0.5; }
  return s;
}
void main(){
  vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);
  uv += uParallax * 0.05;
  float t = uTime * 0.025;
  float n1 = fbm(vec3(uv * 1.3, t + uProgress * 0.7));
  float n2 = fbm(vec3(uv * 2.4 + 9.0, t * 1.4 - uProgress));
  float neb = smoothstep(-0.2, 0.9, n1);
  vec3 col = vec3(0.012, 0.014, 0.022);
  col += uColA * pow(neb, 2.6) * (0.11 + uBass * 0.12);
  col += uColB * pow(smoothstep(-0.1, 0.9, n2), 3.0) * 0.07;
  // soft floor glow
  float floorGlow = smoothstep(0.1, -0.7, uv.y) * 0.05;
  col += uColB * floorGlow;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
varying float vA;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.05 + aSeed * 40.0) * 2.0;
  p.x += cos(uTime * 0.04 + aSeed * 23.0) * 2.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.8 + aSeed * 1.6) * uPixelRatio * (200.0 / -mv.z);
  vA = 0.18 + aSeed * 0.5;
}
`;

export const dustFragment = /* glsl */ `
varying float vA;
uniform vec3 uColor;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(uColor, (1.0 - d) * vA);
}
`;

// Final composite: glitch, chromatic aberration, grain, scanlines, vignette
export const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRes: { value: [1, 1] },
    uAberration: { value: 0.0012 },
    uGlitch: { value: 0 },
    uGrain: { value: 0.028 },
    uVignette: { value: 1.0 },
    uScan: { value: 0.04 },
    uTint: { value: [1, 1, 1] },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uRes;
    uniform float uAberration;
    uniform float uGlitch;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uScan;
    uniform vec3 uTint;
    varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec2 uv = vUv;
      // block glitch
      float slice = floor(uv.y * 38.0);
      float tick = floor(uTime * 14.0);
      float h = hash(vec2(slice, tick));
      float on = step(1.0 - uGlitch * 0.45, h);
      uv.x += on * (hash(vec2(slice + 3.0, tick)) - 0.5) * 0.09 * uGlitch;
      // radial chromatic aberration (stronger at the edges)
      vec2 dc = uv - 0.5;
      float ab = uAberration * (1.0 + dot(dc, dc) * 5.0) + uGlitch * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dc * ab * 2.0).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dc * ab * 2.0).b;
      col *= uTint;
      // scanlines
      col *= 1.0 - uScan * (0.5 + 0.5 * sin(uv.y * uRes.y * 1.5));
      // vignette
      float v = smoothstep(1.05, 0.25, length(dc) * 1.25 * uVignette);
      col *= mix(0.25, 1.0, v);
      // grain
      float g = hash(uv * uRes + fract(uTime) * 91.7) - 0.5;
      col += g * uGrain;
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};
