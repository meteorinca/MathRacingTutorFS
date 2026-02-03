/* ============================================
   MATH RACING TUTOR - Game Logic
   Handles HUD updates, timers, math problems, and game state
   ============================================ */

// ============= Game State =============
const gameState = {
    position: 1,
    totalRacers: 4,
    currentLap: 1,
    totalLaps: 3,
    speed: 156,
    maxSpeed: 200,
    problemsSolved: 0,
    boostReady: false, // Start with no boost - must earn it
    boostCharge: 0,
    raceStarted: false,
    raceInMotion: false, // Cars only move when this is true
    gamePaused: false, // Pause when showing math problem
    raceTime: 0,
    displaySpeed: 0, // Smoothed speed for display
    targetSpeed: 0, // Target speed value
    bestLap: null,
    startTime: null,

    // Car race state
    cars: {
        player: { x: 50, speed: 0, baseSpeed: 2.5, lane: 2, turboActive: false },
        enemy1: { x: 50, speed: 0, baseSpeed: 2.2, lane: 1 },
        enemy2: { x: 50, speed: 0, baseSpeed: 2.3, lane: 3 },
        enemy3: { x: 50, speed: 0, baseSpeed: 2.1, lane: 4 }
    },
    trackLength: 3000, // pixels
    cameraOffset: 0,
    raceAnimationId: null,

    // Math problem state
    mathSettings: {
        minMultiplier: 3,
        maxMultiplier: 12,
        problemInterval: 8, // seconds between problems
        answerTime: 5 // seconds to answer
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

    // Reset HUD to initial state (problems solved = 0)
    updateProblems(0);
    updateBoost(false, 0);
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

        // Cars
        carWrapper: document.getElementById('car-wrapper'),
        playerCar: document.getElementById('player-car'),
        enemyCar1: document.getElementById('enemy-car-1'),
        enemyCar2: document.getElementById('enemy-car-2'),
        enemyCar3: document.getElementById('enemy-car-3'),
        trackImage: document.getElementById('track-image'),
        startRaceBtn: document.getElementById('start-race-btn'),
        centerMessage: document.getElementById('center-message'),

        // Math modal elements
        mathModalOverlay: document.getElementById('math-modal-overlay'),
        mathOperand1: document.getElementById('math-operand1'),
        mathOperand2: document.getElementById('math-operand2'),
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
        elements.startRaceBtn.addEventListener('click', startRace);
        elements.startRaceBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
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
            elements.settingsPanel.classList.toggle('active');
        });
    }

    // Save settings
    if (elements.settingsSave) {
        elements.settingsSave.addEventListener('click', saveSettings);
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

            // Update UI
            if (elements.multMin) elements.multMin.value = gameState.mathSettings.minMultiplier;
            if (elements.multMax) elements.multMax.value = gameState.mathSettings.maxMultiplier;
            if (elements.problemInterval) elements.problemInterval.value = gameState.mathSettings.problemInterval;
        } catch (e) {
            console.log('Could not load settings:', e);
        }
    }
}

function saveSettings() {
    const minVal = parseInt(elements.multMin?.value) || 3;
    const maxVal = parseInt(elements.multMax?.value) || 12;
    const interval = parseInt(elements.problemInterval?.value) || 8;

    gameState.mathSettings.minMultiplier = Math.max(1, Math.min(12, minVal));
    gameState.mathSettings.maxMultiplier = Math.max(gameState.mathSettings.minMultiplier, Math.min(12, maxVal));
    gameState.mathSettings.problemInterval = Math.max(3, Math.min(30, interval));

    // Save to localStorage
    localStorage.setItem('mathRacerSettings', JSON.stringify(gameState.mathSettings));

    // Update UI values
    if (elements.multMin) elements.multMin.value = gameState.mathSettings.minMultiplier;
    if (elements.multMax) elements.multMax.value = gameState.mathSettings.maxMultiplier;
    if (elements.problemInterval) elements.problemInterval.value = gameState.mathSettings.problemInterval;

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
    const smoothFactor = 0.08; // Lower = smoother/slower transitions
    gameState.displaySpeed += (gameState.targetSpeed - gameState.displaySpeed) * smoothFactor;

    const displayValue = Math.round(gameState.displaySpeed);
    const percentage = (gameState.displaySpeed / gameState.maxSpeed) * 100;

    if (elements.speedValue) {
        elements.speedValue.textContent = displayValue;
    }

    if (elements.speedBar) {
        elements.speedBar.style.width = percentage + '%';
    }
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
            // Start race if not started, otherwise boost
            if (!gameState.raceInMotion) {
                startRace();
            } else if (gameState.boostReady) {
                activateTurboBoost();
            }
            e.preventDefault();
            break;
        case 'Escape':
            // Close settings if open
            elements.settingsPanel?.classList.remove('active');
            break;
    }
}

