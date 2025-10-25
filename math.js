// ===== GAME STATE =====
let gameState = 'waiting'; // 'waiting', 'playing', 'gameOver', 'feedback'
let score = 0;
let lives = 5;
let currentEquation = {};
let userInput = '';
let timeLimit = 5;
let timeRemaining = 5;
let lastFrameTime = 0;
let feedbackState = null; // 'correct' or 'incorrect'
let feedbackTimer = 0;
let feedbackDuration = 0.7; // seconds
let creeperX = 0; // Creeper position for animation

// ===== SOUND =====
let successOsc, failOsc;
let envelope;
let audioReady = false;

// ===== MINECRAFT FONT =====
let minecraftFont;

// ===== SETUP =====
function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    lastFrameTime = millis();

    // Initialize sound synthesizers for retro NES-style sounds
    setupSounds();
}

function preload() {
    // TODO: Load Minecraft font when available
    // minecraftFont = loadFont('assets/Minecraft.ttf');
    // For now, we'll use a blocky system font
}

// ===== SOUND SETUP =====
function setupSounds() {
    // Create oscillators (sound generators)
    successOsc = new p5.Oscillator('square');
    failOsc = new p5.Oscillator('square');

    // Create envelope for controlling sound duration
    envelope = new p5.Envelope();
    envelope.setADSR(0.01, 0.1, 0.3, 0.2);
    envelope.setRange(0.3, 0);

    successOsc.amp(0);
    failOsc.amp(0);
    successOsc.start();
    failOsc.start();
}

// ===== ENABLE AUDIO =====
function enableAudio() {
    if (!audioReady && getAudioContext().state !== 'running') {
        userStartAudio().then(() => {
            audioReady = true;
            console.log('Audio enabled!');
        });
    }
}

// ===== SOUND EFFECTS =====
function playSuccessSound() {
    // Pick a random success melody (9 variations)
    let melody = floor(random(9));

    switch (melody) {
        case 0: // Classic ascending
            playNotes(successOsc, [523.25, 659.25, 783.99], [80, 80]);
            break;
        case 1: // Power-up
            playNotes(successOsc, [392.00, 523.25, 659.25, 783.99], [60, 60, 80]);
            break;
        case 2: // Victory fanfare
            playNotes(successOsc, [659.25, 783.99, 1046.50], [70, 70]);
            break;
        case 3: // Happy bounce
            playNotes(successOsc, [523.25, 783.99, 659.25, 880.00], [60, 50, 70]);
            break;
        case 4: // Coin collect
            playNotes(successOsc, [987.77, 1318.51], [50]);
            break;
        case 5: // Level up
            playNotes(successOsc, [523.25, 587.33, 659.25, 783.99, 880.00], [50, 50, 50, 80]);
            break;
        case 6: // Quick win
            playNotes(successOsc, [659.25, 880.00, 1046.50, 1318.51], [40, 40, 60]);
            break;
        case 7: // Arpeggio up
            playNotes(successOsc, [523.25, 659.25, 783.99, 1046.50, 1318.51], [40, 40, 40, 60]);
            break;
        case 8: // Cheerful
            playNotes(successOsc, [659.25, 523.25, 783.99, 659.25], [50, 50, 70]);
            break;
    }
}

// Helper function to play a sequence of notes
function playNotes(osc, frequencies, delays) {
    envelope.setADSR(0.01, 0.05, 0.1, 0.1);
    envelope.setRange(0.2, 0);

    osc.freq(frequencies[0]);
    envelope.play(osc);

    let totalDelay = 0;
    for (let i = 1; i < frequencies.length; i++) {
        totalDelay += delays[i - 1];
        setTimeout(() => {
            osc.freq(frequencies[i]);
            envelope.play(osc);
        }, totalDelay);
    }
}

