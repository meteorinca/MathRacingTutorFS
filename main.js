/* ============================================
   MATH RACING TUTOR - Game Logic
   Handles HUD updates, timers, math problems, and game state
   ============================================ */

// ============= Sound System =============
const SoundManager = {
    sounds: {},
    audioFiles: {}, // Cache for loaded audio files
    musicPlaying: false,
    enabled: true,
    audioBasePath: 'dist/assets/audio/',

    // Map of sound names to file names
    fileMap: {
        click: 'click.mp3',
        correct: 'correct.mp3',
        wrong: 'wrong.mp3',
        boost: 'boost.mp3',
        countdown: 'countdown.mp3',
        countdownGo: 'countdown_go.mp3',
        lap: 'lap.mp3',
        win: 'win.mp3',
        lose: 'lose.mp3',
        musicMenu: 'music_menu.mp3',
        musicRace: 'music_race.mp3',
        musicVictory: 'music_victory.mp3'
    },

    // Initialize all sounds
    init() {
        this.audioContext = null;

        // Define fallback synthesized sounds
        this.soundDefs = {
            click: { freq: 800, duration: 0.1, type: 'square' },
            correct: { freq: [400, 600, 800], duration: 0.15, type: 'sine' },
            wrong: { freq: [400, 200], duration: 0.2, type: 'sawtooth' },
            boost: { freq: [200, 800, 1200], duration: 0.3, type: 'sawtooth' },
            countdown: { freq: 440, duration: 0.2, type: 'square' },
            countdownGo: { freq: 880, duration: 0.4, type: 'square' },
            lap: { freq: [523, 659, 784], duration: 0.2, type: 'sine' },
            win: { freq: [523, 659, 784, 1047], duration: 0.25, type: 'sine' },
            lose: { freq: [400, 300, 200], duration: 0.3, type: 'sawtooth' }
        };

        // Preload audio files (non-blocking)
        this.preloadAudioFiles();

        console.log('🔊 Sound system initialized');
    },

    // Preload audio files if they exist
    async preloadAudioFiles() {
        for (const [name, file] of Object.entries(this.fileMap)) {
            try {
                const audio = new Audio();
                audio.src = this.audioBasePath + file;

                // Check if file loads successfully
                await new Promise((resolve, reject) => {
                    audio.oncanplaythrough = () => {
                        this.audioFiles[name] = audio;
                        console.log(`✅ Loaded audio: ${file}`);
                        resolve();
                    };
                    audio.onerror = () => {
                        // File doesn't exist, will use synthesized fallback
                        resolve();
                    };
                    // Timeout after 2 seconds
                    setTimeout(resolve, 2000);
                });
            } catch (e) {
                // Silently fail, will use synthesized sound
            }
        }
    },

    // Get or create audio context
    getContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    },

    // Play a sound (file if available, otherwise synthesized)
    play(soundName) {
        if (!this.enabled) return;

        // Try to play audio file first
        if (this.audioFiles[soundName]) {
            try {
                const audio = this.audioFiles[soundName].cloneNode();
                audio.volume = 0.5;
                audio.play().catch(() => { });
                return;
            } catch (e) {
                // Fall back to synthesized
            }
        }

        // Fall back to synthesized sound
        this.playSynthesized(soundName);
    },

    // Play synthesized sound
    playSynthesized(soundName) {
        const def = this.soundDefs[soundName];
        if (!def) return;

        try {
            const ctx = this.getContext();
            const freqs = Array.isArray(def.freq) ? def.freq : [def.freq];

            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = def.type;
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * def.duration);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * def.duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + i * def.duration);
                osc.stop(ctx.currentTime + (i + 1) * def.duration);
            });
        } catch (e) {
            console.log('Sound play error:', e);
        }
    },

    // Play background music
    playMusic(trackName) {
        if (!this.enabled) return;

        // Stop current music
        this.stopMusic();

        if (this.audioFiles[trackName]) {
            try {
                this.currentMusic = this.audioFiles[trackName].cloneNode();
                this.currentMusic.loop = true;
                this.currentMusic.volume = 0.3;
                this.currentMusic.play().catch(() => { });
                this.musicPlaying = true;
            } catch (e) { }
        }
    },

    // Stop music
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic = null;
            this.musicPlaying = false;
        }
    },

    // Start background engine hum
    startEngineSound() {
        if (!this.enabled || this.engineOsc) return;

        try {
            const ctx = this.getContext();
            this.engineOsc = ctx.createOscillator();
            this.engineGain = ctx.createGain();

            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.value = 80;
            this.engineGain.gain.value = 0.05;

            this.engineOsc.connect(this.engineGain);
            this.engineGain.connect(ctx.destination);
            this.engineOsc.start();
        } catch (e) {
            console.log('Engine sound error:', e);
        }
    },

    // Update engine pitch based on speed
    updateEnginePitch(speed) {
        if (this.engineOsc && this.enabled) {
            const pitch = 80 + (speed * 0.5);
            this.engineOsc.frequency.value = Math.min(pitch, 200);
        }
    },

    // Stop engine sound
    stopEngineSound() {
        if (this.engineOsc) {
            try {
                this.engineOsc.stop();
                this.engineOsc = null;
                this.engineGain = null;
            } catch (e) { }
        }
    },

    // Toggle sound
    toggle(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopEngineSound();
            this.stopMusic();
        }
    }
};