function handleTouch(e) {
    // Double-tap could boost in future
}

function handleResize() {
    console.log('Viewport resized:', window.innerWidth, 'x', window.innerHeight);
}

// ============= Math Problem System =============
function generateMathProblem() {
    const { minMultiplier, maxMultiplier } = gameState.mathSettings;

    // Generate two random numbers within range
    const num1 = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
    const num2 = Math.floor(Math.random() * (maxMultiplier - minMultiplier + 1)) + minMultiplier;
    const answer = num1 * num2;

    // Randomly decide problem type: 0 = answer blank, 1 = first operand blank, 2 = second operand blank
    const problemType = Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 1 : 2);

    let problem = {
        num1: num1,
        num2: num2,
        answer: answer,
        type: problemType,
        userAnswer: null
    };

    // What the user needs to find
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
    // Don't show if race isn't in motion
    if (!gameState.raceInMotion) return;

    // Generate new problem
    gameState.currentProblem = generateMathProblem();
    const problem = gameState.currentProblem;

    // Update modal display based on problem type
    if (problem.type === 0) {
        // Standard: 9 × 12 = ___
        elements.mathOperand1.textContent = problem.num1;
        elements.mathOperand1.classList.remove('blank');
        elements.mathOperand2.textContent = problem.num2;
        elements.mathOperand2.classList.remove('blank');
    } else if (problem.type === 1) {
        // ___ × 12 = 108
        elements.mathOperand1.textContent = '?';
        elements.mathOperand1.classList.add('blank');
        elements.mathOperand2.textContent = problem.num2;
        elements.mathOperand2.classList.remove('blank');
    } else {
        // 9 × ___ = 108
        elements.mathOperand1.textContent = problem.num1;
        elements.mathOperand1.classList.remove('blank');
        elements.mathOperand2.textContent = '?';
        elements.mathOperand2.classList.add('blank');
    }

    // Clear input and feedback
    elements.mathAnswerInput.value = '';
    elements.mathAnswerInput.classList.remove('correct', 'incorrect');
    elements.mathFeedback.textContent = problem.type !== 0 ? `= ${problem.display.showAnswer}` : '';
    elements.mathFeedback.className = 'math-feedback';

    // Reset timer bar
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
    const totalTime = gameState.mathSettings.answerTime * 1000; // Convert to ms
    const startTime = Date.now();

    // Clear any existing timer
    if (gameState.mathTimerId) {
        clearInterval(gameState.mathTimerId);
    }

    gameState.mathTimerId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalTime - elapsed);
        const fraction = remaining / totalTime;

        // Update timer bar
        elements.mathTimerBar.style.transform = `scaleX(${fraction})`;

        // Update timer text
        const secondsLeft = (remaining / 1000).toFixed(1);
        elements.mathTimerText.textContent = `${secondsLeft}s`;

        // Add urgent class when low on time
        if (remaining < 2000) {
            elements.mathTimerText.classList.add('urgent');
        }

        // Time's up!
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
        // Correct answer!
        clearInterval(gameState.mathTimerId);
        handleCorrectAnswer();
    } else if (elements.mathAnswerInput.value.length >= correctAnswer.toString().length) {
        // Wrong answer (only show feedback if they've typed enough digits)
        elements.mathAnswerInput.classList.add('incorrect');
        setTimeout(() => {
            elements.mathAnswerInput.classList.remove('incorrect');
        }, 400);
    }
}

function handleCorrectAnswer() {
    // Show success feedback
    elements.mathAnswerInput.classList.add('correct');
    elements.mathFeedback.textContent = '🎉 BOOST EARNED!';
    elements.mathFeedback.className = 'math-feedback success';

    // Update problems solved
    updateProblems(gameState.problemsSolved + 1);

    // Close modal after brief delay
    setTimeout(() => {
        hideMathModal();
        activateTurboBoost();
    }, 600);
}

