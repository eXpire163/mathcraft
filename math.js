// ===== GAME STATE =====
let gameState = 'waiting'; // 'waiting', 'playing', 'gameOver', 'feedback', 'debug'
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

// ===== DEVICE DETECTION =====
let isMobile = false;
let isTouch = false;
let deviceType = 'desktop';

// ===== MOBILE ANSWER BUTTONS =====
let answerButtons = [];
let buttonHeight = 160; // Height for each button
let buttonBorder = 40; // Border margin from window edges

// ===== MINECRAFT FONT =====
let spriteSheet;
let tileSize = 64;
let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let charImages = {};

// ===== CALIBRATION SYSTEM =====
let calibrationMode = false;
let currentCharIndex = 0;
let waitingForTopLeft = true;
let charPositions = [
    { char: 'A', x: 13, y: 0, w: 95, h: 110 },
    { char: 'B', x: 125, y: 0, w: 88, h: 111 },
    { char: 'C', x: 233, y: 0, w: 80, h: 109 },
    { char: 'D', x: 328, y: 1, w: 89, h: 108 },
    { char: 'E', x: 438, y: 0, w: 87, h: 109 },
    { char: 'F', x: 536, y: 1, w: 85, h: 110 },
    { char: 'G', x: 637, y: 0, w: 89, h: 111 },
    { char: 'H', x: 741, y: 1, w: 92, h: 108 },
    { char: 'I', x: 849, y: 0, w: 46, h: 109 },
    { char: 'J', x: 15, y: 147, w: 80, h: 110 },
    { char: 'K', x: 112, y: 147, w: 88, h: 110 },
    { char: 'L', x: 216, y: 147, w: 81, h: 109 },
    { char: 'M', x: 311, y: 145, w: 109, h: 113 },
    { char: 'N', x: 433, y: 151, w: 101, h: 104 },
    { char: 'O', x: 547, y: 148, w: 93, h: 111 },
    { char: 'P', x: 653, y: 148, w: 86, h: 112 },
    { char: 'Q', x: 752, y: 148, w: 91, h: 119 },
    { char: 'R', x: 858, y: 147, w: 94, h: 111 },
    { char: 'S', x: 13, y: 289, w: 88, h: 112 },
    { char: 'T', x: 113, y: 289, w: 88, h: 110 },
    { char: 'U', x: 317, y: 289, w: 92, h: 110 },
    { char: 'V', x: 421, y: 290, w: 96, h: 109 },
    { char: 'W', x: 533, y: 290, w: 108, h: 109 },
    { char: 'X', x: 651, y: 290, w: 87, h: 109 },
    { char: 'Y', x: 749, y: 289, w: 88, h: 110 },
    { char: 'Z', x: 851, y: 289, w: 86, h: 112 },
    { char: '0', x: 11, y: 426, w: 94, h: 115 },
    { char: '1', x: 111, y: 424, w: 54, h: 113 },
    { char: '2', x: 177, y: 429, w: 90, h: 109 },
    { char: '3', x: 273, y: 423, w: 85, h: 114 },
    { char: '4', x: 367, y: 426, w: 72, h: 112 },
    { char: '5', x: 452, y: 425, w: 73, h: 110 },
    { char: '6', x: 536, y: 428, w: 78, h: 109 },
    { char: '7', x: 621, y: 424, w: 84, h: 116 },
    { char: '8', x: 711, y: 424, w: 92, h: 116 },
    { char: '9', x: 813, y: 425, w: 94, h: 112 }
];
let tempTopLeft = null;
let displayScale = 2;
let spriteX, spriteY;

