/* ============================================
   MATH RACING TUTOR - Game Logic
   Handles HUD updates, timers, and game state
   ============================================ */

// ============= Game State =============
const gameState = {
    position: 1,
    totalRacers: 4,
    currentLap: 1,
    totalLaps: 3,
    speed: 156,
    maxSpeed: 200,
    problemsSolved: 7,
    boostReady: true,
    boostCharge: 100,
    raceStarted: false,
    raceTime: 0,
    bestLap: null,
    startTime: null,

    // Car race state
    cars: {
        player: { x: 50, speed: 0, baseSpeed: 2.5, lane: 2 },
        enemy1: { x: 50, speed: 0, baseSpeed: 2.2, lane: 1 },
        enemy2: { x: 50, speed: 0, baseSpeed: 2.3, lane: 3 },
        enemy3: { x: 50, speed: 0, baseSpeed: 2.1, lane: 4 }
    },
    trackLength: 3000, // pixels
    cameraOffset: 0,
    raceAnimationId: null
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

    // Start HUD updates
    startHUDUpdates();

    // Setup event listeners
    setupEventListeners();

    // Hide loading overlay
    setTimeout(() => {
        const loading = document.querySelector('.loading-overlay');
        if (loading) loading.classList.add('hidden');
    }, 500);

    // Simulate race in progress for demo
    simulateRaceDemo();
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
        boostCharge: document.getElementById('boost-charge')
    };
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);

    // Touch controls for mobile
    document.addEventListener('touchstart', handleTouch);

    // Window resize handling
    window.addEventListener('resize', handleResize);
}

// ============= HUD Updates =============
function startHUDUpdates() {
    // Start the timer
    gameState.startTime = Date.now();

    // Update timer every 10ms for smooth milliseconds
    setInterval(updateTimer, 10);
}

function updateTimer() {
    if (!gameState.startTime) return;

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
    gameState.speed = Math.min(speed, gameState.maxSpeed);
    const percentage = (gameState.speed / gameState.maxSpeed) * 100;

    if (elements.speedValue) {
        elements.speedValue.textContent = Math.round(gameState.speed);
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
    switch (e.code) {
        case 'Space':
            // Activate boost
            if (gameState.boostReady) {
                activateBoost();
            }
            e.preventDefault();
            break;
        case 'Escape':
            // Pause game
            togglePause();
            break;
    }
}

function handleTouch(e) {
    // Double-tap to boost
    // Could add more touch controls here
}

function handleResize() {
    // Re-adjust any dynamic sizing if needed
    console.log('Viewport resized:', window.innerWidth, 'x', window.innerHeight);
}

// ============= Game Actions =============
function activateBoost() {
    if (!gameState.boostReady) return;

    // Use boost
    gameState.boostReady = false;
    gameState.boostCharge = 0;

    // Temporarily increase speed
    const originalSpeed = gameState.speed;
    updateSpeed(gameState.maxSpeed);
    updateBoost(false, 0);

    // Recharge boost over 5 seconds
    let rechargeProgress = 0;
    const rechargeInterval = setInterval(() => {
        rechargeProgress += 2;
        updateBoost(false, rechargeProgress);

        if (rechargeProgress >= 100) {
            clearInterval(rechargeInterval);
            updateBoost(true, 100);
        }
    }, 100);

    // Return to normal speed after 2 seconds
    setTimeout(() => {
        updateSpeed(originalSpeed);
    }, 2000);
}

function togglePause() {
    // Placeholder for pause functionality
    console.log('Game paused/resumed');
}

// ============= Demo Simulation =============
function simulateRaceDemo() {
    // Simulate speed variations
    setInterval(() => {
        const variation = (Math.random() - 0.5) * 20;
        updateSpeed(gameState.speed + variation);
    }, 500);

    // Simulate position changes occasionally
    setInterval(() => {
        if (Math.random() < 0.1) {
            const newPos = Math.max(1, Math.min(4, gameState.position + (Math.random() < 0.5 ? 1 : -1)));
            updatePosition(newPos);
        }
    }, 3000);

    // Simulate problems being solved
    setInterval(() => {
        if (Math.random() < 0.3) {
            updateProblems(gameState.problemsSolved + 1);
        }
    }, 5000);

    // Simulate lap completion
    setInterval(() => {
        if (gameState.currentLap < gameState.totalLaps) {
            updateLap(gameState.currentLap + 1, gameState.totalLaps);
        }
    }, 20000);
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
