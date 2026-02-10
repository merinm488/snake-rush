/**
 * Audio System for Snake Rush
 * Uses Web Audio API to generate sounds programmatically
 * Includes BGM and individual sound toggles
 */

const AudioSystem = (function() {
    let audioContext = null;

    // Individual sound settings
    let soundSettings = {
        master: true,
        bgm: true,
        eat: true,
        gameOver: true,
        buttons: true,
        bonus: true
    };

    let bgmVolume = 0.3;
    let bgmOscillators = [];
    let bgmGainNode = null;
    let isBgmPlaying = false;

    // BGM notes for a simple looping bassline
    const BGM_NOTES = [
        { freq: 130.81, duration: 0.4 },  // C3
        { freq: 164.81, duration: 0.4 },  // E3
        { freq: 196.00, duration: 0.4 },  // G3
        { freq: 164.81, duration: 0.4 },  // E3
        { freq: 130.81, duration: 0.4 },  // C3
        { freq: 146.83, duration: 0.4 },  // D3
        { freq: 174.61, duration: 0.4 },  // F3
        { freq: 146.83, duration: 0.4 },  // D3
    ];

    let bgmCurrentNote = 0;
    let bgmInterval = null;

    /**
     * Initialize Audio Context (must be done after user interaction)
     */
    function init() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    /**
     * Load sound settings from localStorage
     */
    function loadSettings() {
        const saved = localStorage.getItem('snakeRushSoundSettings');
        if (saved) {
            soundSettings = { ...soundSettings, ...JSON.parse(saved) };
        }
    }

    /**
     * Save sound settings to localStorage
     */
    function saveSettings() {
        localStorage.setItem('snakeRushSoundSettings', JSON.stringify(soundSettings));
    }

    /**
     * Set individual sound toggle
     */
    function setSound(type, enabled) {
        if (type === 'volume') {
            bgmVolume = enabled;
            updateBgmVolume();
            return;
        }
        if (soundSettings.hasOwnProperty(type)) {
            soundSettings[type] = enabled;
            saveSettings();

            // Handle BGM specifically
            if (type === 'bgm') {
                if (enabled && soundSettings.master) {
                    startBGM();
                } else {
                    stopBGM();
                }
            }
        }
    }

    /**
     * Get all sound settings
     */
    function getSettings() {
        return { ...soundSettings, bgmVolume };
    }

    /**
     * Set all settings at once
     */
    function setAllSettings(settings) {
        soundSettings = { ...soundSettings, ...settings };
        bgmVolume = settings.bgmVolume !== undefined ? settings.bgmVolume : bgmVolume;
        saveSettings();
    }

    /**
     * Check if a sound type is enabled
     */
    function isEnabled(type) {
        return soundSettings.master && soundSettings[type];
    }

    /**
     * Enable/disable all sounds
     */
    function setMasterEnabled(enabled) {
        soundSettings.master = enabled;
        saveSettings();

        if (!enabled) {
            stopBGM();
        } else if (soundSettings.bgm) {
            startBGM();
        }
    }

    /**
     * Create an oscillator with envelope
     */
    function playTone(frequency, duration, type = 'square', volume = 0.1) {
        if (!soundSettings.master) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        // Envelope - attack, decay, sustain, release
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    /**
     * Play a sequence of notes (melody)
     */
    function playMelody(notes, tempo = 150) {
        if (!soundSettings.master) return;

        notes.forEach((note, index) => {
            setTimeout(() => {
                playTone(note.freq, note.duration || 0.1, note.type || 'square', note.volume || 0.1);
            }, index * tempo);
        });
    }

    /**
     * BGM - Background Music
     */
    function startBGM() {
        if (!soundSettings.master || !soundSettings.bgm || isBgmPlaying) return;

        init();
        isBgmPlaying = true;

        // Create gain node for BGM volume control
        bgmGainNode = audioContext.createGain();
        bgmGainNode.gain.setValueAtTime(bgmVolume * 0.05, audioContext.currentTime);
        bgmGainNode.connect(audioContext.destination);

        playNextBgmNote();
    }

    function playNextBgmNote() {
        if (!isBgmPlaying || !soundSettings.bgm) return;

        const note = BGM_NOTES[bgmCurrentNote];

        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();

        oscillator.connect(noteGain);
        noteGain.connect(bgmGainNode);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);

        noteGain.gain.setValueAtTime(0, audioContext.currentTime);
        noteGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.05);
        noteGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.duration * 0.9);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + note.duration);

        bgmCurrentNote = (bgmCurrentNote + 1) % BGM_NOTES.length;

        bgmInterval = setTimeout(playNextBgmNote, note.duration * 1000);
    }

    function stopBGM() {
        isBgmPlaying = false;
        if (bgmInterval) {
            clearTimeout(bgmInterval);
            bgmInterval = null;
        }
    }

    function updateBgmVolume() {
        if (bgmGainNode) {
            bgmGainNode.gain.setValueAtTime(bgmVolume * 0.05, audioContext.currentTime);
        }
    }

    /**
     * Sound: Eat fruit (happy, ascending)
     */
    function playEat() {
        if (!isEnabled('eat')) return;
        init();
        const notes = [
            { freq: 523.25, duration: 0.05, type: 'square', volume: 0.08 },
            { freq: 659.25, duration: 0.05, type: 'square', volume: 0.08 },
            { freq: 783.99, duration: 0.1, type: 'square', volume: 0.08 },
        ];
        playMelody(notes, 60);
    }

    /**
     * Sound: Game Over (sad, descending)
     */
    function playGameOver() {
        if (!isEnabled('gameOver')) return;
        init();
        const notes = [
            { freq: 392, duration: 0.15, type: 'sawtooth', volume: 0.1 },
            { freq: 349.23, duration: 0.15, type: 'sawtooth', volume: 0.1 },
            { freq: 329.63, duration: 0.15, type: 'sawtooth', volume: 0.1 },
            { freq: 293.66, duration: 0.3, type: 'sawtooth', volume: 0.1 },
            { freq: 261.63, duration: 0.5, type: 'sawtooth', volume: 0.1 },
        ];
        playMelody(notes, 120);
    }

    /**
     * Sound: Button click (short blip)
     */
    function playClick() {
        if (!isEnabled('buttons')) return;
        init();
        playTone(800, 0.05, 'sine', 0.05);
    }

    /**
     * Sound: Menu navigation (softer click)
     */
    function playNavigate() {
        if (!isEnabled('buttons')) return;
        init();
        playTone(600, 0.03, 'sine', 0.03);
    }

    /**
     * Sound: Game start (ascending fanfare)
     */
    function playStart() {
        if (!isEnabled('buttons')) return;
        init();
        const notes = [
            { freq: 523.25, duration: 0.1, type: 'square', volume: 0.08 },
            { freq: 659.25, duration: 0.1, type: 'square', volume: 0.08 },
            { freq: 783.99, duration: 0.1, type: 'square', volume: 0.08 },
            { freq: 1046.50, duration: 0.2, type: 'square', volume: 0.1 },
        ];
        playMelody(notes, 80);
    }

    /**
     * Sound: High score achieved (celebration)
     */
    function playHighScore() {
        if (!isEnabled('bonus')) return;
        init();
        const notes = [
            { freq: 523.25, duration: 0.1, type: 'square', volume: 0.08 },
            { freq: 659.25, duration: 0.1, type: 'square', volume: 0.08 },
            { freq: 783.99, duration: 0.1, type: 'square', volume: 0.08 },
            { freq: 1046.50, duration: 0.15, type: 'square', volume: 0.1 },
            { freq: 783.99, duration: 0.1, type: 'square', volume: 0.08 },
            { freq: 1046.50, duration: 0.3, type: 'square', volume: 0.1 },
        ];
        playMelody(notes, 100);
    }

    /**
     * Sound: Pause (short tone)
     */
    function playPause() {
        if (!isEnabled('buttons')) return;
        init();
        playTone(440, 0.1, 'sine', 0.06);
    }

    /**
     * Resume sound (slightly higher pitch)
     */
    function playResume() {
        if (!isEnabled('buttons')) return;
        init();
        playTone(550, 0.1, 'sine', 0.06);
    }

    /**
     * Sound: Golden Fruit (sparkle sound)
     */
    function playGoldenFruit() {
        if (!isEnabled('bonus')) return;
        init();
        const notes = [
            { freq: 1046.50, duration: 0.08, type: 'sine', volume: 0.1 },
            { freq: 1318.51, duration: 0.08, type: 'sine', volume: 0.1 },
            { freq: 1567.98, duration: 0.15, type: 'sine', volume: 0.1 },
            { freq: 2093.00, duration: 0.2, type: 'sine', volume: 0.1 },
        ];
        playMelody(notes, 70);
    }

    /**
     * Sound: Level Complete (triumphant)
     */
    function playLevelComplete() {
        if (!isEnabled('bonus')) return;
        init();
        const notes = [
            { freq: 523.25, duration: 0.15, type: 'square', volume: 0.1 },
            { freq: 659.25, duration: 0.15, type: 'square', volume: 0.1 },
            { freq: 783.99, duration: 0.15, type: 'square', volume: 0.1 },
            { freq: 1046.50, duration: 0.4, type: 'square', volume: 0.12 },
        ];
        playMelody(notes, 100);
    }

    // Load settings on initialization
    loadSettings();

    return {
        init,
        setSound,
        getSettings,
        setAllSettings,
        setMasterEnabled,
        isEnabled,
        playEat,
        playGameOver,
        playClick,
        playNavigate,
        playStart,
        playHighScore,
        playPause,
        playResume,
        playGoldenFruit,
        playLevelComplete,
        startBGM,
        stopBGM
    };
})();
