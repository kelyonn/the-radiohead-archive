import { SceneManager } from './visuals/SceneManager.js';
import { BackgroundSystem } from './visuals/BackgroundSystem.js';
import { UIManager } from './animations/UIManager.js';
import { ScrollManager } from './animations/ScrollManager.js';
import { AudioManager } from './audioManager.js';
import { ERAS } from './data.js';

class App {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingBarFill = document.getElementById('loading-bar-fill');
        this.loadingBarGlow = document.querySelector('.loading-bar-glow');
        this.loadingPercentage = document.getElementById('loading-percentage');
        this.loadingText = document.getElementById('loading-text');
        this.loadingStatus = document.getElementById('loading-status');
        
        this.sceneManager = null;
        this.backgroundSystem = null;
        this.uiManager = new UIManager();
        this.scrollManager = null;
        this.audioManager = new AudioManager();
        
        this.terminalLog = document.querySelector('.terminal-log');
        this.audioBtn = document.getElementById('audio-btn');
        this.eraTitle = document.getElementById('era-title');
        this.eraYear = document.getElementById('era-year');
        this.eraDescription = document.getElementById('era-description');
        this.eraTracks = document.getElementById('era-tracks');
        this.albumPoster = document.getElementById('album-poster');
        this.posterLoading = document.getElementById('poster-loading');
        this.scrollEras = document.querySelectorAll('.scroll-era');
        