// ============= Game State =============
const gameState = {
    position: 1,
    totalRacers: 4,
    currentLap: 1,
    totalLaps: 3,
    speed: 156,
    maxSpeed: 200,
    problemsSolved: 0,
    problemsThisLap: 0,
    boostReady: false,
    boostCharge: 0,
    raceStarted: false,
    raceInMotion: false,
    gamePaused: false,
    raceTime: 0,
    displaySpeed: 0,
    targetSpeed: 0,
    bestLap: null,
    startTime: null,

    // Car race state - each enemy has personality
    cars: {
        player: { x: 50, speed: 0, baseSpeed: 2.0, lane: 2, turboActive: false },
        // Steady Eddie - consistent, slightly slow
        enemy1: { x: 50, speed: 0, baseSpeed: 2.1, lane: 1, personality: 'steady', variance: 0.05 },
        // Speed Demon - fast but erratic
        enemy2: { x: 50, speed: 0, baseSpeed: 2.3, lane: 3, personality: 'aggressive', variance: 0.3 },
        // Turtle - slow starter but speeds up over time
        enemy3: { x: 50, speed: 0, baseSpeed: 1.9, lane: 4, personality: 'crescendo', variance: 0.1 }
    },
    trackLength: 3000,
    lapDistance: 0, // How far constitutes a lap
    cameraOffset: 0,
    raceAnimationId: null,

    // Math problem state
    mathSettings: {
        minMultiplier: 3,
        maxMultiplier: 12,
        problemInterval: 8,
        answerTime: 8, // Changed default to 8 seconds
        numLaps: 3,
        soundEnabled: true
    },
    currentProblem: null,
    mathTimerId: null,
    problemTimerId: null,
    nextProblemTime: null
};

// ============= DOM Elements =============
let elements = {};

// ============= Initialization =============
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function initializeGame() {
    // Initialize sound system
    SoundManager.init();

    // Cache DOM elements
    cacheElements();

    // Load saved settings
    loadSettings();

    // Setup event listeners
    setupEventListeners();

    // Setup math modal listeners
    setupMathModalListeners();

    // Setup settings panel
    setupSettingsPanel();

    // Hide loading overlay
    setTimeout(() => {
        const loading = document.querySelector('.loading-overlay');
        if (loading) loading.classList.add('hidden');
    }, 500);

    // Initialize race (cars at starting positions, not moving yet)
    initializeRace();

    // Reset HUD to initial state
    updateProblems(0);
    updateBoost(false, 0);
    updateLap(1, gameState.mathSettings.numLaps);
}

function cacheElements() {
    elements = {
        // Position
        positionNumber: document.getElementById('position-number'),
        positionSuffix: document.getElementById('position-suffix'),

        // Timer
        timerMinutes: document.getElementById('timer-minutes'),
        timerSeconds: document.getElementById('timer-seconds'),
        timerMs: document.getElementById('timer-ms'),
        bestLap: document.getElementById('best-lap-time'),

        // Speed
        speedValue: document.getElementById('speed-value'),
        speedBar: document.getElementById('speed-bar'),

        // Problems
        problemsValue: document.getElementById('problems-value'),

        // Lap
        lapCurrent: document.getElementById('lap-current'),
        lapTotal: document.getElementById('lap-total'),

        // Boost
        boostIcon: document.getElementById('boost-icon'),
        boostStatus: document.getElementById('boost-status'),
        boostCharge: document.getElementById('boost-charge'),

        // Cars & Track
        carWrapper: document.getElementById('car-wrapper'),
        playerCar: document.getElementById('player-car'),
        enemyCar1: document.getElementById('enemy-car-1'),
        enemyCar2: document.getElementById('enemy-car-2'),
        enemyCar3: document.getElementById('enemy-car-3'),
        trackImage: document.getElementById('track-image'),
        startRaceBtn: document.getElementById('start-race-btn'),
        centerMessage: document.getElementById('center-message'),
        finishLine: document.getElementById('finish-line'),

        // Math modal elements (new slot-based structure)
        mathModalOverlay: document.getElementById('math-modal-overlay'),
        mathSlot1: document.getElementById('math-slot-1'),
        mathSlot2: document.getElementById('math-slot-2'),
        mathSlot3: document.getElementById('math-slot-3'),
        mathAnswerInput: document.getElementById('math-answer-input'),
        mathTimerBar: document.getElementById('math-timer-bar'),
        mathTimerText: document.getElementById('math-timer-text'),
        mathFeedback: document.getElementById('math-feedback'),

        // Settings
        settingsToggle: document.getElementById('settings-toggle'),
        settingsPanel: document.getElementById('settings-panel'),
        multMin: document.getElementById('mult-min'),
        multMax: document.getElementById('mult-max'),
        problemInterval: document.getElementById('problem-interval'),
        answerTime: document.getElementById('answer-time'),
        numLaps: document.getElementById('num-laps'),
        soundEnabled: document.getElementById('sound-enabled'),
        settingsSave: document.getElementById('settings-save')
    };
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);

    // Touch controls for mobile
    document.addEventListener('touchstart', handleTouch);

    // Window resize handling
    window.addEventListener('resize', handleResize);

    // START RACE button
    if (elements.startRaceBtn) {
        elements.startRaceBtn.addEventListener('click', () => {
            SoundManager.play('click');
            startRace();
        });
        elements.startRaceBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            SoundManager.play('click');
            startRace();
        });
    }
}

