import { SceneManager } from './visuals/SceneManager.js';
import { ParticleSystem } from './visuals/ParticleSystem.js';
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
        this.particleSystem = null;
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
        this.particleProgress = 0;
        this.scrollProgress = 0;
        this.init();
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
        this.setupEra(this.currentEra);
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
        
        this.sceneManager = new SceneManager('canvas-container');
        this.updateProgress(30, 'SCENE INITIALIZED');
        await this.delay(50);
        
        this.updateProgress(35, 'SETTING UP CAMERA');
        await this.delay(50);
        
        this.updateProgress(90, 'FINALIZING SCENE');
        await this.delay(100);
        this.updateProgress(95, 'FINALIZING SYSTEM');
        await this.delay(100);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }
    
    setupEra(era) {
        const transitionDuration = 0.8;
        
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
        
        if (this.eraTitle) {
            tl.to(this.eraTitle, {
                opacity: 0,
                duration: transitionDuration * 0.5,
                onComplete: () => {
                    this.eraTitle.textContent = era.title;
                }
            }, 0)
            .to(this.eraTitle, {
                opacity: 1,
                duration: transitionDuration * 0.5
            }, transitionDuration * 0.5);
        }
        
        if (this.eraYear) {
            tl.to(this.eraYear, {
                opacity: 0,
                duration: transitionDuration * 0.5,
                onComplete: () => {
                    this.eraYear.textContent = era.year;
                }
            }, 0)
            .to(this.eraYear, {
                opacity: 1,
                duration: transitionDuration * 0.5
            }, transitionDuration * 0.5);
        }
        
        if (this.eraDescription) {
            tl.to(this.eraDescription, {
                opacity: 0,
                duration: transitionDuration * 0.5,
                onComplete: () => {
                    this.eraDescription.textContent = era.description;
                }
            }, 0)
            .to(this.eraDescription, {
                opacity: 1,
                duration: transitionDuration * 0.5
            }, transitionDuration * 0.5);
        }
        
        if (this.eraTracks) {
            tl.to(this.eraTracks, {
                opacity: 0,
                duration: transitionDuration * 0.5,
                onComplete: () => {
                    this.eraTracks.textContent = era.tracks.join(' • ');
                }
            }, 0)
            .to(this.eraTracks, {
                opacity: 1,
                duration: transitionDuration * 0.5
            }, transitionDuration * 0.5);
        }
        
        if (this.albumPoster && era.poster) {
            const newSrc = era.poster;
            const currentSrc = this.albumPoster.src || '';
            
            if (this.posterLoading) {
                this.posterLoading.classList.remove('hidden');
            }
            
            if (currentSrc && (currentSrc === newSrc || currentSrc.includes(newSrc.split('/').pop()))) {
                if (this.posterLoading) {
                    this.posterLoading.classList.add('hidden');
                }
                tl.to(this.albumPoster, {
                    opacity: 0.9,
                    duration: transitionDuration
                }, 0);
            } else {
                const img = new Image();
                
                tl.to(this.albumPoster, {
                    opacity: 0,
                    duration: transitionDuration * 0.4,
                    ease: 'power2.in'
                }, 0);
                
                img.onload = () => {
                    if (this.posterLoading) {
                        this.posterLoading.classList.add('hidden');
                    }
                    
                    this.albumPoster.src = newSrc;
                    this.albumPoster.alt = `${era.title} Album Cover`;
                    
                    tl.to(this.albumPoster, {
                        opacity: 0.9,
                        duration: transitionDuration * 0.6,
                        ease: 'power2.out'
                    }, transitionDuration * 0.4);
                };
                
                img.onerror = () => {
                    console.error(`Failed to load poster for ${era.title}`);
                    if (this.posterLoading) {
                        this.posterLoading.classList.add('hidden');
                    }
                    tl.to(this.albumPoster, {
                        opacity: 0.3,
                        duration: transitionDuration * 0.6
                    }, transitionDuration * 0.4);
                    this.logToTerminal(`> POSTER_LOAD_FAILED: ${era.title}`);
                };
                
                img.src = newSrc;
            }
        } else if (this.posterLoading) {
            this.posterLoading.classList.add('hidden');
        }
        
        if (this.terminalLog) {
            tl.call(() => {
                this.terminalLog.innerHTML = '';
                era.log.forEach((line, index) => {
                    setTimeout(() => {
                        const p = document.createElement('p');
                        p.textContent = line;
                        this.terminalLog.appendChild(p);
                    }, index * 100);
                });
            }, null, transitionDuration * 0.5);
        }
        
        this.updateScrollIndicator();
    }
    
    updateScrollIndicator() {
        const progress = (this.currentEraIndex / (ERAS.length - 1)) * 100;
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            progressBar.style.setProperty('--progress', `${progress}%`);
            const after = progressBar;
            after.style.height = `${progress}%`;
        }
        
        this.scrollEras.forEach((era, index) => {
            if (index === this.currentEraIndex) {
                era.classList.add('active');
            } else {
                era.classList.remove('active');
            }
        });
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
        // Particles removed
        
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const scrollRatio = scrollY / maxScroll;
        
        this.scrollProgress = scrollRatio * (ERAS.length - 1);
        this.scrollProgress = Math.max(0, Math.min(ERAS.length - 1, this.scrollProgress));
        
        const eraIndex = Math.floor(this.scrollProgress);
        const localProgress = this.scrollProgress - eraIndex;
        const clampedEraIndex = Math.min(eraIndex, ERAS.length - 1);
        
        this.updateScrollProgressBar(scrollRatio);
        
        if (clampedEraIndex !== this.currentEraIndex) {
            this.transitionToEra(clampedEraIndex);
        }
        
        this.updateEraBlend(clampedEraIndex, localProgress);
    }
    
    handleWheel(e) {
        // Particles removed
        
        const delta = e.deltaY;
        this.scrollProgress += delta * 0.0005;
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
        if (eraIndex === this.currentEraIndex) return;
        
        this.currentEraIndex = eraIndex;
        this.currentEra = ERAS[eraIndex];
        
        this.setupEra(this.currentEra);
        this.updateScrollIndicator();
        
        if (this.audioManager && this.audioManager.initialized) {
            this.audioManager.setEra(this.currentEra.id);
        }
        
        let shapeType;
        switch(this.currentEra.id) {
            case 'in_rainbows':
                shapeType = 'nebula';
                break;
            case 'ok_computer':
                shapeType = 'grid';
                break;
            case 'kid_a':
                shapeType = 'terrain';
                break;
        }
        
        // Particles removed
    }
    
    updateEraBlend(eraIndex, localProgress) {
        const threshold = 0.3;
        
        if (localProgress > threshold && eraIndex < ERAS.length - 1) {
            const nextEraIndex = eraIndex + 1;
            const blendAmount = (localProgress - threshold) / (1 - threshold);
            
            if (this.eraTitle) {
                gsap.to(this.eraTitle, {
                    opacity: 1 - blendAmount * 0.5,
                    duration: 0.2,
                    ease: 'power1.out'
                });
            }
        } else if (this.eraTitle) {
            gsap.to(this.eraTitle, {
                opacity: 1,
                duration: 0.2,
                ease: 'power1.out'
            });
        }
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
        
        if (this.sceneManager) {
            this.sceneManager.update();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

const app = new App();