// ===== DEVICE DETECTION =====
function detectDevice() {
    // Method 1: User Agent Detection
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod',
        'blackberry', 'windows phone', 'mobile', 'tablet'
    ];

    let isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

    // Method 2: Touch Capability Detection
    isTouch = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0);

    // Method 3: Screen Size Detection
    let isSmallScreen = (window.innerWidth <= 768) || (window.innerHeight <= 768);

    // Method 4: CSS Media Query Detection
    let isMobileMedia = window.matchMedia("(pointer: coarse)").matches;

    // Combine methods for reliable detection
    isMobile = isMobileUA || (isTouch && isSmallScreen) || isMobileMedia;

    // Determine device type
    if (userAgent.includes('ipad') || (isTouch && window.innerWidth >= 768)) {
        deviceType = 'tablet';
    } else if (isMobile) {
        deviceType = 'mobile';
    } else {
        deviceType = 'desktop';
    }

    // Log detection results (can be removed in production)
    console.log('Device Detection:');
    console.log('- User Agent Mobile:', isMobileUA);
    console.log('- Touch Capable:', isTouch);
    console.log('- Small Screen:', isSmallScreen);
    console.log('- Mobile Media Query:', isMobileMedia);
    console.log('- Final Result - Mobile:', isMobile);
    console.log('- Device Type:', deviceType);
    console.log('- Screen Size:', window.innerWidth + 'x' + window.innerHeight);
}

// ===== SETUP =====
function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    lastFrameTime = millis();
    noSmooth(); // Keep pixelated look

    // Detect device type
    detectDevice();

    // Prepare each character as a cropped image using precise positions
    if (spriteSheet) {
        for (let i = 0; i < chars.length; i++) {
            if (i < charPositions.length) {
                let pos = charPositions[i];
                charImages[chars[i]] = spriteSheet.get(pos.x, pos.y, pos.w, pos.h);
            } else {
                // Fallback to old method if position not defined
                let x = (i % 9) * tileSize;
                let y = floor(i / 9) * tileSize;
                charImages[chars[i]] = spriteSheet.get(x, y, tileSize, tileSize);
            }
        }
    }

    // Initialize sound synthesizers for retro NES-style sounds
    setupSounds();
}

function preload() {
    // Load the Minecraft font sprite sheet
    spriteSheet = loadImage("assets/font2.png");
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
    } else if (gameState === 'debug') {
        drawDebugScreen();
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
    drawMinecraftTextWithShadow('MATH CRAFT', width / 2, height / 2 - 120, 72, color(255, 255, 100), 4);

    drawMinecraftTextWithShadow('MINE YOUR MULTIPLICATION SKILLS', width / 2, height / 2 - 30, 28, color(255, 255, 255));

    // Device-specific start instruction
    if (isMobile || isTouch) {
        drawMinecraftTextWithShadow('TAP TO START', width / 2, height / 2 + 60, 32, color(100, 255, 100));
    } else {
        drawMinecraftTextWithShadow('PRESS SPACE TO START', width / 2, height / 2 + 60, 32, color(100, 255, 100));
    }

    // Instructions
    drawMinecraftTextWithShadow('DEFEND AGAINST THE CREEPER WITH CORRECT ANSWERS', width / 2, height / 2 + 130, 18, color(200, 200, 200));

    // Device-specific input instructions
    if (isMobile || isTouch) {
        drawMinecraftTextWithShadow('TAP THE CORRECT ANSWER BUTTON', width / 2, height / 2 + 160, 18, color(200, 200, 200));
    } else {
        drawMinecraftTextWithShadow('TYPE YOUR ANSWER - IT AUTO SUBMITS', width / 2, height / 2 + 160, 18, color(200, 200, 200));
        drawMinecraftTextWithShadow('USE BACKSPACE TO CORRECT MISTAKES', width / 2, height / 2 + 190, 18, color(200, 200, 200));
    }

    // Debug hint (only show on non-mobile)
    if (!isMobile) {
        fill(100, 100, 100);
        textAlign(RIGHT, BOTTOM);
        textSize(12);
        text('Press D for sprite debug', width - 20, height - 20);
    }

    // Device info (can be removed in production)
    fill(100, 100, 100);
    textAlign(LEFT, BOTTOM);
    textSize(10);
    text(`Device: ${deviceType} | Touch: ${isTouch}`, 20, height - 10);
}