function setupMathModalListeners() {
    if (elements.mathAnswerInput) {
        // Listen for input changes to check answer
        elements.mathAnswerInput.addEventListener('input', checkMathAnswer);

        // Listen for Enter key
        elements.mathAnswerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkMathAnswer();
            }
        });
    }
}

function setupSettingsPanel() {
    // Toggle settings panel
    if (elements.settingsToggle) {
        elements.settingsToggle.addEventListener('click', () => {
            SoundManager.play('click');
            elements.settingsPanel.classList.toggle('active');
        });
    }

    // Save settings
    if (elements.settingsSave) {
        elements.settingsSave.addEventListener('click', () => {
            SoundManager.play('click');
            saveSettings();
        });
    }

    // Keyboard shortcut to toggle settings (S key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 's' || e.key === 'S') {
            if (!elements.mathModalOverlay?.classList.contains('active')) {
                elements.settingsPanel?.classList.toggle('active');
            }
        }
    });
}

function loadSettings() {
    const saved = localStorage.getItem('mathRacerSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            gameState.mathSettings = { ...gameState.mathSettings, ...settings };
        } catch (e) {
            console.log('Could not load settings:', e);
        }
    }

    // Update UI with loaded/default values
    if (elements.multMin) elements.multMin.value = gameState.mathSettings.minMultiplier;
    if (elements.multMax) elements.multMax.value = gameState.mathSettings.maxMultiplier;
    if (elements.problemInterval) elements.problemInterval.value = gameState.mathSettings.problemInterval;
    if (elements.answerTime) elements.answerTime.value = gameState.mathSettings.answerTime;
    if (elements.numLaps) elements.numLaps.value = gameState.mathSettings.numLaps;
    if (elements.soundEnabled) elements.soundEnabled.checked = gameState.mathSettings.soundEnabled;

    // Apply sound setting
    SoundManager.toggle(gameState.mathSettings.soundEnabled);

    // Update total laps
    gameState.totalLaps = gameState.mathSettings.numLaps;
}

function saveSettings() {
    const minVal = parseInt(elements.multMin?.value) || 3;
    const maxVal = parseInt(elements.multMax?.value) || 12;
    const interval = parseInt(elements.problemInterval?.value) || 8;
    const answerTime = parseInt(elements.answerTime?.value) || 8;
    const numLaps = parseInt(elements.numLaps?.value) || 3;
    const soundEnabled = elements.soundEnabled?.checked ?? true;

    gameState.mathSettings.minMultiplier = Math.max(1, Math.min(12, minVal));
    gameState.mathSettings.maxMultiplier = Math.max(gameState.mathSettings.minMultiplier, Math.min(12, maxVal));
    gameState.mathSettings.problemInterval = Math.max(3, Math.min(30, interval));
    gameState.mathSettings.answerTime = Math.max(3, Math.min(15, answerTime));
    gameState.mathSettings.numLaps = Math.max(1, Math.min(10, numLaps));
    gameState.mathSettings.soundEnabled = soundEnabled;

    // Save to localStorage
    localStorage.setItem('mathRacerSettings', JSON.stringify(gameState.mathSettings));

    // Apply settings
    gameState.totalLaps = gameState.mathSettings.numLaps;
    SoundManager.toggle(soundEnabled);
    updateLap(gameState.currentLap, gameState.totalLaps);

    // Update UI values
    if (elements.multMin) elements.multMin.value = gameState.mathSettings.minMultiplier;
    if (elements.multMax) elements.multMax.value = gameState.mathSettings.maxMultiplier;
    if (elements.problemInterval) elements.problemInterval.value = gameState.mathSettings.problemInterval;
    if (elements.answerTime) elements.answerTime.value = gameState.mathSettings.answerTime;
    if (elements.numLaps) elements.numLaps.value = gameState.mathSettings.numLaps;

    // Close panel
    elements.settingsPanel?.classList.remove('active');

    console.log('✅ Settings saved:', gameState.mathSettings);
}