        this.currentEra = ERAS[0];
        this.currentEraIndex = 0;
        this.progress = 0;
        this.scrollProgress = 0;
        this.mousePosition = { x: 0, y: 0 };
        this.mouseWorldPosition = new THREE.Vector3(0, 0, 0);
        this.isMobile = this.detectMobile();
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.qualityLevel = this.isMobile ? 'medium' : 'high';
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }
    
    updateProgress(percent, text) {
        this.progress = Math.min(100, Math.max(0, percent));
        
        if (this.loadingBarFill) {
            this.loadingBarFill.style.width = `${this.progress}%`;
        }
        if (this.loadingBarGlow) {
            this.loadingBarGlow.style.width = `${this.progress}%`;
        }
        if (this.loadingPercentage) {
            this.loadingPercentage.textContent = `${Math.floor(this.progress)}%`;
        }
        if (this.loadingText && text) {
            this.loadingText.textContent = text;
        }
    }
    
    async init() {
        this.updateProgress(5, 'WAITING FOR DEPENDENCIES');
        
        if (typeof THREE === 'undefined') {
            this.updateProgress(5, 'ERROR: THREE.JS NOT LOADED');
            console.error('THREE.js is not available');
            return;
        }
        
        this.updateProgress(15, 'THREE.JS LOADED');
        await this.delay(100);
        
        await this.initializeScene();
        await this.preloadPosters();
        this.createAlbumSections();
        this.uiManager.init();
        this.scrollManager = new ScrollManager(this.sceneManager, this.backgroundSystem, this.uiManager);
        this.setupEventListeners();
        
        window.scrollTo(0, 0);
        
        this.updateProgress(100, 'READY');
        await this.delay(500);
        this.hideLoadingScreen();
        this.animate();
    }
    
    async preloadPosters() {
        const posterPromises = ERAS.map(era => {
            return new Promise((resolve) => {
                if (!era.poster) {
                    resolve();
                    return;
                }
                
                const img = new Image();
                let resolved = false;
                
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        console.warn(`Poster preload timeout: ${era.title}`);
                        resolve();
                    }
                }, 10000);
                
                img.onload = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        console.log(`Poster preloaded: ${era.title}`);
                        resolve();
                    }
                };
                
                img.onerror = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        console.warn(`Failed to preload poster: ${era.title}`);
                        resolve();
                    }
                };
                
                img.src = era.poster;
            });
        });
        
        await Promise.all(posterPromises);
    }
    
    async initializeScene() {
        this.updateProgress(20, 'CREATING WEBGL CONTEXT');
        await this.delay(50);
        
        this.sceneManager = new SceneManager('canvas-container', this.isMobile);
        this.updateProgress(30, 'SCENE INITIALIZED');
        await this.delay(50);
        
        this.updateProgress(35, 'SETTING UP CAMERA');
        await this.delay(50);
        
        this.updateProgress(40, 'INITIALIZING BACKGROUND SYSTEM');
        const particleCount = this.isMobile ? 8000 : 12000;
        this.backgroundSystem = new BackgroundSystem(
            this.sceneManager.scene,
            this.sceneManager.camera,
            particleCount
        );
        await this.delay(100);
        
        this.updateProgress(90, 'FINALIZING SCENE');
        await this.delay(100);
        this.updateProgress(95, 'FINALIZING SYSTEM');
        await this.delay(100);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    createAlbumSections() {
        const sectionsContainer = document.querySelector('.album-sections');
        if (!sectionsContainer) return;
        
        // Set body height to accommodate all sections (each section needs scroll space)
        document.body.style.minHeight = `${ERAS.length * 200}vh`;
        
        ERAS.forEach((era, index) => {
            const section = document.createElement('div');
            section.className = 'album-section';
            section.setAttribute('data-era-index', index);
            section.setAttribute('data-era-id', era.id);
            
            section.innerHTML = `
                <div class="album-card">
                    <div class="album-card-header">
                        <div class="album-poster-container">
                            <img class="album-poster" src="${era.poster}" alt="${era.title}">
                            <div class="poster-loading hidden">LOADING...</div>
                        </div>
                        <div class="album-header-info">
                            <h2 class="album-title">${era.title}</h2>
                            <div class="album-year">${era.year}</div>
                        </div>
                    </div>
                    <div class="album-card-body">
                        <div class="album-description">${era.description}</div>
                        <div class="album-tracks">
                            <h3 class="tracks-title">TRACKS</h3>
                            <div class="tracks-list">
                                ${era.tracks.map(track => `<div class="track-item">${track}</div>`).join('')}
                            </div>
                        </div>
                        <div class="album-log">
                            ${era.log.map(log => `<div class="log-line">${log}</div>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            sectionsContainer.appendChild(section);
        });
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }
    
    setupEra(era) {
        // Update scroll indicator
        this.updateScrollIndicator();
    }
    
    updateScrollIndicator() {
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            const scrollY = window.scrollY || window.pageYOffset;
            const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const ratio = scrollY / maxScroll;
            const progress = Math.min(100, Math.max(0, ratio * 100));
            progressBar.style.setProperty('--progress-height', `${progress}%`);
        }
        
        // Update active era in scroll indicator
        if (this.scrollEras) {
            this.scrollEras.forEach((era, index) => {
                if (index === this.currentEraIndex) {
                    era.classList.add('active');
                } else {
                    era.classList.remove('active');
                }
            });
        }
    }
    
    setupEventListeners() {
        if (this.audioBtn) {
            this.audioBtn.addEventListener('click', async () => {
                try {
                    this.audioManager.initialize();
                    await this.audioManager.unlock();
                    
                    if (this.audioManager.audioContext && this.audioManager.audioContext.state === 'running') {
                        this.audioManager.setEra(this.currentEra.id);
                        
                        if (this.audioBtn) {
                            this.audioBtn.style.display = 'none';
                        }
                        
                        this.logToTerminal('> AUDIO_CORE_ENGAGED');
                        this.logToTerminal(`> PLAYING: ${this.currentEra.title}`);
                    } else {
                        this.logToTerminal('> AUDIO_CONTEXT_SUSPENDED');
                        this.logToTerminal('> CLICK_AGAIN_TO_RESUME');
                    }
                } catch (error) {
                    console.error('Audio initialization error:', error);
                    this.logToTerminal('> AUDIO_INIT_FAILED');
                }
            });
        }
        
        this.scrollEras.forEach((era, index) => {
            era.addEventListener('click', () => {
                window.scrollTo({
                    top: (index / (ERAS.length - 1)) * (document.documentElement.scrollHeight - window.innerHeight),
                    behavior: 'smooth'
                });
            });
        });
        
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        window.addEventListener('wheel', (e) => this.handleWheel(e), { passive: true });
    }
    
    
    handleScroll() {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const scrollRatio = scrollY / maxScroll;
        
        this.updateScrollProgressBar(scrollRatio);
        
        // Determine which section we're in based on scroll
        const sectionProgress = scrollRatio * ERAS.length;
        const currentSection = Math.floor(sectionProgress);
        const clampedEraIndex = Math.min(currentSection, ERAS.length - 1);
        
        if (clampedEraIndex !== this.currentEraIndex) {
            this.currentEraIndex = clampedEraIndex;
            this.currentEra = ERAS[clampedEraIndex];
            this.transitionToEra(clampedEraIndex);
        }
        
        // Update background system era color based on scroll
        if (this.backgroundSystem && this.currentEra) {
            this.backgroundSystem.setEraColor(this.currentEra.color);
        }
        
        if (this.sceneManager && this.sceneManager.postProcessor && this.currentEra) {
            this.sceneManager.postProcessor.setEraColor(this.currentEra.color);
        }
    }
    
    handleWheel(e) {
        const delta = e.deltaY;
        const sensitivity = this.isMobile ? 0.0003 : 0.0005;
        this.scrollProgress += delta * sensitivity;
        this.scrollProgress = Math.max(0, Math.min(ERAS.length - 1, this.scrollProgress));
        
        const eraIndex = Math.floor(this.scrollProgress);
        const localProgress = this.scrollProgress - eraIndex;
        const clampedEraIndex = Math.min(eraIndex, ERAS.length - 1);
        
        const scrollRatio = this.scrollProgress / (ERAS.length - 1);
        this.updateScrollProgressBar(scrollRatio);
        
        if (clampedEraIndex !== this.currentEraIndex) {
            this.transitionToEra(clampedEraIndex);
        }
        
        this.updateEraBlend(clampedEraIndex, localProgress);
    }
    
    updateScrollProgressBar(ratio) {
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            const progress = Math.min(100, Math.max(0, ratio * 100));
            progressBar.style.setProperty('--progress-height', `${progress}%`);
        }
    }
    
    transitionToEra(eraIndex) {
        if (eraIndex < 0 || eraIndex >= ERAS.length) return;
        
        this.currentEraIndex = eraIndex;
        this.currentEra = ERAS[eraIndex];
        
        if (this.audioManager && this.audioManager.initialized) {
            this.audioManager.setEra(this.currentEra.id);
        }
        
        if (this.backgroundSystem) {
            this.backgroundSystem.morphToEra(this.currentEra.id);
            this.backgroundSystem.setEraColor(this.currentEra.color);
        }
        
        if (this.sceneManager && this.sceneManager.postProcessor) {
            this.sceneManager.postProcessor.setEraColor(this.currentEra.color);
        }
        
        this.updateScrollIndicator();
    }
    
    updateEraBlend(eraIndex, localProgress) {
        // Era blending handled by ScrollTrigger in ScrollManager
    }
    
    logToTerminal(message) {
        if (this.terminalLog) {
            const p = document.createElement('p');
            p.textContent = message;
            this.terminalLog.appendChild(p);
        }
    }
    
    animate() {
        const time = performance.now();
        
        this.frameCount++;
        if (time - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = time;
            this.adjustQuality();
        }
        
        if (this.sceneManager) {
            if (this.backgroundSystem) {
                if (this.audioManager && this.audioManager.initialized) {
                    const audioLevel = this.audioManager.getAudioLevel();
                    this.backgroundSystem.setAudioLevel(audioLevel);
                }
                this.backgroundSystem.update(time);
            }
            this.sceneManager.update();
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    adjustQuality() {
        if (this.fps < 30 && this.qualityLevel !== 'low') {
            this.qualityLevel = 'low';
            if (this.sceneManager && this.sceneManager.postProcessor) {
                if (this.sceneManager.postProcessor.bloomPass) {
                    this.sceneManager.postProcessor.bloomPass.strength = 0.5;
                }
            }
            // Reduce particle count for low quality
            if (this.backgroundSystem && this.backgroundSystem.particles) {
                this.backgroundSystem.particles.visible = false;
            }
        } else if (this.fps < 45 && this.qualityLevel === 'high') {
            this.qualityLevel = 'medium';
            if (this.sceneManager && this.sceneManager.postProcessor) {
                if (this.sceneManager.postProcessor.bloomPass) {
                    this.sceneManager.postProcessor.bloomPass.strength = 1.5;
                }
            }
            if (this.backgroundSystem && this.backgroundSystem.particles) {
                this.backgroundSystem.particles.visible = true;
            }
        } else if (this.fps >= 55 && this.qualityLevel !== 'high' && !this.isMobile) {
            this.qualityLevel = 'high';
            if (this.sceneManager && this.sceneManager.postProcessor) {
                if (this.sceneManager.postProcessor.bloomPass) {
                    this.sceneManager.postProcessor.bloomPass.strength = 2.5;
                }
            }
            if (this.backgroundSystem && this.backgroundSystem.particles) {
                this.backgroundSystem.particles.visible = true;
            }
        }
    }
}

const app = new App();