// ===== MINECRAFT-STYLE TEXT (SPRITE-BASED) =====
function drawMinecraftText(txt, x, y, size, col) {
    if (!spriteSheet || Object.keys(charImages).length === 0) {
        // Fallback to regular text if sprites aren't loaded
        fill(0);
        textSize(size);
        textStyle(BOLD);
        text(txt, x + 3, y + 3);
        fill(col);
        text(txt, x, y);
        return;
    }

    // Convert text to uppercase for sprite matching
    txt = txt.toUpperCase();

    // Calculate spacing based on target size
    let avgCharHeight = 100; // Average height from our character data
    let scale = (size / avgCharHeight) * 1.5; // Make sprites 50% larger
    let baseSpacing = size * 0.8; // Base spacing between characters
    let charSpacing = 10; // Fixed 10px spacing between characters

    // Calculate total width for centering (approximate)
    let totalWidth = 0;

    for (let i = 0; i < txt.length; i++) {
        let c = txt[i];
        if (c === ' ') {
            totalWidth += baseSpacing * 0.5; // Space width
        } else {
            let charIndex = chars.indexOf(c);
            if (charIndex >= 0 && charIndex < charPositions.length) {
                totalWidth += charPositions[charIndex].w * scale + charSpacing;
            } else {
                totalWidth += baseSpacing + charSpacing; // Fallback width
            }
        }
    }
    // Remove the last spacing since there's no character after the last one
    if (txt.length > 0) totalWidth -= charSpacing;

    let startX = x - totalWidth / 2;
    let currentX = startX;

    push();
    // Apply tint for coloring
    tint(col);

    // Draw each character
    for (let i = 0; i < txt.length; i++) {
        let c = txt[i];

        if (c === ' ') {
            // Skip spaces but advance position
            currentX += baseSpacing * 0.5;
            continue;
        }

        let img = charImages[c];
        if (img) {
            let charIndex = chars.indexOf(c);
            if (charIndex >= 0 && charIndex < charPositions.length) {
                let pos = charPositions[charIndex];
                let charWidth = pos.w * scale;
                let charHeight = pos.h * scale;

                // Center character vertically
                let charY = y - (charHeight / 2);
                image(img, currentX, charY, charWidth, charHeight);

                // Advance position with 5px spacing
                currentX += charWidth + charSpacing;
            } else {
                // Fallback for characters without precise positions
                let charWidth = baseSpacing;
                let charY = y - (charWidth / 2);
                image(img, currentX, charY, charWidth, charWidth);
                currentX += charWidth + charSpacing;
            }
        }
    }

    noTint(); // Reset tint
    pop();
}

// ===== SPRITE TEXT WITH SHADOW =====
function drawMinecraftTextWithShadow(txt, x, y, size, col, shadowOffset = 3) {
    // Draw shadow first (black)
    drawMinecraftText(txt, x + shadowOffset, y + shadowOffset, size, color(0, 0, 0, 150));
    // Draw main text
    drawMinecraftText(txt, x, y, size, col);
}

// ===== GAME OVER SCREEN =====
function drawGameOverScreen() {
    drawMinecraftTextWithShadow('GAME OVER', width / 2, height / 2 - 120, 72, color(255, 100, 100), 4);
    drawMinecraftTextWithShadow('YOU WERE DESTROYED', width / 2, height / 2 - 40, 32, color(255, 150, 150));

    drawMinecraftTextWithShadow(`FINAL SCORE ${score}`, width / 2, height / 2 + 20, 48, color(255, 255, 100));

    // Device-specific restart instruction
    if (isMobile || isTouch) {
        drawMinecraftTextWithShadow('TAP TO RESPAWN', width / 2, height / 2 + 90, 28, color(100, 255, 100));
    } else {
        drawMinecraftTextWithShadow('PRESS SPACE TO RESPAWN', width / 2, height / 2 + 90, 28, color(100, 255, 100));
    }
}