function playFailSound() {
    // Classic NES fail sound: descending notes with harsh tone
    failOsc.freq(392.00); // G4
    envelope.setADSR(0.01, 0.1, 0.2, 0.15);
    envelope.setRange(0.25, 0);
    envelope.play(failOsc);

    setTimeout(() => {
        failOsc.freq(293.66); // D4
        envelope.play(failOsc);
    }, 100);

    setTimeout(() => {
        failOsc.freq(196.00); // G3
        envelope.play(failOsc);
    }, 200);
}

// ===== RESPONSIVE CANVAS =====
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// ===== MAIN DRAW LOOP =====
function draw() {
    // Minecraft grass background
    drawMinecraftBackground();

    if (gameState === 'waiting') {
        drawWaitingScreen();
    } else if (gameState === 'playing') {
        updateTimer();
        drawGame();
    } else if (gameState === 'feedback') {
        updateFeedback();
        drawFeedback();
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    }
}

// ===== MINECRAFT BACKGROUND =====
function drawMinecraftBackground() {
    // Grass block texture (simplified)
    // Top layer - bright grass green
    fill(106, 190, 48);
    rect(0, 0, width, height * 0.7);

    // Draw grass texture pattern
    noStroke();
    for (let i = 0; i < 50; i++) {
        let x = random(width);
        let y = random(height * 0.7);
        fill(120, 200, 60, 100);
        rect(x, y, random(2, 5), random(2, 5));
    }

    // Bottom layer - dirt brown
    fill(134, 96, 67);
    rect(0, height * 0.7, width, height * 0.3);

    // Add dirt texture
    for (let i = 0; i < 40; i++) {
        let x = random(width);
        let y = height * 0.7 + random(height * 0.3);
        fill(110, 80, 55, 150);
        rect(x, y, random(3, 6), random(3, 6));
    }
}

// ===== WAITING SCREEN =====
function drawWaitingScreen() {
    // Title with Minecraft style
    drawMinecraftText('MATH CRAFT', width / 2, height / 2 - 120, 72, color(255, 255, 100));

    drawMinecraftText('Mine your multiplication skills!', width / 2, height / 2 - 30, 28, color(255, 255, 255));

    drawMinecraftText('Press SPACE to start', width / 2, height / 2 + 60, 32, color(100, 255, 100));

    // Instructions
    drawMinecraftText('Defend against the Creeper with correct answers!', width / 2, height / 2 + 130, 18, color(200, 200, 200));
    drawMinecraftText('Type your answer - it auto-submits!', width / 2, height / 2 + 160, 18, color(200, 200, 200));
    drawMinecraftText('Use BACKSPACE to correct mistakes', width / 2, height / 2 + 190, 18, color(200, 200, 200));
}

// ===== MINECRAFT-STYLE TEXT =====
function drawMinecraftText(txt, x, y, size, col) {
    // Add black shadow/outline for Minecraft look
    fill(0);
    textSize(size);
    textStyle(BOLD);
    text(txt, x + 3, y + 3);

    // Main text
    fill(col);
    text(txt, x, y);
}

// ===== GAME OVER SCREEN =====
function drawGameOverScreen() {
    drawMinecraftText('GAME OVER', width / 2, height / 2 - 100, 72, color(255, 100, 100));
    drawMinecraftText('You were destroyed!', width / 2, height / 2 - 30, 32, color(255, 150, 150));

    drawMinecraftText(`Final Score: ${score}`, width / 2, height / 2 + 30, 48, color(255, 255, 100));

    drawMinecraftText('Press SPACE to respawn', width / 2, height / 2 + 100, 28, color(100, 255, 100));
}

// ===== MAIN GAME DRAWING =====
function drawGame() {
    // Draw HUD
    drawHUD();

    // Draw equation
    drawEquation();

    // Draw timer bar
    drawTimerBar();
}

