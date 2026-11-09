import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  particleVertex, particleFragment, bgVertex, bgFragment, dustVertex, dustFragment, FinalShader,
} from './shaders.js';

const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));

/**
 * The WebGL stage: GPU-morphing particle sculpture, nebula backdrop, dust,
 * bloom + glitch/aberration/grain post stack.
 */
export class Stage {
  constructor(container, { count, mobile, albums }) {
    this.container = container;
    this.mobile = mobile;
    this.count = count;
    this.albums = albums;
    this.palettes = albums.map((a) => a.palette.map((h) => new THREE.Color(h)));

    this.pointer = new THREE.Vector2(0, 0);
    this.pointerSmooth = new THREE.Vector2(0, 0);
    this.pointerActive = false;
    this.mouseForce = 0;
    this.time = 0;
    this.progress = 0; // smoothed scroll progress in album units
    this.targetProgress = 0;
    this.velocity = 0;
    this.pulse = { r: 0, amt: 0 };
    this.bass = 0; this.mid = 0; this.high = 0;
    this.pixelRatioCap = mobile ? 1.5 : 2;
    this.quality = 1;
    this.reactive = false; // false: audio does not alter visuals (same calm look as silent)
    this._react = 0;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // MSAA is wasted on additive point sprites
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);
    this.camera.position.set(0, 0, 72);