// ============= Timer Updates =============
let timerIntervalId = null;

function startRaceTimer() {
    gameState.startTime = Date.now();

    // Clear any existing timer
    if (timerIntervalId) clearInterval(timerIntervalId);

    // Update timer every 10ms for smooth display
    timerIntervalId = setInterval(updateTimer, 10);
}

function updateTimer() {
    if (!gameState.startTime || gameState.gamePaused) return;

    const elapsed = Date.now() - gameState.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const ms = Math.floor((elapsed % 1000) / 10);

    if (elements.timerMinutes) {
        elements.timerMinutes.textContent = minutes.toString().padStart(2, '0');
    }
    if (elements.timerSeconds) {
        elements.timerSeconds.textContent = seconds.toString().padStart(2, '0');
    }
    if (elements.timerMs) {
        elements.timerMs.textContent = ms.toString().padStart(2, '0');
    }
}

function updatePosition(newPosition) {
    gameState.position = newPosition;

    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    const suffix = suffixes[newPosition - 1] || 'th';

    if (elements.positionNumber) {
        elements.positionNumber.textContent = newPosition;
        elements.positionNumber.classList.add('position-animate');
        setTimeout(() => {
            elements.positionNumber.classList.remove('position-animate');
        }, 500);
    }

    if (elements.positionSuffix) {
        elements.positionSuffix.textContent = suffix;
    }
}

function updateSpeed(speed) {
    gameState.targetSpeed = Math.min(speed, gameState.maxSpeed);
}

// Smoothly interpolate displayed speed towards target
function smoothSpeedUpdate() {
    const smoothFactor = 0.08;
    gameState.displaySpeed += (gameState.targetSpeed - gameState.displaySpeed) * smoothFactor;

    const displayValue = Math.round(gameState.displaySpeed);
    const percentage = (gameState.displaySpeed / gameState.maxSpeed) * 100;

    if (elements.speedValue) {
        elements.speedValue.textContent = displayValue;
    }

    if (elements.speedBar) {
        elements.speedBar.style.width = percentage + '%';
    }

    // Update engine sound pitch
    SoundManager.updateEnginePitch(displayValue);
}

function updateProblems(count) {
    gameState.problemsSolved = count;

    if (elements.problemsValue) {
        elements.problemsValue.textContent = count;
    }
}

function updateLap(current, total) {
    gameState.currentLap = current;
    gameState.totalLaps = total;

    if (elements.lapCurrent) {
        elements.lapCurrent.textContent = current;
    }

    if (elements.lapTotal) {
        elements.lapTotal.textContent = total;
    }
}

function updateBoost(ready, charge) {
    gameState.boostReady = ready;
    gameState.boostCharge = charge;

    if (elements.boostIcon) {
        elements.boostIcon.style.animationPlayState = ready ? 'running' : 'paused';
    }

    if (elements.boostStatus) {
        elements.boostStatus.textContent = ready ? 'READY!' : 'CHARGING';
        elements.boostStatus.classList.toggle('not-ready', !ready);
    }

    if (elements.boostCharge) {
        elements.boostCharge.style.width = charge + '%';
    }
}

// ============= Event Handlers =============
function handleKeyDown(e) {
    // If math modal is open, let the input handle keypresses
    if (elements.mathModalOverlay?.classList.contains('active')) {
        return;
    }

    switch (e.code) {
        case 'Space':
        case 'Enter':
            if (!gameState.raceInMotion) {
                SoundManager.play('click');
                startRace();
            } else if (gameState.boostReady) {
                activateTurboBoost();
            }
            e.preventDefault();
            break;
        case 'Escape':
            elements.settingsPanel?.classList.remove('active');
            break;
    }
}

function handleTouch(e) {
    // Initialize audio context on first touch (required for iOS)
    SoundManager.getContext();
}

function handleResize() {
    console.log('Viewport resized:', window.innerWidth, 'x', window.innerHeight);
}