// ===== HUD (SCORE & LIVES) =====
function drawHUD() {
    // Score display with Minecraft style
    textAlign(LEFT, TOP);
    drawMinecraftText(`Score: ${score}`, 40, 40, 32, color(255, 255, 100));

    // Lives display with hearts (Minecraft style)
    textAlign(LEFT, TOP);
    let heartX = width - 280;
    let heartY = 40;

    // Draw filled hearts
    for (let i = 0; i < lives; i++) {
        drawMinecraftHeart(heartX + i * 50, heartY, true);
    }

    // Draw empty hearts
    for (let i = lives; i < 5; i++) {
        drawMinecraftHeart(heartX + i * 50, heartY, false);
    }
}

// ===== MINECRAFT-STYLE HEART =====
function drawMinecraftHeart(x, y, filled) {
    push();
    translate(x, y);

    if (filled) {
        // Filled red heart
        fill(255, 0, 0);
        stroke(139, 0, 0);
    } else {
        // Empty heart (dark)
        fill(80, 80, 80);
        stroke(40, 40, 40);
    }

    strokeWeight(2);
    // Blocky Minecraft-style heart
    beginShape();
    vertex(15, 10);
    vertex(10, 5);
    vertex(5, 5);
    vertex(0, 10);
    vertex(0, 15);
    vertex(15, 30);
    vertex(30, 15);
    vertex(30, 10);
    vertex(25, 5);
    vertex(20, 5);
    vertex(15, 10);
    endShape(CLOSE);

    pop();
}

// ===== EQUATION DISPLAY =====
function drawEquation() {
    textAlign(CENTER, CENTER);

    let equation = `${currentEquation.num1} × ${currentEquation.num2} =`;
    drawMinecraftText(equation, width / 2, height / 2 - 80, 64, color(255, 255, 255));

    // User input with stone panel background
    let inputBoxWidth = 200;
    let inputBoxHeight = 100;
    drawStonePanel(width / 2 - inputBoxWidth / 2, height / 2 - 20, inputBoxWidth, inputBoxHeight);

    let displayInput = userInput || '_';
    drawMinecraftText(displayInput, width / 2, height / 2 + 30, 72, color(255, 255, 100));
}

// ===== FEEDBACK DISPLAY =====
function drawFeedback() {
    // Draw HUD (still visible during feedback)
    drawHUD();

    textAlign(CENTER, CENTER);

    // Color based on correct/incorrect
    let textColor;
    if (feedbackState === 'correct') {
        textColor = color(100, 255, 100); // Bright green
        // Show arrow hitting creeper
        drawArrowHit();
    } else {
        textColor = color(255, 100, 100); // Bright red
        // Show explosion effect
        drawExplosion();
    }

    let equation = `${currentEquation.num1} × ${currentEquation.num2} =`;
    drawMinecraftText(equation, width / 2, height / 2 - 80, 64, textColor);

    // Show the answer in stone panel
    let inputBoxWidth = 200;
    let inputBoxHeight = 100;
    drawStonePanel(width / 2 - inputBoxWidth / 2, height / 2 - 20, inputBoxWidth, inputBoxHeight);
    drawMinecraftText(currentEquation.answer.toString(), width / 2, height / 2 + 30, 72, textColor);
}

// ===== ARROW HIT ANIMATION =====
function drawArrowHit() {
    // Simple arrow graphic
    push();
    translate(width / 2 + 300, height / 2 + 120);
    fill(139, 90, 43); // Brown
    stroke(0);
    strokeWeight(2);
    rect(-40, -3, 60, 6); // Arrow shaft
    fill(180, 180, 180); // Gray
    triangle(20, 0, 35, -8, 35, 8); // Arrow head
    pop();
}

// ===== EXPLOSION ANIMATION =====
function drawExplosion() {
    // Simple explosion effect
    push();
    translate(width / 2 + 300, height / 2 + 120);
    noStroke();
    for (let i = 0; i < 8; i++) {
        let angle = (TWO_PI / 8) * i;
        let distance = 20 + random(20);
        let x = cos(angle) * distance;
        let y = sin(angle) * distance;
        fill(255, random(100, 255), 0, 200);
        ellipse(x, y, random(10, 25));
    }
    pop();
}

