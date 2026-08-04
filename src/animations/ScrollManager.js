export class ScrollManager {
    constructor(sceneManager, backgroundSystem, uiManager) {
        this.sceneManager = sceneManager;
        this.backgroundSystem = backgroundSystem;
        this.uiManager = uiManager;
        
        this.scrollY = 0;
        this.lastScrollY = 0;
        this.parallaxElements = [];
        
        this.init();
    }
    
    init() {
        // Wait for GSAP and ScrollTrigger to be available
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Register ScrollTrigger plugin
        if (gsap.registerPlugin) {
            gsap.registerPlugin(ScrollTrigger);
        }
        
        this.setupParallax();
        this.setupScrollAnimations();
    }
    
    setupParallax() {
        const albumSections = document.querySelectorAll('.album-section');
        const totalSections = albumSections.length;
        const scrollHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        
        // Each section gets equal scroll space
        const sectionScrollHeight = scrollHeight / totalSections;
        
        albumSections.forEach((section, index) => {
            const eraIndex = parseInt(section.getAttribute('data-era-index'));
            
            ScrollTrigger.create({
                start: () => `top+=${eraIndex * sectionScrollHeight} top`,
                end: () => `top+=${(eraIndex + 1) * sectionScrollHeight} top`,
                scrub: 1,
                onUpdate: (self) => {
                    const progress = self.progress;
                    
                    // Z: from -1000px (far) to 0px (camera) - coming directly towards you
                    const z = -1000 + (progress * 1000);
                    
                    // Scale: from 0.15x (tiny, far) to 1x (full size, close)
                    const scale = 0.15 + (progress * 0.85);
                    
                    // Opacity: fade in smoothly
                    const opacity = Math.min(1, progress * 2);
                    
                    // Apply directly via CSS transform
                    section.style.transform = `translate3d(0, 0, ${z}px) scale(${scale})`;
                    section.style.opacity = opacity;
                    
                    // Update active indicator when section is in focus
                    if (progress > 0.4 && progress < 0.6) {
                        const scrollEras = document.querySelectorAll('.scroll-era');
                        scrollEras.forEach((era, i) => {
                            era.classList.toggle('active', i === eraIndex);
                        });
                    }
                }
            });
        });
        
        // Background particles move forward
        if (this.backgroundSystem) {
            ScrollTrigger.create({
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1,
                onUpdate: (self) => {
                    const progress = self.progress;
                    
                    if (this.backgroundSystem.particles) {
                        this.backgroundSystem.particles.position.z = -50 + (progress * 100);
                        const scale = 0.5 + (progress * 1.5);
                        this.backgroundSystem.particles.scale.set(scale, scale, scale);
                    }
                    
                    if (this.backgroundSystem.backgroundPlane) {
                        this.backgroundSystem.backgroundPlane.position.z = -200 + (progress * 250);
                        const planeScale = 0.3 + (progress * 2.2);
                        this.backgroundSystem.backgroundPlane.scale.set(planeScale, planeScale, planeScale);
                    }
                }
            });
        }
        
        // Camera stays fixed
        if (this.sceneManager && this.sceneManager.camera) {
            this.sceneManager.camera.position.z = 50;
        }
    }
    
    setupScrollAnimations() {
        // Scroll progress bar animation
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            ScrollTrigger.create({
                start: 'top top',
                end: 'bottom bottom',
                onUpdate: (self) => {
                    const progress = self.progress;
                    progressBar.style.setProperty('--progress-height', `${progress * 100}%`);
                }
            });
        }
    }
    
    update() {
        this.scrollY = window.scrollY || window.pageYOffset;
        
        // Update parallax elements
        this.parallaxElements.forEach(element => {
            if (element.update) {
                element.update(this.scrollY);
            }
        });
        
        this.lastScrollY = this.scrollY;
    }
}