    this._buildBackground();
    this._buildDust();
    this._buildParticles();
    this._buildComposer();
    this.resize();
  }

  // ---- construction -------------------------------------------------------
  _buildBackground() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.bgMat = new THREE.ShaderMaterial({
      vertexShader: bgVertex,
      fragmentShader: bgFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uAspect: { value: 1 }, uBass: { value: 0 }, uProgress: { value: 0 },
        uColA: { value: new THREE.Color() }, uColB: { value: new THREE.Color() }, uParallax: { value: new THREE.Vector2() },
      },
    });
    const mesh = new THREE.Mesh(geo, this.bgMat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    this.scene.add(mesh);
  }

  _buildDust() {
    const n = this.mobile ? 1200 : 3200;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 180;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 110;
      pos[i * 3 + 2] = -Math.random() * 220 - 30;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.dustMat = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uColor: { value: new THREE.Color('#9fb4ff') } },
    });
    this.dust = new THREE.Points(geo, this.dustMat);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  _buildParticles() {
    const n = this.count;
    this.geometry = new THREE.BufferGeometry();
    this.positionAttrs = [];
    this.toneAttrs = [];

    // per-particle randoms: x = morph delay, y = flow phase, z = size, w = brightness
    const rnd = new Float32Array(n * 4);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
    this.geometry.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));

    const empty = new Float32Array(n * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(empty, 3));
    this.geometry.setAttribute('positionB', new THREE.BufferAttribute(empty, 3));
    this.geometry.setAttribute('toneA', new THREE.BufferAttribute(new Float32Array(n), 1));
    this.geometry.setAttribute('toneB', new THREE.BufferAttribute(new Float32Array(n), 1));
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);

    const pal = () => [new THREE.Color(), new THREE.Color(), new THREE.Color()];
    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMix: { value: 0 }, uTime: { value: 0 }, uBass: { value: 0 }, uMid: { value: 0 }, uHigh: { value: 0 },
        uVelocity: { value: 0 }, uSize: { value: this.mobile ? 0.7 : 0.5 }, uPixelRatio: { value: 1 },
        uMouse: { value: new THREE.Vector3(1e4, 1e4, 0) }, uMouseForce: { value: 0 },
        uPulseR: { value: 0 }, uPulseAmt: { value: 0 },
        uPalA: { value: pal() }, uPalB: { value: pal() },
      },
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group = new THREE.Group();
    this.group.add(this.points);
    this.scene.add(this.group);
  }

  _buildComposer() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), this.mobile ? 0.55 : 0.7, 0.55, 0.35);
    this.composer.addPass(this.bloom);
    this.finalPass = new ShaderPass(FinalShader);
    this.composer.addPass(this.finalPass);
    this.composer.addPass(new OutputPass());
  }

  /** Upload generated shapes (array of {pos, tone}) as static GPU buffers. */
  setShapes(shapes) {
    this.positionAttrs = shapes.map((s) => new THREE.BufferAttribute(s.pos, 3));
    this.toneAttrs = shapes.map((s) => new THREE.BufferAttribute(s.tone, 1));
    this._boundIndex = -1;
    this._bind(0);
  }

  _bind(i) {
    if (this._boundIndex === i || !this.positionAttrs.length) return;
    const last = this.positionAttrs.length - 1;
    const j = Math.min(i + 1, last);
    this.geometry.setAttribute('position', this.positionAttrs[i]);
    this.geometry.setAttribute('positionB', this.positionAttrs[j]);
    this.geometry.setAttribute('toneA', this.toneAttrs[i]);
    this.geometry.setAttribute('toneB', this.toneAttrs[j]);
    const u = this.material.uniforms;
    for (let k = 0; k < 3; k++) {
      u.uPalA.value[k].copy(this.palettes[i][k]);
      u.uPalB.value[k].copy(this.palettes[j][k]);
    }
    this._boundIndex = i;
  }

  // ---- runtime API ----------------------------------------------------------
  setProgress(p) { this.targetProgress = p; }

  setPointer(nx, ny, active = true) {
    this.pointer.set(nx, ny);
    this.pointerActive = active;
  }

  /** Shockwave from the centre of the sculpture (e.g. when a track is clicked). */
  ping(strength = 1) {
    this.pulse.r = 0;
    this.pulse.amt = strength;
    this.glitchKick = Math.min(1, (this.glitchKick || 0) + 0.5 * strength);
  }

  setAudio(bass, mid, high) {
    // Reactive mode: audio drives the visuals, at reduced strength. Otherwise the look matches silent.
    const k = this.reactive ? 0.5 : 0;
    bass *= k; mid *= k; high *= k;
    this.bass = damp(this.bass, bass, bass > this.bass ? 28 : 7, this._dt || 0.016);
    this.mid = damp(this.mid, mid, 14, this._dt || 0.016);
    this.high = damp(this.high, high, 14, this._dt || 0.016);
  }

  setQuality(q) {
    this.quality = q; // 0.5..1
    const n = Math.floor(this.count * (0.45 + 0.55 * q));
    this.geometry.setDrawRange(0, n);
    this._applyPixelRatio();
  }

  _applyPixelRatio() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.pixelRatioCap) * (0.6 + 0.4 * this.quality);
    this.renderer.setPixelRatio(dpr);
    this.composer.setPixelRatio(dpr);
    this.material.uniforms.uPixelRatio.value = dpr;
    this.dustMat.uniforms.uPixelRatio.value = dpr;
    this.dpr = dpr;
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.width = w; this.height = h;
    this.renderer.setSize(w, h);
    this._applyPixelRatio();
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // keep the sculpture framed on narrow/portrait screens
    this.camera.position.z = this.camera.aspect < 0.8 ? 98 : this.camera.aspect < 1.3 ? 86 : 72;
    this.camera.updateProjectionMatrix();
    this.finalPass.uniforms.uRes.value = [w * this.dpr, h * this.dpr];
    this.layoutMode = w < 900 ? 'stacked' : 'side';
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    this._dt = dt;
    this.time += dt;

    // smoothed scroll progress + velocity (used for glitch energy)
    const prev = this.progress;
    this.progress = damp(this.progress, this.targetProgress, 5.5, dt);
    if (Math.abs(this.progress - this.targetProgress) < 1e-4) this.progress = this.targetProgress;
    const vel = Math.abs(this.progress - prev) / dt;
    this.velocity = damp(this.velocity, Math.min(vel, 3), 6, dt);

    const last = this.albums.length - 1;
    const p = Math.min(Math.max(this.progress, 0), last);
    let i = Math.floor(p);
    let f = p - i;
    if (i >= last) { i = last - 1; f = 1; }
    this._bind(i);

    const u = this.material.uniforms;
    u.uMix.value = f;
    u.uTime.value = this.time;
    u.uBass.value = this.bass; u.uMid.value = this.mid; u.uHigh.value = this.high;
    u.uVelocity.value = Math.min(this.velocity, 2) * 0.35;

    // pulse
    this.pulse.r += dt * 70;
    this.pulse.amt = Math.max(0, this.pulse.amt - dt * 1.1);
    u.uPulseR.value = this.pulse.r;
    u.uPulseAmt.value = this.pulse.amt;

    // layout: sculpture sits right of the text on wide screens, above on narrow
    const side = this.layoutMode === 'side';
    const tx = side ? 15 : 0, ty = side ? 0 : 11, ts = side ? 1 : 0.78;

    if (!this.viewOverride) {
      this.group.position.x = damp(this.group.position.x, tx, 4, dt);
      this.group.position.y = damp(this.group.position.y, ty, 4, dt);
      this.group.scale.setScalar(damp(this.group.scale.x, ts, 4, dt));
    }

    // pointer parallax + slow sway
    this.pointerSmooth.x = damp(this.pointerSmooth.x, this.pointer.x, 3, dt);
    this.pointerSmooth.y = damp(this.pointerSmooth.y, this.pointer.y, 3, dt);
    this.group.rotation.y = Math.sin(this.time * 0.13) * 0.38 + this.pointerSmooth.x * 0.35;
    this.group.rotation.x = 0.1 + Math.sin(this.time * 0.1 + 1.0) * 0.06 - this.pointerSmooth.y * 0.2;
    this.camera.position.x = damp(this.camera.position.x, this.pointerSmooth.x * 2.0, 3, dt);
    this.camera.position.y = damp(this.camera.position.y, this.pointerSmooth.y * 1.2, 3, dt);
    if (this.viewOverride) {
      const v = this.viewOverride;
      this.group.position.set(0, 0, 0); this.group.scale.setScalar(v.scale);
      this.group.rotation.set(v.rx, v.ry, 0);
      this.camera.position.set(0, 0, v.cz);
    }
    this.camera.lookAt(0, 0, 0);

    // pointer → local space ray/plane hit for repulsion
    this.mouseForce = damp(this.mouseForce, this.pointerActive ? 1 : 0, 4, dt);
    this.group.updateMatrixWorld(true);
    const ndc = new THREE.Vector3(this.pointer.x, this.pointer.y, 0.5).unproject(this.camera);
    const dir = ndc.sub(this.camera.position).normalize();
    const planeZ = this.group.position.z;
    const tHit = (planeZ - this.camera.position.z) / dir.z;
    const hit = this.camera.position.clone().addScaledVector(dir, tHit);
    this.group.worldToLocal(hit);
    u.uMouse.value.copy(hit);
    u.uMouseForce.value = this.mouseForce;

    // palette-driven colours for the backdrop and tint
    const a = Math.min(Math.floor(p), last), b = Math.min(a + 1, last);
    const mixF = p - a;
    this.bgMat.uniforms.uColA.value.copy(this.palettes[a][0]).lerp(this.palettes[b][0], mixF);
    this.bgMat.uniforms.uColB.value.copy(this.palettes[a][1]).lerp(this.palettes[b][2], mixF);
    this.bgMat.uniforms.uTime.value = this.time;
    this.bgMat.uniforms.uBass.value = this.bass;
    this.bgMat.uniforms.uProgress.value = p;
    this.bgMat.uniforms.uAspect.value = this.camera.aspect;
    this.bgMat.uniforms.uParallax.value.copy(this.pointerSmooth);
    this.dustMat.uniforms.uTime.value = this.time;
    this.dustMat.uniforms.uColor.value.copy(this.bgMat.uniforms.uColA.value).lerp(new THREE.Color(1, 1, 1), 0.6);
    this.dust.position.x = -this.pointerSmooth.x * 6;
    this.dust.position.y = -this.pointerSmooth.y * 4;

    // post
    this.glitchKick = damp(this.glitchKick || 0, 0, 5, dt);
    const trans = Math.sin(Math.PI * f) * (this.velocity > 0.02 ? 1 : 0);
    const glitch = (this.reduced ? 0.15 : 1) * Math.min(1, this.glitchKick + Math.min(this.velocity, 2) * 0.5 + trans * 0.15);
    const fu = this.finalPass.uniforms;
    fu.uTime.value = this.time;
    fu.uGlitch.value = glitch;
    fu.uAberration.value = 0.0012 + this.bass * 0.004 + glitch * 0.004;
    this._react = damp(this._react, this.reactive ? 1 : 0, 3, dt);
    this.bloom.strength = (this.mobile ? 0.55 : 0.7) * (1 - 0.4 * this._react) + this.bass * 0.5 + glitch * 0.3;
    this.renderer.toneMappingExposure = 1.15 - 0.35 * this._react;

    this.composer.render(dt);
  }

  dispose() {
    this.renderer.dispose();
    this.composer.dispose?.();
  }
}