function updateFeedback() {
    let currentTime = millis();
    let deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    feedbackTimer -= deltaTime;

    if (feedbackTimer <= 0) {
        // Check if game is over after feedback
        if (lives <= 0) {
            gameState = 'gameOver';
        } else {
            generateNewEquation();
            gameState = 'playing';
        }
    }
}

// ===== TIMER BAR (CREEPER APPROACHING) =====
function drawTimerBar() {
    let barWidth = 600;
    let barHeight = 50;
    let barX = width / 2 - barWidth / 2;
    let barY = height / 2 + 140;

    // Draw stone background bar
    drawStonePanel(barX, barY, barWidth, barHeight);

    // Calculate creeper position based on time remaining
    let creeperProgress = 1 - (timeRemaining / timeLimit);
    creeperX = barX + (barWidth - 60) * creeperProgress;

    // Draw creeper (placeholder - simplified version)
    drawCreeper(creeperX, barY - 20);

    // Add "danger" text when time is low
    if (timeRemaining / timeLimit < 0.3) {
        push();
        textAlign(CENTER, CENTER);
        let flashAlpha = (sin(frameCount * 0.3) + 1) * 127;
        drawMinecraftText('CREEPER APPROACHING!', width / 2, barY - 60, 24, color(255, 50, 50, flashAlpha));
        pop();
    }
}

// ===== STONE PANEL (MINECRAFT STYLE) =====
function drawStonePanel(x, y, w, h) {
    // Stone background
    fill(127, 127, 127);
    stroke(80, 80, 80);
    strokeWeight(3);
    rect(x, y, w, h);

    // Add stone texture
    noStroke();
    for (let i = 0; i < 20; i++) {
        let rx = x + random(w);
        let ry = y + random(h);
        fill(random(100, 150), random(100, 150), random(100, 150), 100);
        rect(rx, ry, random(3, 8), random(3, 8));
    }

    // Highlight edge (3D effect)
    stroke(180, 180, 180);
    strokeWeight(2);
    line(x, y, x + w, y);
    line(x, y, x, y + h);

    // Shadow edge
    stroke(60, 60, 60);
    line(x + w, y, x + w, y + h);
    line(x, y + h, x + w, y + h);
}

// ===== CREEPER (PLACEHOLDER) =====
function drawCreeper(x, y) {
    // TODO: Replace with actual creeper image when available
    // For now: simplified green pixelated creeper
    push();
    noStroke();

    // Body (green)
    fill(0, 124, 0);
    rect(x, y + 20, 60, 80);

    // Head
    rect(x + 10, y, 40, 40);

    // Face - eyes
    fill(0);
    rect(x + 15, y + 10, 8, 12);
    rect(x + 37, y + 10, 8, 12);

    // Face - mouth
    rect(x + 25, y + 25, 5, 8);
    rect(x + 20, y + 28, 5, 5);
    rect(x + 35, y + 28, 5, 5);
    rect(x + 25, y + 33, 10, 5);

    // Feet
    rect(x + 5, y + 100, 20, 15);
    rect(x + 35, y + 100, 20, 15);

    pop();
}

// ===== TIMER UPDATE =====
function updateTimer() {
    let currentTime = millis();
    let deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;

    timeRemaining -= deltaTime;

    if (timeRemaining <= 0) {
        // Timeout - treat as incorrect answer
        userInput = ''; // Clear any partial input
        loseLife();
        showFeedback('incorrect');
    }
}

// ===== GAME LOGIC =====
function startGame() {
    // Enable audio on first user interaction
    enableAudio();

    gameState = 'playing';
    score = 0;
    lives = 5;
    generateNewEquation();
}