// ===== DEBUG SCREEN =====
function drawDebugScreen() {
    // Clear background to black for better visibility
    background(0);

    // Title
    fill(255, 255, 0);
    textSize(20);
    textAlign(CENTER, TOP);
    if (calibrationMode) {
        text(`CALIBRATION MODE - Character: ${chars[currentCharIndex]} (${currentCharIndex + 1}/${chars.length})`, width / 2, 10);
        text(waitingForTopLeft ? 'Click TOP-LEFT corner of character' : 'Click BOTTOM-RIGHT corner of character', width / 2, 35);
    } else {
        text('SPRITE SHEET DEBUG - Press D to exit, C to calibrate', width / 2, 20);
    }

    if (!spriteSheet) {
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        text('SPRITE SHEET NOT LOADED!', width / 2, height / 2);
        return;
    }

    // Calculate display size and position (store globally for mouse handling)
    displayScale = 2;
    let spriteDisplayWidth = spriteSheet.width * displayScale;
    let spriteDisplayHeight = spriteSheet.height * displayScale;
    spriteX = (width - spriteDisplayWidth) / 2;
    spriteY = calibrationMode ? 80 : 100;

    // Draw the sprite sheet
    push();
    noSmooth();
    image(spriteSheet, spriteX, spriteY, spriteDisplayWidth, spriteDisplayHeight);
    pop();

    if (calibrationMode) {
        drawCalibrationInterface();
    } else {
        drawGridDebugInfo();
    }

    // Display sprite sheet info
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    let infoY = calibrationMode ? height - 120 : 60;
    text(`Sprite Sheet: ${spriteSheet.width} x ${spriteSheet.height}`, 20, infoY);
    text(`Precise Positions: ${charPositions.length} defined`, 20, infoY + 15);
    text(`Characters: ${chars}`, 20, infoY + 30);

    if (!calibrationMode) {
        text(`Loaded Characters: ${Object.keys(charImages).length}`, 20, infoY + 45);
        text(`Using: Precise pixel positions (green) / Grid fallback (red)`, 20, infoY + 60);

        // Show sample position data
        if (charPositions.length > 0) {
            fill(0, 255, 0);
            text(`Sample 'A': x=${charPositions[0].x}, y=${charPositions[0].y}, w=${charPositions[0].w}, h=${charPositions[0].h}`, 20, infoY + 75);
        }

        // Test text rendering at bottom
        textAlign(CENTER, BOTTOM);
        textSize(16);
        fill(255, 255, 255);
        text('Test text with precise sprites:', width / 2, height - 60);        // Test sprite rendering
        if (Object.keys(charImages).length > 0) {
            drawMinecraftText('HELLO123', width / 2, height - 30, 32, color(255, 255, 255));
        }
    }
}

// ===== CALIBRATION INTERFACE =====
function drawCalibrationInterface() {
    // Highlight current character area
    if (currentCharIndex < chars.length) {
        let currentChar = chars[currentCharIndex];

        // Draw highlighting for current character
        stroke(0, 255, 0);
        strokeWeight(3);
        noFill();

        // If we already have some positions defined, show them
        if (charPositions[currentCharIndex]) {
            let pos = charPositions[currentCharIndex];
            if (pos.x1 !== undefined && pos.y1 !== undefined) {
                // Draw top-left marker
                fill(0, 255, 0, 100);
                ellipse(spriteX + pos.x1 * displayScale, spriteY + pos.y1 * displayScale, 10, 10);

                if (pos.x2 !== undefined && pos.y2 !== undefined) {
                    // Draw bottom-right marker and rectangle
                    ellipse(spriteX + pos.x2 * displayScale, spriteY + pos.y2 * displayScale, 10, 10);

                    noFill();
                    stroke(0, 255, 0);
                    strokeWeight(2);
                    rect(spriteX + pos.x1 * displayScale, spriteY + pos.y1 * displayScale,
                        (pos.x2 - pos.x1) * displayScale, (pos.y2 - pos.y1) * displayScale);
                }
            }
        }

        // Show temp top-left if we're waiting for bottom-right
        if (tempTopLeft && !waitingForTopLeft) {
            fill(255, 255, 0, 150);
            noStroke();
            ellipse(spriteX + tempTopLeft.x * displayScale, spriteY + tempTopLeft.y * displayScale, 8, 8);
        }

        // Instructions
        fill(255, 255, 255);
        textAlign(LEFT, TOP);
        textSize(14);
        text(`Character: '${currentChar}'`, 20, height - 80);
        text(`Progress: ${currentCharIndex}/${chars.length}`, 20, height - 60);
        text(`Press R to reset, F to finish and copy to clipboard`, 20, height - 40);
        text(`Press N to skip character, P to go back`, 20, height - 20);
    } else {
        // Calibration complete
        fill(0, 255, 0);
        textAlign(CENTER, CENTER);
        textSize(24);
        text('CALIBRATION COMPLETE!', width / 2, height / 2);
        text('Press F to copy positions to clipboard', width / 2, height / 2 + 40);
    }
}

