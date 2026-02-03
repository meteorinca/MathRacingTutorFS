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
    raceInMotion: false, // New: cars only move when this is true
    raceTime: 0,
    displaySpeed: 0, // Smoothed speed for display
    targetSpeed: 0, // Target speed value
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

    // Initialize race (cars at starting positions, not moving yet)
    initializeRace();
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
        centerMessage: document.getElementById('center-message')
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
    switch (e.code) {
        case 'Space':
        case 'Enter':
            // Start race if not started, otherwise boost
            if (!gameState.raceInMotion) {
                startRace();
            } else if (gameState.boostReady) {
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

    // Reset timer
    gameState.startTime = Date.now();

    // Start the cars moving!
    gameState.raceInMotion = true;

    console.log('🏁 Race Started!');
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

    // Update car positions
    updateCarMovement(deltaTime);

    // Update camera to follow player
    updateCamera();

    // Update race positions in HUD
    updateRacePositions();

    // Update speed display based on player speed (smoothed)
    if (gameState.raceInMotion) {
        const playerSpeedMPH = Math.round(gameState.cars.player.speed * 50);
        updateSpeed(playerSpeedMPH);
    } else {
        updateSpeed(0); // Cars not moving yet
    }
    smoothSpeedUpdate(); // Apply smooth interpolation

    // Continue animation loop
    gameState.raceAnimationId = requestAnimationFrame(raceLoop);
}

function updateCarMovement(deltaTime) {
    // Don't move cars if race hasn't started
    if (!gameState.raceInMotion) {
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

    // Use Math.round to snap to whole pixels and prevent sub-pixel jittering
    if (elements.playerCar) {
        elements.playerCar.style.left = `${Math.round(cars.player.x)}px`;
    }
    if (elements.enemyCar1) {
        elements.enemyCar1.style.left = `${Math.round(cars.enemy1.x)}px`;
    }
    if (elements.enemyCar2) {
        elements.enemyCar2.style.left = `${Math.round(cars.enemy2.x)}px`;
    }
    if (elements.enemyCar3) {
        elements.enemyCar3.style.left = `${Math.round(cars.enemy3.x)}px`;
    }
}

function updateCamera() {
    const playerX = gameState.cars.player.x;
    const viewportWidth = window.innerWidth;
    const carWidth = 80;

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
        updateProblems(gameState.problemsSolved + 1); // Add to problems solved for demo
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