function generateNewEquation() {
    currentEquation = {
        num1: floor(random(1, 11)),
        num2: floor(random(1, 11)),
    };
    currentEquation.answer = currentEquation.num1 * currentEquation.num2;

    userInput = '';

    // Calculate time limit based on score
    if (score < 20) {
        timeLimit = 7;
    } else if (score < 40) {
        timeLimit = 5;
    } else {
        timeLimit = 4;
    }

    timeRemaining = timeLimit;
    lastFrameTime = millis();
}

function checkAnswer() {
    let answer = parseInt(userInput);

    if (answer === currentEquation.answer) {
        score++;
        showFeedback('correct');
    } else {
        loseLife();
        showFeedback('incorrect');
    }
}

function showFeedback(type) {
    feedbackState = type;
    feedbackTimer = feedbackDuration;
    gameState = 'feedback';
    lastFrameTime = millis();

    // Play sound effect
    if (type === 'correct') {
        playSuccessSound();
    } else {
        playFailSound();
    }
}

function autoCheckAnswer() {
    // Auto-submit when input length matches answer length
    let answerLength = currentEquation.answer.toString().length;
    if (userInput.length === answerLength) {
        checkAnswer();
    }
}

function loseLife() {
    lives--;

    if (lives <= 0) {
        // Don't set game over immediately if we're showing feedback
        // The feedback timer will handle transitioning to game over
        if (gameState !== 'feedback') {
            gameState = 'gameOver';
        }
    }
    // Note: generateNewEquation() is called after feedback timer
}

// ===== KEYBOARD INPUT =====
function keyPressed() {
    if (key === ' ') {
        if (gameState === 'waiting' || gameState === 'gameOver') {
            startGame();
        }
        return;
    }

    if (gameState === 'playing') {
        // Number input
        if (key >= '0' && key <= '9') {
            if (userInput.length < 4) { // Limit input length
                userInput += key;
                autoCheckAnswer(); // Auto-submit when length matches
            }
        }

        // Backspace
        if (keyCode === BACKSPACE) {
            userInput = userInput.slice(0, -1);
        }

        // Enter to submit (still works as manual override)
        if (keyCode === ENTER && userInput.length > 0) {
            checkAnswer();
        }
    }

    // Skip feedback early with SPACE (optional feature)
    if (gameState === 'feedback' && key === ' ') {
        feedbackTimer = 0; // Skip to next question immediately
    }
}

// ==========================================
// TODO: FUTURE ENHANCEMENTS
// ==========================================
// - [ ] Add highscore tracking system (local storage)
// - [x] Add sound effects (correct answer, wrong answer, lose life) ✓
// - [ ] Add background music (C418 Minecraft style)
// - [ ] Add animations (score pop-up, shake on wrong answer)
// - [ ] Add particle effects for correct answers (block breaking effect)
// - [ ] Add difficulty levels (easy: 1-5, medium: 1-10, hard: 1-15)
// - [ ] Add different operation modes (addition, subtraction, division)
// - [ ] Add combo multiplier for consecutive correct answers
// - [x] Add visual feedback (color flash on correct/incorrect) ✓
// - [ ] Add statistics (accuracy percentage, average time per answer)
// - [ ] Add achievement system
// - [ ] Add practice mode (no lives, no timer)
// - [ ] Add game over sound
// - [ ] Add start game sound
// - [ ] Add time running out warning sound
// - [x] Minecraft theme design ✓
//
// MINECRAFT ASSETS TO ADD:
// - [ ] assets/minecraft-font.ttf (Minecraft font file)
// - [ ] assets/grass-block.png (grass texture)
// - [ ] assets/stone.png (stone texture)
// - [ ] assets/creeper.png (creeper sprite)
// - [ ] assets/arrow.png (arrow sprite)
// - [ ] assets/explosion.png (explosion sprite sheet)
// - [ ] assets/heart-full.png (full heart icon)
// - [ ] assets/heart-empty.png (empty heart icon)
// ==========================================
