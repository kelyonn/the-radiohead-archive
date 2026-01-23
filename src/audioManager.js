export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = [];
        this.noiseNodes = [];
        this.initialized = false;
        this.currentEra = null;
    }
    
    initialize() {
        if (this.initialized) {
            return this.audioContext;
        }
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.05;
            this.masterGain.connect(this.audioContext.destination);
            
            this.initialized = true;
            return this.audioContext;
        } catch (error) {
            console.error('Audio initialization failed:', error);
            return null;
        }
    }
    
    async unlock() {
        if (this.audioContext) {
            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    console.log('Audio context resumed');
                    return true;
                } catch (err) {
                    console.error('Failed to resume audio context:', err);
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    
    ensureInitialized() {
        if (!this.initialized) {
            this.initialize();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.unlock();
        }
    }
    
    setEra(eraId) {
        this.ensureInitialized();
        
        if (!this.initialized) {
            console.warn('Audio not initialized, cannot set era');
            return;
        }
        
        if (this.currentEra === eraId) return;
        
        this.stopAll();
        this.currentEra = eraId;
        
        try {
            switch(eraId) {
                case 'in_rainbows':
                    this.playInRainbows();
                    break;
                case 'ok_computer':
                    this.playOkComputer();
                    break;
                case 'kid_a':
                    this.playKidA();
                    break;
            }
            console.log(`Audio set to era: ${eraId}`);
        } catch (error) {
            console.error('Error setting era audio:', error);
        }
    }
    
    stopAll() {
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {}
        });
        this.noiseNodes.forEach(node => {
            try {
                node.disconnect();
            } catch (e) {}
        });
        this.oscillators = [];
        this.noiseNodes = [];
    }
    
    playInRainbows() {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.value = 220;
        gain1.gain.value = 0.02;
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start();
        
        osc2.type = 'triangle';
        osc2.frequency.value = 330;
        gain2.gain.value = 0.015;
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start();
        
        this.oscillators.push(osc1, osc2);
    }
    
    playOkComputer() {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        
        osc1.type = 'square';
        osc1.frequency.value = 100;
        gain1.gain.value = 0.02;
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start();
        
        osc2.type = 'sawtooth';
        osc2.frequency.value = 200;
        gain2.gain.value = 0.015;
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start();
        
        this.oscillators.push(osc1, osc2);
    }
    
    playKidA() {
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.value = 60;
        gain1.gain.value = 0.025;
        
        lfo.type = 'sine';
        lfo.frequency.value = 0.5;
        lfoGain.gain.value = 10;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        
        osc1.start();
        lfo.start();
        
        this.oscillators.push(osc1, lfo);
    }
}