function handleTimeUp() {
    // Show failure feedback
    elements.mathFeedback.textContent = '⏰ Time\'s up!';
    elements.mathFeedback.className = 'math-feedback fail';
    elements.mathAnswerInput.classList.add('incorrect');

    // Show correct answer
    setTimeout(() => {
        elements.mathFeedback.textContent = `Answer: ${gameState.currentProblem.blankValue}`;
    }, 500);

    // Close modal after delay
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
    // Clear any existing scheduled problem
    if (gameState.problemTimerId) {
        clearTimeout(gameState.problemTimerId);
    }

    // Schedule next problem
    const delay = gameState.mathSettings.problemInterval * 1000;
    gameState.problemTimerId = setTimeout(() => {
        if (gameState.raceInMotion && !gameState.gamePaused) {
            showMathProblem();
        }
    }, delay);
}

// ============= Turbo Boost System =============
function activateTurboBoost() {
    if (gameState.cars.player.turboActive) return; // Already boosting

    console.log('🚀 TURBO BOOST ACTIVATED!');

    // Mark turbo as active
    gameState.cars.player.turboActive = true;
    const originalBaseSpeed = gameState.cars.player.baseSpeed;

    // Switch to turbo car image
    const playerCarImg = elements.playerCar?.querySelector('img');
    if (playerCarImg) {
        playerCarImg.src = 'dist/assets/racing/player_turbocar.png';
    }

    // Add turbo visual effects
    elements.playerCar?.classList.add('turbo-active');

    // Show boost text popup
    showBoostPopup();

    // Dramatically increase speed
    gameState.cars.player.baseSpeed = originalBaseSpeed * 2.5;

    // Update boost HUD
    updateBoost(false, 0);

    // Turbo duration: 3 seconds
    setTimeout(() => {
        // End turbo
        gameState.cars.player.turboActive = false;
        gameState.cars.player.baseSpeed = originalBaseSpeed;

        // Switch back to normal car
        if (playerCarImg) {
            playerCarImg.src = 'dist/assets/racing/player_car.png';
        }

        // Remove turbo effects
        elements.playerCar?.classList.remove('turbo-active');

        // Schedule next math problem
        scheduleNextProblem();

    }, 3000);
}

function showBoostPopup() {
    // Create and show boost text
    const popup = document.createElement('div');
    popup.className = 'boost-success-overlay';
    popup.textContent = '⚡ BOOST!';
    document.body.appendChild(popup);

    // Remove after animation
    setTimeout(() => {
        popup.remove();
    }, 1000);
}

// ============= Game Actions =============
function togglePause() {
    console.log('Game paused/resumed');
}

// ============= Race Simulation =============
function initializeRace() {
    // Initialize car positions at starting line but don't move yet
    initializeCarPositions();

    // Start the animation loop (but cars won't move until raceInMotion is true)
    gameState.raceStarted = true;
    gameState.raceInMotion = false;
    lastFrameTime = performance.now();
    requestAnimationFrame(raceLoop);
}

function startRace() {
    if (gameState.raceInMotion) return; // Already racing

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

    // Start race timer NOW (after pressing start)
    startRaceTimer();

    // Start the cars moving!
    gameState.raceInMotion = true;

    console.log('🏁 Race Started!');

    // Schedule first math problem after a few seconds
    setTimeout(() => {
        if (gameState.raceInMotion) {
            showMathProblem();
        }
    }, gameState.mathSettings.problemInterval * 1000);
}

let lastFrameTime = 0;

function initializeCarPositions() {
    const startX = 80; // Starting position from left edge (pixels)
    const cars = gameState.cars;

    // Set initial positions - player slightly behind for dramatic effect
    cars.player.x = startX - 20; // Player starts slightly behind
    cars.enemy1.x = startX - 10;
    cars.enemy2.x = startX + 5;
    cars.enemy3.x = startX - 5;

    // Randomize base speeds a bit for variety
    cars.player.baseSpeed = 2.5 + (Math.random() - 0.5) * 0.5;
    cars.enemy1.baseSpeed = 2.2 + (Math.random() - 0.5) * 0.6;
    cars.enemy2.baseSpeed = 2.3 + (Math.random() - 0.5) * 0.6;
    cars.enemy3.baseSpeed = 2.1 + (Math.random() - 0.5) * 0.6;

    // Apply initial positions
    updateCarPositions();
}