// ===== GRID DEBUG INFO =====
function drawGridDebugInfo() {
    // Draw precise character rectangles and labels
    stroke(0, 255, 0); // Green for precise positions
    strokeWeight(2);
    fill(255, 255, 0);
    textAlign(CENTER, CENTER);
    textSize(12);

    for (let i = 0; i < chars.length; i++) {
        if (i < charPositions.length) {
            let pos = charPositions[i];

            // Scale positions for display
            let displayX = spriteX + pos.x * displayScale;
            let displayY = spriteY + pos.y * displayScale;
            let displayW = pos.w * displayScale;
            let displayH = pos.h * displayScale;

            // Draw precise rectangle
            noFill();
            rect(displayX, displayY, displayW, displayH);

            // Draw character label above
            fill(255, 255, 0);
            text(chars[i], displayX + displayW / 2, displayY - 15);

            // Draw position info below
            fill(0, 255, 255);
            textSize(8);
            text(`${pos.x},${pos.y}`, displayX + displayW / 2, displayY + displayH + 10);
            text(`${pos.w}x${pos.h}`, displayX + displayW / 2, displayY + displayH + 22);
        } else {
            // Fallback to old grid method for missing positions
            let gridX = i % 9;
            let gridY = floor(i / 9);
            let x = gridX * tileSize;
            let y = gridY * tileSize;

            let displayX = spriteX + x * displayScale;
            let displayY = spriteY + y * displayScale;
            let displayTileSize = tileSize * displayScale;

            // Draw old grid rectangle in red
            stroke(255, 0, 0);
            strokeWeight(1);
            noFill();
            rect(displayX, displayY, displayTileSize, displayTileSize);

            fill(255, 100, 100);
            textSize(10);
            text(chars[i], displayX + displayTileSize / 2, displayY - 10);

            fill(255, 0, 0);
            textSize(8);
            text(`${x},${y} (grid)`, displayX + displayTileSize / 2, displayY + displayTileSize + 15);
        }
    }
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
    // Score display with Minecraft style (moved 10px to the right)
    push();
    textAlign(LEFT, TOP);
    drawMinecraftTextWithShadow(`SCORE ${score}`, 200, 55, 32, color(255, 255, 100));
    pop();

    // Lives display with hearts (Minecraft style)
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
    push();
    textAlign(CENTER, CENTER);

    // Use normal font for equation (easier to read)
    let equation = `${currentEquation.num1} × ${currentEquation.num2} =`;

    // Draw shadow first
    fill(0, 0, 0, 150);
    textSize(64);
    textStyle(BOLD);
    text(equation, width / 2 + 3, height / 2 - 80 + 3);

    // Draw main equation text
    fill(255, 255, 255);
    text(equation, width / 2, height / 2 - 80);

    if (isMobile || isTouch) {
        // Show answer buttons for mobile
        drawAnswerButtons();
    } else {
        // Show traditional input box for desktop
        let inputBoxWidth = 200;
        let inputBoxHeight = 100;
        drawStonePanel(width / 2 - inputBoxWidth / 2, height / 2 - 20, inputBoxWidth, inputBoxHeight);

        let displayInput = userInput || '_';

        // Use normal font for user input too (easier to read)
        fill(0, 0, 0, 150);
        textSize(72);
        text(displayInput, width / 2 + 3, height / 2 + 30 + 3);

        fill(255, 255, 100);
        text(displayInput, width / 2, height / 2 + 30);
    }

    pop();
}