// ============= Math Problem System =============
function generateMathProblem() {
    const { minMultiplier, maxMultiplier } = gameState.mathSettings;

    const num1 = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
    const num2 = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
    const answer = num1 * num2;

    // 70% standard, 30% reverse (missing operand)
    const problemType = Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 1 : 2);

    let problem = {
        num1: num1,
        num2: num2,
        answer: answer,
        type: problemType,
        userAnswer: null
    };

    switch (problemType) {
        case 0: // 9 × 12 = ___
            problem.blankValue = answer;
            problem.display = { op1: num1, op2: num2, blankPosition: 'answer' };
            break;
        case 1: // ___ × 12 = 108
            problem.blankValue = num1;
            problem.display = { op1: '?', op2: num2, blankPosition: 'op1', showAnswer: answer };
            break;
        case 2: // 9 × ___ = 108
            problem.blankValue = num2;
            problem.display = { op1: num1, op2: '?', blankPosition: 'op2', showAnswer: answer };
            break;
    }

    return problem;
}

function showMathProblem() {
    if (!gameState.raceInMotion) return;

    gameState.currentProblem = generateMathProblem();
    const problem = gameState.currentProblem;

    // Reset all slots to default state
    elements.mathSlot1.classList.remove('blank', 'answer');
    elements.mathSlot2.classList.remove('blank', 'answer');
    elements.mathSlot3.classList.remove('blank', 'answer');

    // Update display based on problem type
    // Type 0: num1 × num2 = [blank] → user types answer
    // Type 1: [blank] × num2 = answer → user types first operand
    // Type 2: num1 × [blank] = answer → user types second operand

    if (problem.type === 0) {
        // Standard: 9 × 12 = ?
        elements.mathSlot1.textContent = problem.num1;
        elements.mathSlot2.textContent = problem.num2;
        elements.mathSlot3.textContent = '?';
        elements.mathSlot3.classList.add('blank');
    } else if (problem.type === 1) {
        // Missing first operand: ? × 12 = 108
        elements.mathSlot1.textContent = '?';
        elements.mathSlot1.classList.add('blank');
        elements.mathSlot2.textContent = problem.num2;
        elements.mathSlot3.textContent = problem.answer;
        elements.mathSlot3.classList.add('answer');
    } else {
        // Missing second operand: 9 × ? = 108
        elements.mathSlot1.textContent = problem.num1;
        elements.mathSlot2.textContent = '?';
        elements.mathSlot2.classList.add('blank');
        elements.mathSlot3.textContent = problem.answer;
        elements.mathSlot3.classList.add('answer');
    }

    // Clear input and feedback
    elements.mathAnswerInput.value = '';
    elements.mathAnswerInput.classList.remove('correct', 'incorrect');
    elements.mathFeedback.textContent = '';
    elements.mathFeedback.className = 'math-feedback';

    // Reset timer bar with configurable time
    elements.mathTimerBar.style.transform = 'scaleX(1)';
    elements.mathTimerText.textContent = `${gameState.mathSettings.answerTime}.0s`;
    elements.mathTimerText.classList.remove('urgent');

    // Show modal
    elements.mathModalOverlay.classList.add('active');

    // Pause the game
    gameState.gamePaused = true;

    // Focus input
    setTimeout(() => {
        elements.mathAnswerInput.focus();
    }, 100);

    // Start countdown timer
    startMathTimer();
}

function startMathTimer() {
    const totalTime = gameState.mathSettings.answerTime * 1000;
    const startTime = Date.now();

    if (gameState.mathTimerId) {
        clearInterval(gameState.mathTimerId);
    }

    gameState.mathTimerId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalTime - elapsed);
        const fraction = remaining / totalTime;

        elements.mathTimerBar.style.transform = `scaleX(${fraction})`;

        const secondsLeft = (remaining / 1000).toFixed(1);
        elements.mathTimerText.textContent = `${secondsLeft}s`;

        if (remaining < 2000) {
            elements.mathTimerText.classList.add('urgent');
        }

        if (remaining <= 0) {
            clearInterval(gameState.mathTimerId);
            handleTimeUp();
        }
    }, 50);
}

function checkMathAnswer() {
    if (!gameState.currentProblem) return;

    const userAnswer = parseInt(elements.mathAnswerInput.value);
    if (isNaN(userAnswer)) return;

    const correctAnswer = gameState.currentProblem.blankValue;

    if (userAnswer === correctAnswer) {
        clearInterval(gameState.mathTimerId);
        SoundManager.play('correct');
        handleCorrectAnswer();
    } else if (elements.mathAnswerInput.value.length >= correctAnswer.toString().length) {
        SoundManager.play('wrong');
        elements.mathAnswerInput.classList.add('incorrect');
        setTimeout(() => {
            elements.mathAnswerInput.classList.remove('incorrect');
        }, 400);
    }
}

function handleCorrectAnswer() {
    elements.mathAnswerInput.classList.add('correct');
    elements.mathFeedback.textContent = '🎉 BOOST EARNED!';
    elements.mathFeedback.className = 'math-feedback success';

    updateProblems(gameState.problemsSolved + 1);
    gameState.problemsThisLap++;

    setTimeout(() => {
        hideMathModal();
        activateTurboBoost();
    }, 600);
}