function raceLoop(currentTime) {
    if (!gameState.raceStarted) return;

    const deltaTime = (currentTime - lastFrameTime) / 16.67; // Normalize to ~60fps
    lastFrameTime = currentTime;

    // Update car positions (unless game is paused)
    if (!gameState.gamePaused) {
        updateCarMovement(deltaTime);
    }

    // Update camera to follow player
    updateCamera();

    // Update race positions in HUD
    updateRacePositions();

    // Update speed display based on player speed (smoothed)
    if (gameState.raceInMotion && !gameState.gamePaused) {
        const playerSpeedMPH = Math.round(gameState.cars.player.speed * 50);
        updateSpeed(playerSpeedMPH);
    } else if (!gameState.raceInMotion) {
        updateSpeed(0); // Cars not moving yet
    }
    smoothSpeedUpdate(); // Apply smooth interpolation

    // Continue animation loop
    gameState.raceAnimationId = requestAnimationFrame(raceLoop);
}

function updateCarMovement(deltaTime) {
    // Don't move cars if race hasn't started or game is paused
    if (!gameState.raceInMotion || gameState.gamePaused) {
        updateCarPositions();
        return;
    }

    const cars = gameState.cars;
    const viewportWidth = window.innerWidth;
    const maxX = viewportWidth * 3; // Track is 3 viewport widths

    // Update each car's speed with some randomness for realism
    Object.keys(cars).forEach(carKey => {
        const car = cars[carKey];

        // Add slight speed variation (acceleration/deceleration feel) - reduced for smoother motion
        const speedVariation = (Math.random() - 0.5) * 0.15;
        car.speed = car.baseSpeed + speedVariation;

        // Move car forward
        car.x += car.speed * deltaTime;

        // Check for finish line - reset race when player finishes
        if (carKey === 'player' && car.x >= maxX) {
            resetRace();
            return;
        }
    });

    // Apply positions to DOM
    updateCarPositions();
}

function updateCarPositions() {
    const cars = gameState.cars;

    // Use transform: translate3d for GPU-accelerated, jitter-free animation on iOS/iPad
    // Round to whole pixels to prevent sub-pixel rendering issues
    if (elements.playerCar) {
        const x = Math.round(cars.player.x);
        // Store x for CSS animation to use
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

    // Keep player car roughly 30% from the left of the screen
    const targetOffset = playerX - (viewportWidth * 0.3);

    // Don't let camera go negative (before start)
    gameState.cameraOffset = Math.max(0, targetOffset);

    // Apply camera offset as negative transform to the car wrapper
    // Use Math.round; use translate3d for GPU acceleration to prevent jitter
    const roundedOffset = Math.round(gameState.cameraOffset);
    if (elements.carWrapper) {
        elements.carWrapper.style.transform = `translate3d(-${roundedOffset}px, 0, 0)`;
    }

    // Also move the track background for parallax effect
    if (elements.trackImage) {
        const parallaxOffset = Math.round(gameState.cameraOffset * 0.5); // Slower movement for depth
        elements.trackImage.style.transform = `translate3d(-${parallaxOffset}px, 0, 0)`;
    }
}

function updateRacePositions() {
    const cars = gameState.cars;

    // Sort cars by x position (descending - furthest ahead first)
    const positions = [
        { key: 'player', x: cars.player.x },
        { key: 'enemy1', x: cars.enemy1.x },
        { key: 'enemy2', x: cars.enemy2.x },
        { key: 'enemy3', x: cars.enemy3.x }
    ].sort((a, b) => b.x - a.x);

    // Find player's position
    const playerPosition = positions.findIndex(p => p.key === 'player') + 1;

    // Update HUD if position changed
    if (playerPosition !== gameState.position) {
        updatePosition(playerPosition);
    }
}

function resetRace() {
    // Complete a lap
    if (gameState.currentLap < gameState.totalLaps) {
        updateLap(gameState.currentLap + 1, gameState.totalLaps);
    } else {
        // Race complete - restart from lap 1
        gameState.currentLap = 1;
        updateLap(1, gameState.totalLaps);
    }

    // Reset car positions
    initializeCarPositions();

    // Reset camera
    gameState.cameraOffset = 0;
    updateCamera();
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