// ===== DRAW ANSWER BUTTONS (MOBILE) =====
function drawAnswerButtons() {
    for (let button of answerButtons) {
        push();

        // Button background (stone panel style)
        drawStonePanel(button.x, button.y, button.width, button.height);

        // Button text (larger for taller buttons)
        fill(255, 255, 255);
        textAlign(CENTER, CENTER);
        textSize(48); // Increased from 32 to 48 for better visibility
        textStyle(BOLD);

        // Shadow
        fill(0, 0, 0, 150);
        text(button.value, button.x + button.width / 2 + 3, button.y + button.height / 2 + 3);

        // Main text
        fill(255, 255, 255);
        text(button.value, button.x + button.width / 2, button.y + button.height / 2);

        pop();
    }
}

// ===== FEEDBACK DISPLAY =====
function drawFeedback() {
    // Draw HUD (still visible during feedback)
    drawHUD();

    push();
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

    // Use normal font for equation (easier to read)
    let equation = `${currentEquation.num1} × ${currentEquation.num2} =`;

    // Draw shadow first
    fill(0, 0, 0, 150);
    textSize(64);
    textStyle(BOLD);
    text(equation, width / 2 + 3, height / 2 - 80 + 3);

    // Draw main equation text
    fill(textColor);
    text(equation, width / 2, height / 2 - 80);

    if (isMobile || isTouch) {
        // Show answer buttons with correct answer highlighted
        drawFeedbackButtons(textColor);
    } else {
        // Show the answer in stone panel (desktop)
        let inputBoxWidth = 200;
        let inputBoxHeight = 100;
        drawStonePanel(width / 2 - inputBoxWidth / 2, height / 2 - 20, inputBoxWidth, inputBoxHeight);

        // Use normal font for answer too
        fill(0, 0, 0, 150);
        textSize(72);
        text(currentEquation.answer.toString(), width / 2 + 3, height / 2 + 30 + 3);

        fill(textColor);
        text(currentEquation.answer.toString(), width / 2, height / 2 + 30);
    }
    pop();
}