function handleTimeUp() {
    SoundManager.play('wrong');
    elements.mathFeedback.textContent = '⏰ Time\'s up!';
    elements.mathFeedback.className = 'math-feedback fail';
    elements.mathAnswerInput.classList.add('incorrect');

    setTimeout(() => {
        elements.mathFeedback.textContent = `Answer: ${gameState.currentProblem.blankValue}`;
    }, 500);

    setTimeout(() => {
        hideMathModal();
        scheduleNextProblem();
    }, 1500);
}

function hideMathModal() {
    elements.mathModalOverlay.classList.remove('active');
    gameState.gamePaused = false;
    gameState.currentProblem = null;
}

function scheduleNextProblem() {
    if (gameState.problemTimerId) {
        clearTimeout(gameState.problemTimerId);
    }

    const delay = gameState.mathSettings.problemInterval * 1000;
    gameState.problemTimerId = setTimeout(() => {
        if (gameState.raceInMotion && !gameState.gamePaused) {
            showMathProblem();
        }
    }, delay);
}

// ============= Turbo Boost System =============
function activateTurboBoost() {
    if (gameState.cars.player.turboActive) return;

    console.log('🚀 TURBO BOOST ACTIVATED!');
    SoundManager.play('boost');

    gameState.cars.player.turboActive = true;
    const originalBaseSpeed = gameState.cars.player.baseSpeed;

    // Switch to turbo car image
    const playerCarImg = elements.playerCar?.querySelector('img');
    if (playerCarImg) {
        playerCarImg.src = 'dist/assets/racing/player_turbocar.png';
    }

    elements.playerCar?.classList.add('turbo-active');
    showBoostPopup();

    // 2.5x speed boost
    gameState.cars.player.baseSpeed = originalBaseSpeed * 2.5;
    updateBoost(false, 0);

    // Turbo duration: 3 seconds
    setTimeout(() => {
        gameState.cars.player.turboActive = false;
        gameState.cars.player.baseSpeed = originalBaseSpeed;

        if (playerCarImg) {
            playerCarImg.src = 'dist/assets/racing/player_car.png';
        }

        elements.playerCar?.classList.remove('turbo-active');
        scheduleNextProblem();
    }, 3000);
}

function showBoostPopup() {
    const popup = document.createElement('div');
    popup.className = 'boost-success-overlay';
    popup.textContent = '⚡ BOOST!';
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 1000);
}

// ============= Race Result System =============
function showRaceResult(won) {
    // Stop the race
    gameState.raceInMotion = false;
    SoundManager.stopEngineSound();

    if (won) {
        SoundManager.play('win');
    } else {
        SoundManager.play('lose');
    }

    // Create result overlay
    const overlay = document.createElement('div');
    overlay.className = 'race-result-overlay';
    overlay.id = 'race-result-overlay';

    const resultText = document.createElement('div');
    resultText.className = `race-result-text ${won ? 'win' : 'lose'}`;
    resultText.textContent = won ? '🏆 YOU WIN!' : '💨 YOU LOSE!';

    const stats = document.createElement('div');
    stats.className = 'race-result-stats';
    const elapsed = Date.now() - gameState.startTime;
    stats.innerHTML = `
        Position: ${gameState.position}${['st', 'nd', 'rd', 'th'][gameState.position - 1] || 'th'}<br>
        Problems Solved: ${gameState.problemsSolved}<br>
        Time: ${formatTime(elapsed)}
    `;

    const btn = document.createElement('button');
    btn.className = 'race-result-btn';
    btn.textContent = '🏁 RACE AGAIN';
    btn.onclick = () => {
        SoundManager.play('click');
        overlay.remove();
        resetFullRace();
    };

    overlay.appendChild(resultText);
    overlay.appendChild(stats);
    overlay.appendChild(btn);
    document.body.appendChild(overlay);

    // Activate with slight delay for animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 100);
}

function resetFullRace() {
    // Reset all game state
    gameState.currentLap = 1;
    gameState.problemsSolved = 0;
    gameState.problemsThisLap = 0;

    // Reset timers
    if (timerIntervalId) clearInterval(timerIntervalId);
    if (gameState.mathTimerId) clearInterval(gameState.mathTimerId);
    if (gameState.problemTimerId) clearTimeout(gameState.problemTimerId);

    // Reset timer display
    if (elements.timerMinutes) elements.timerMinutes.textContent = '00';
    if (elements.timerSeconds) elements.timerSeconds.textContent = '00';
    if (elements.timerMs) elements.timerMs.textContent = '00';

    // Show start button again
    if (elements.startRaceBtn) {
        elements.startRaceBtn.classList.remove('hidden');
    }
    if (elements.centerMessage) {
        elements.centerMessage.style.display = 'flex';
        elements.centerMessage.style.opacity = '1';
    }

    // Update HUD
    updateProblems(0);
    updateLap(1, gameState.totalLaps);
    updateBoost(false, 0);
    updatePosition(1);

    // Reinitialize race
    initializeRace();
}

