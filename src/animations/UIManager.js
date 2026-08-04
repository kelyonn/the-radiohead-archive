export class UIManager {
    constructor() {
        this.eraTitle = document.getElementById('era-title');
        this.eraYear = document.getElementById('era-year');
        this.eraDescription = document.getElementById('era-description');
        this.eraTracks = document.getElementById('era-tracks');
        this.albumPoster = document.getElementById('album-poster');
        this.audioBtn = document.getElementById('audio-btn');
        this.terminalLog = document.querySelector('.terminal-log');
    }
    
    animateEraTitle(text) {
        if (!this.eraTitle) return;
        
        // Split text into letters
        const letters = text.split('').map((letter, i) => {
            if (letter === ' ') return ' ';
            return `<span style="display: inline-block; opacity: 0;">${letter}</span>`;
        }).join('');
        
        this.eraTitle.innerHTML = letters;
        const spans = this.eraTitle.querySelectorAll('span');
        
        gsap.fromTo(spans, 
            {
                opacity: 0,
                y: 20,
                rotationX: -90
            },
            {
                opacity: 1,
                y: 0,
                rotationX: 0,
                duration: 0.6,
                stagger: 0.03,
                ease: 'back.out(1.7)'
            }
        );
    }
    
    animateEraYear(text) {
        if (!this.eraYear) return;
        
        gsap.fromTo(this.eraYear,
            { opacity: 0, x: -30 },
            { 
                opacity: 1, 
                x: 0, 
                duration: 0.8,
                ease: 'power3.out'
            }
        );
        
        this.eraYear.textContent = text;
    }
    
    animateEraDescription(text) {
        if (!this.eraDescription) return;
        
        const words = text.split(' ');
        const wordElements = words.map(word => {
            return `<span style="display: inline-block; opacity: 0;">${word}</span>`;
        }).join(' ');
        
        this.eraDescription.innerHTML = wordElements;
        const spans = this.eraDescription.querySelectorAll('span');
        
        gsap.fromTo(spans,
            { opacity: 0, y: 10 },
            {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.05,
                ease: 'power2.out'
            }
        );
    }
    
    animateEraTracks(tracks) {
        if (!this.eraTracks) return;
        
        const trackText = tracks.join(' • ');
        const tracksArray = trackText.split(' • ');
        const trackElements = tracksArray.map(track => {
            return `<span style="display: inline-block; opacity: 0;">${track}</span>`;
        }).join(' • ');
        
        this.eraTracks.innerHTML = trackElements;
        const spans = this.eraTracks.querySelectorAll('span');
        
        gsap.fromTo(spans,
            { opacity: 0, x: -20 },
            {
                opacity: 1,
                x: 0,
                duration: 0.5,
                stagger: 0.08,
                ease: 'power2.out'
            }
        );
    }
    
    animatePoster(src, onComplete) {
        if (!this.albumPoster) return;
        
        const img = new Image();
        
        // Fade out current
        gsap.to(this.albumPoster, {
            opacity: 0,
            scale: 0.8,
            rotationY: -15,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
                img.onload = () => {
                    this.albumPoster.src = src;
                    
                    // Animate in new poster
                    gsap.fromTo(this.albumPoster,
                        {
                            opacity: 0,
                            scale: 1.2,
                            rotationY: 15
                        },
                        {
                            opacity: 0.9,
                            scale: 1,
                            rotationY: 0,
                            duration: 0.6,
                            ease: 'back.out(1.2)',
                            onComplete: onComplete
                        }
                    );
                };
                
                img.onerror = () => {
                    gsap.to(this.albumPoster, {
                        opacity: 0.3,
                        duration: 0.6
                    });
                    if (onComplete) onComplete();
                };
                
                img.src = src;
            }
        });
    }
    
    setupPosterHover() {
        if (!this.albumPoster) return;
        
        const container = this.albumPoster.closest('.album-poster-container');
        if (!container) return;
        
        container.addEventListener('mouseenter', () => {
            gsap.to(this.albumPoster, {
                scale: 1.05,
                rotationY: 5,
                rotationX: -5,
                duration: 0.4,
                ease: 'power2.out'
            });
            
            gsap.to(container, {
                boxShadow: '0 0 50px rgba(0, 255, 65, 0.5)',
                duration: 0.4
            });
        });
        
        container.addEventListener('mouseleave', () => {
            gsap.to(this.albumPoster, {
                scale: 1,
                rotationY: 0,
                rotationX: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
            
            gsap.to(container, {
                boxShadow: '0 0 30px rgba(0, 255, 65, 0.3)',
                duration: 0.4
            });
        });
    }
    
    setupAudioButton() {
        if (!this.audioBtn) return;
        
        this.audioBtn.addEventListener('mouseenter', () => {
            gsap.to(this.audioBtn, {
                scale: 1.05,
                boxShadow: '0 0 30px rgba(0, 255, 65, 0.6)',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        this.audioBtn.addEventListener('mouseleave', () => {
            gsap.to(this.audioBtn, {
                scale: 1,
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.4)',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        this.audioBtn.addEventListener('click', () => {
            gsap.to(this.audioBtn, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            });
        });
    }
    
    typewriterEffect(text, element, speed = 50) {
        if (!element) return;
        
        element.textContent = '';
        let i = 0;
        
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        
        type();
    }
    
    animateTerminalLog(lines) {
        if (!this.terminalLog) return;
        
        this.terminalLog.innerHTML = '';
        
        lines.forEach((line, index) => {
            setTimeout(() => {
                const p = document.createElement('p');
                p.style.opacity = '0';
                p.textContent = line;
                this.terminalLog.appendChild(p);
                
                gsap.to(p, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            }, index * 150);
        });
    }
    
    init() {
        this.setupPosterHover();
        this.setupAudioButton();
    }
}