// ===== DRAW FEEDBACK BUTTONS (MOBILE) =====
function drawFeedbackButtons(highlightColor) {
    for (let button of answerButtons) {
        push();

        // Button background (stone panel style)
        drawStonePanel(button.x, button.y, button.width, button.height);

        // Highlight correct answer with border
        if (button.isCorrect) {
            stroke(highlightColor);
            strokeWeight(6); // Increased stroke weight for larger buttons
            noFill();
            rect(button.x - 3, button.y - 3, button.width + 6, button.height + 6);
        }

        // Button text (larger for taller buttons)
        fill(255, 255, 255);
        textAlign(CENTER, CENTER);
        textSize(48); // Increased from 32 to 48 for consistency
        textStyle(BOLD);

        // Shadow
        fill(0, 0, 0, 150);
        text(button.value, button.x + button.width / 2 + 3, button.y + button.height / 2 + 3);

        // Main text
        fill(255, 255, 255);
        text(button.value, button.x + button.width / 2, button.y + button.height / 2);

        pop();
    }
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
        drawMinecraftTextWithShadow('CREEPER APPROACHING', width / 2, barY - 60, 24, color(255, 50, 50, flashAlpha));
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

    // Generate answer buttons for mobile
    if (isMobile || isTouch) {
        generateAnswerButtons();
    }

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

// ===== GENERATE ANSWER BUTTONS (MOBILE) =====
function generateAnswerButtons() {
    let correctAnswer = currentEquation.answer;
    let options = [correctAnswer];

    // Generate 3 wrong answers (±10 from correct answer)
    while (options.length < 4) {
        let wrongAnswer = correctAnswer + floor(random(-10, 11));

        // Make sure it's positive and not already in the options
        if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }

    // Sort options by value
    options.sort((a, b) => a - b);

    // Create button objects spanning window width
    answerButtons = [];
    let buttonWidth = width - (buttonBorder * 2); // Full width minus borders
    let totalHeight = buttonHeight * 4 + 15 * 3; // 4 buttons + 3 gaps of 15px
    let startY = height - totalHeight - 30; // 30px from bottom

    for (let i = 0; i < 4; i++) {
        answerButtons.push({
            value: options[i],
            x: buttonBorder,
            y: startY + i * (buttonHeight + 15), // 15px spacing between buttons
            width: buttonWidth,
            height: buttonHeight,
            isCorrect: options[i] === correctAnswer
        });
    }
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
    // Debug toggle (D key)
    if (key === 'd' || key === 'D') {
        if (gameState === 'debug') {
            gameState = 'waiting'; // Return to waiting screen
            calibrationMode = false; // Exit calibration mode
        } else {
            gameState = 'debug'; // Enter debug mode
        }
        return;
    }

    // Calibration controls (only in debug mode)
    if (gameState === 'debug') {
        if (key === 'c' || key === 'C') {
            // Start calibration mode
            calibrationMode = true;
            currentCharIndex = 0;
            waitingForTopLeft = true;
            charPositions = [];
            tempTopLeft = null;
            return;
        }

        if (calibrationMode) {
            if (key === 'r' || key === 'R') {
                // Reset current character
                if (currentCharIndex < charPositions.length) {
                    charPositions[currentCharIndex] = {};
                }
                waitingForTopLeft = true;
                tempTopLeft = null;
                return;
            }

            if (key === 'n' || key === 'N') {
                // Skip to next character
                nextCharacter();
                return;
            }

            if (key === 'p' || key === 'P') {
                // Go back to previous character
                if (currentCharIndex > 0) {
                    currentCharIndex--;
                    waitingForTopLeft = true;
                    tempTopLeft = null;
                }
                return;
            }

            if (key === 'f' || key === 'F') {
                // Finish and copy to clipboard
                copyPositionsToClipboard();
                return;
            }
        }
    }

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

// ===== MOUSE INPUT =====
function mousePressed() {
    // Handle answer button clicks
    if (gameState === 'playing' && (isMobile || isTouch) && answerButtons.length > 0) {
        for (let button of answerButtons) {
            if (mouseX >= button.x && mouseX <= button.x + button.width &&
                mouseY >= button.y && mouseY <= button.y + button.height) {

                // Button clicked - check if correct
                if (button.isCorrect) {
                    score++;
                    showFeedback('correct');
                } else {
                    loseLife();
                    showFeedback('incorrect');
                }
                return; // Exit early, don't process other clicks
            }
        }
    }

    if (gameState === 'debug' && calibrationMode && spriteSheet) {
        // Convert mouse position to sprite sheet coordinates
        let relativeX = mouseX - spriteX;
        let relativeY = mouseY - spriteY;

        // Check if click is within sprite bounds
        if (relativeX >= 0 && relativeY >= 0 &&
            relativeX <= spriteSheet.width * displayScale &&
            relativeY <= spriteSheet.height * displayScale) {

            // Convert to sprite sheet pixel coordinates
            let spritePixelX = Math.floor(relativeX / displayScale);
            let spritePixelY = Math.floor(relativeY / displayScale);

            if (waitingForTopLeft) {
                // Store top-left position
                tempTopLeft = { x: spritePixelX, y: spritePixelY };
                waitingForTopLeft = false;
            } else {
                // Store bottom-right position and complete the character
                if (tempTopLeft) {
                    // Ensure we have a valid rectangle (bottom-right should be > top-left)
                    let x1 = Math.min(tempTopLeft.x, spritePixelX);
                    let y1 = Math.min(tempTopLeft.y, spritePixelY);
                    let x2 = Math.max(tempTopLeft.x, spritePixelX);
                    let y2 = Math.max(tempTopLeft.y, spritePixelY);

                    // Store the character position
                    if (!charPositions[currentCharIndex]) {
                        charPositions[currentCharIndex] = {};
                    }
                    charPositions[currentCharIndex] = { x1, y1, x2, y2 };

                    // Move to next character
                    nextCharacter();
                }
            }
        }
    }
}

// ===== TOUCH INPUT (TABLET SUPPORT) =====
function touchStarted() {
    // Handle answer button touches
    if (gameState === 'playing' && (isMobile || isTouch) && answerButtons.length > 0) {
        let touchX = touches.length > 0 ? touches[0].x : mouseX;
        let touchY = touches.length > 0 ? touches[0].y : mouseY;

        for (let button of answerButtons) {
            if (touchX >= button.x && touchX <= button.x + button.width &&
                touchY >= button.y && touchY <= button.y + button.height) {

                // Button touched - check if correct
                if (button.isCorrect) {
                    score++;
                    showFeedback('correct');
                } else {
                    loseLife();
                    showFeedback('incorrect');
                }
                return false; // Prevent default and exit early
            }
        }
    }

    // Handle touch for starting the game (same as spacebar)
    if (gameState === 'waiting' || gameState === 'gameOver') {
        startGame();
        return false; // Prevent default touch behavior
    }

    // Handle touch for debug mode calibration
    if (gameState === 'debug' && calibrationMode && spriteSheet) {
        // Use touch coordinates instead of mouse coordinates
        let touchX = touches.length > 0 ? touches[0].x : touchX;
        let touchY = touches.length > 0 ? touches[0].y : touchY;

        // Convert touch position to sprite sheet coordinates
        let relativeX = touchX - spriteX;
        let relativeY = touchY - spriteY;

        // Check if touch is within sprite bounds
        if (relativeX >= 0 && relativeY >= 0 &&
            relativeX <= spriteSheet.width * displayScale &&
            relativeY <= spriteSheet.height * displayScale) {

            // Convert to sprite sheet pixel coordinates
            let spritePixelX = Math.floor(relativeX / displayScale);
            let spritePixelY = Math.floor(relativeY / displayScale);

            if (waitingForTopLeft) {
                // Store top-left position
                tempTopLeft = { x: spritePixelX, y: spritePixelY };
                waitingForTopLeft = false;
            } else {
                // Store bottom-right position and complete the character
                if (tempTopLeft) {
                    // Ensure we have a valid rectangle
                    let x1 = Math.min(tempTopLeft.x, spritePixelX);
                    let y1 = Math.min(tempTopLeft.y, spritePixelY);
                    let x2 = Math.max(tempTopLeft.x, spritePixelX);
                    let y2 = Math.max(tempTopLeft.y, spritePixelY);

                    // Store the character position
                    if (!charPositions[currentCharIndex]) {
                        charPositions[currentCharIndex] = {};
                    }
                    charPositions[currentCharIndex] = { x1, y1, x2, y2 };

                    // Move to next character
                    nextCharacter();
                }
            }
        }
        return false; // Prevent default touch behavior
    }

    // Skip feedback early with touch (same as spacebar)
    if (gameState === 'feedback') {
        feedbackTimer = 0;
        return false; // Prevent default touch behavior
    }

    // Prevent default touch behavior to avoid scrolling, etc.
    return false;
}

// ===== CALIBRATION HELPERS =====
function nextCharacter() {
    currentCharIndex++;
    waitingForTopLeft = true;
    tempTopLeft = null;

    // Skip to next if we've done all characters
    if (currentCharIndex >= chars.length) {
        // Calibration complete - could auto-copy here
        console.log('Calibration complete!');
    }
}

function copyPositionsToClipboard() {
    // Create the array in the format needed for the code
    let positionsArray = "let charPositions = [";

    for (let i = 0; i < chars.length; i++) {
        if (i > 0) positionsArray += ",";
        positionsArray += "\n  ";

        if (charPositions[i] && charPositions[i].x1 !== undefined) {
            let pos = charPositions[i];
            positionsArray += `{ char: '${chars[i]}', x: ${pos.x1}, y: ${pos.y1}, w: ${pos.x2 - pos.x1}, h: ${pos.y2 - pos.y1} }`;
        } else {
            // Missing position - use placeholder
            positionsArray += `{ char: '${chars[i]}', x: 0, y: 0, w: 32, h: 32 } // TODO: Define position`;
        }
    }

    positionsArray += "\n];";

    // Copy to clipboard using modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(positionsArray).then(() => {
            console.log('Character positions copied to clipboard!');
            alert('Character positions copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            console.log('Positions array:', positionsArray);
            alert('Failed to copy to clipboard. Check console for output.');
        });
    } else {
        // Fallback - just log to console
        console.log('Clipboard not available. Here are the positions:');
        console.log(positionsArray);
        alert('Clipboard not available. Check console for character positions.');
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