// ============= Race Simulation =============
function initializeRace() {
    initializeCarPositions();
    positionFinishLine();

    gameState.raceStarted = true;
    gameState.raceInMotion = false;
    lastFrameTime = performance.now();
    requestAnimationFrame(raceLoop);
}

function positionFinishLine() {
    // Position finish line at end of track
    const viewportWidth = window.innerWidth;
    gameState.lapDistance = viewportWidth * 2.5; // Lap distance

    if (elements.finishLine) {
        elements.finishLine.style.left = `${gameState.lapDistance}px`;
    }
}

function startRace() {
    if (gameState.raceInMotion) return;

    // Hide the start button and message
    if (elements.startRaceBtn) {
        elements.startRaceBtn.classList.add('hidden');
    }
    if (elements.centerMessage) {
        elements.centerMessage.style.opacity = '0';
        elements.centerMessage.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            elements.centerMessage.style.display = 'none';
        }, 500);
    }

    // Play countdown
    SoundManager.play('countdown');

    // Start race timer
    startRaceTimer();

    // Start engine sound
    SoundManager.startEngineSound();

    // Start the cars moving!
    gameState.raceInMotion = true;
    gameState.problemsThisLap = 0;

    console.log('🏁 Race Started!');

    // Schedule first math problem
    setTimeout(() => {
        if (gameState.raceInMotion) {
            showMathProblem();
        }
    }, gameState.mathSettings.problemInterval * 1000);
}

let lastFrameTime = 0;
let raceElapsedTime = 0; // Track how long race has been going

function initializeCarPositions() {
    const startX = 80;
    const cars = gameState.cars;

    // Player starts slightly behind
    cars.player.x = startX - 20;
    cars.enemy1.x = startX - 10;
    cars.enemy2.x = startX + 5;
    cars.enemy3.x = startX - 5;

    // Reset player speed to base (no random variance for player)
    cars.player.baseSpeed = 2.0;

    // Enemy personalities with competitive speeds
    // Steady Eddie - consistent, reliable
    cars.enemy1.baseSpeed = 2.15;
    cars.enemy1.variance = 0.05;

    // Speed Demon - fast but erratic, sometimes slows down
    cars.enemy2.baseSpeed = 2.25;
    cars.enemy2.variance = 0.4;

    // Turtle/Crescendo - starts slow but gets faster each lap
    cars.enemy3.baseSpeed = 1.95;
    cars.enemy3.variance = 0.1;

    raceElapsedTime = 0;
    updateCarPositions();
}

function raceLoop(currentTime) {
    if (!gameState.raceStarted) return;

    const deltaTime = (currentTime - lastFrameTime) / 16.67;
    lastFrameTime = currentTime;

    if (!gameState.gamePaused && gameState.raceInMotion) {
        raceElapsedTime += deltaTime * 16.67;
        updateCarMovement(deltaTime);
    }

    updateCamera();
    updateRacePositions();

    if (gameState.raceInMotion && !gameState.gamePaused) {
        const playerSpeedMPH = Math.round(gameState.cars.player.speed * 50);
        updateSpeed(playerSpeedMPH);
    } else if (!gameState.raceInMotion) {
        updateSpeed(0);
    }
    smoothSpeedUpdate();

    gameState.raceAnimationId = requestAnimationFrame(raceLoop);
}

function updateCarMovement(deltaTime) {
    if (!gameState.raceInMotion || gameState.gamePaused) {
        updateCarPositions();
        return;
    }

    const cars = gameState.cars;
    const lapDist = gameState.lapDistance;

    // Update player car
    const playerVariation = (Math.random() - 0.5) * 0.1;
    cars.player.speed = cars.player.baseSpeed + playerVariation;
    cars.player.x += cars.player.speed * deltaTime;

    // Update enemy cars with personalities
    updateEnemyCar(cars.enemy1, 'steady', deltaTime);
    updateEnemyCar(cars.enemy2, 'aggressive', deltaTime);
    updateEnemyCar(cars.enemy3, 'crescendo', deltaTime);

    // Check for lap completion (player crosses finish line)
    if (cars.player.x >= lapDist) {
        handleLapComplete();
    }

    // Check if an enemy wins
    Object.keys(cars).forEach(key => {
        if (key !== 'player' && cars[key].x >= lapDist) {
            // Enemy finished this lap
            if (gameState.currentLap >= gameState.totalLaps) {
                // Check if player also finished
                if (cars.player.x < lapDist) {
                    // Enemy won!
                    showRaceResult(false);
                }
            }
        }
    });

    updateCarPositions();
}

function updateEnemyCar(car, personality, deltaTime) {
    const lapProgress = gameState.currentLap / gameState.totalLaps;
    const timeProgress = Math.min(raceElapsedTime / 60000, 1); // Progress over first minute

    let speedMod = 0;

    switch (personality) {
        case 'steady':
            // Very consistent, small random variance
            speedMod = (Math.random() - 0.5) * car.variance;
            break;

        case 'aggressive':
            // Fast with bursts, but occasionally slows down significantly
            if (Math.random() < 0.02) {
                // 2% chance to slow down dramatically
                speedMod = -0.8;
            } else if (Math.random() < 0.1) {
                // 10% chance to speed burst
                speedMod = 0.5;
            } else {
                speedMod = (Math.random() - 0.3) * car.variance;
            }
            break;

        case 'crescendo':
            // Gets faster as race progresses
            const crescendoBoost = lapProgress * 0.4 + timeProgress * 0.3;
            speedMod = crescendoBoost + (Math.random() - 0.5) * car.variance;
            break;
    }

    car.speed = car.baseSpeed + speedMod;
    car.x += car.speed * deltaTime;
}

function handleLapComplete() {
    SoundManager.play('lap');

    if (gameState.currentLap >= gameState.totalLaps) {
        // Race complete! Check if player won
        const playerWon = gameState.position === 1;
        showRaceResult(playerWon);
        return;
    }

    // Next lap
    gameState.currentLap++;
    gameState.problemsThisLap = 0;
    updateLap(gameState.currentLap, gameState.totalLaps);

    // Reset all car positions for new lap
    const cars = gameState.cars;
    const startX = 80;

    // Keep relative positions but reset to start
    const playerLead = cars.player.x - gameState.lapDistance;
    cars.player.x = startX + playerLead * 0.2; // Some carryover advantage
    cars.enemy1.x = startX + (cars.enemy1.x - gameState.lapDistance) * 0.2;
    cars.enemy2.x = startX + (cars.enemy2.x - gameState.lapDistance) * 0.2;
    cars.enemy3.x = startX + (cars.enemy3.x - gameState.lapDistance) * 0.2;

    // Crescendo enemy gets faster each lap
    cars.enemy3.baseSpeed += 0.15;

    // Reset camera
    gameState.cameraOffset = 0;
    updateCamera();

    console.log(`🏁 Lap ${gameState.currentLap} started!`);
}

function updateCarPositions() {
    const cars = gameState.cars;

    if (elements.playerCar) {
        const x = Math.round(cars.player.x);
        elements.playerCar.style.setProperty('--car-x', `${x}px`);
        if (!cars.player.turboActive) {
            elements.playerCar.style.transform = `translate3d(${x}px, 0, 0) rotate(90deg)`;
        }
    }
    if (elements.enemyCar1) {
        const x = Math.round(cars.enemy1.x);
        elements.enemyCar1.style.transform = `translate3d(${x}px, 0, 0) rotate(90deg)`;
    }
    if (elements.enemyCar2) {
        const x = Math.round(cars.enemy2.x);
        elements.enemyCar2.style.transform = `translate3d(${x}px, 0, 0) rotate(90deg)`;
    }
    if (elements.enemyCar3) {
        const x = Math.round(cars.enemy3.x);
        elements.enemyCar3.style.transform = `translate3d(${x}px, 0, 0) rotate(90deg)`;
    }
}

function updateCamera() {
    const playerX = gameState.cars.player.x;
    const viewportWidth = window.innerWidth;

    const targetOffset = playerX - (viewportWidth * 0.3);
    gameState.cameraOffset = Math.max(0, targetOffset);

    const roundedOffset = Math.round(gameState.cameraOffset);
    if (elements.carWrapper) {
        elements.carWrapper.style.transform = `translate3d(-${roundedOffset}px, 0, 0)`;
    }

    if (elements.trackImage) {
        const parallaxOffset = Math.round(gameState.cameraOffset * 0.5);
        elements.trackImage.style.transform = `translate3d(-${parallaxOffset}px, 0, 0)`;
    }
}

function updateRacePositions() {
    const cars = gameState.cars;

    const positions = [
        { key: 'player', x: cars.player.x },
        { key: 'enemy1', x: cars.enemy1.x },
        { key: 'enemy2', x: cars.enemy2.x },
        { key: 'enemy3', x: cars.enemy3.x }
    ].sort((a, b) => b.x - a.x);

    const playerPosition = positions.findIndex(p => p.key === 'player') + 1;

    if (playerPosition !== gameState.position) {
        updatePosition(playerPosition);
    }
}

// ============= Utility Functions =============
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameState, updatePosition, updateSpeed, updateProblems, updateLap, updateBoost };
}
