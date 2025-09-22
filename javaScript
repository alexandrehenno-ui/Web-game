// ====== Sniper Shooting Game Logic ======

const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const playerNameInput = document.getElementById('player-name');
const singlePlayerBtn = document.getElementById('single-player-btn');
const multiPlayerBtn = document.getElementById('multi-player-btn');
const friendNameContainer = document.getElementById('friend-name-container');
const friendNameInput = document.getElementById('friend-name');
const startMultiBtn = document.getElementById('start-multi-btn');
const playerInfo = document.getElementById('player-info');
const scoreSpan = document.getElementById('score');
const timerSpan = document.getElementById('timer');
const turnInfo = document.getElementById('turn-info');
const logoutBtn = document.getElementById('logout-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const endMessage = document.getElementById('end-message');
const playAgainBtn = document.getElementById('play-again-btn');
const exitBtn = document.getElementById('exit-btn');
const leaderboardList = document.getElementById('leaderboard');

let mode = "single";
let playerName = "";
let friendName = "";
let score = 0;
let friendScore = 0;
let turn = 1; // 1: player, 2: friend
let timer = 30;
let timerInterval;
let targets = [];
let shot = false;
let gameActive = false;

// ----------- Login Logic -----------
singlePlayerBtn.onclick = () => {
    if (playerNameInput.value.trim() === "") {
        playerNameInput.style.border = "2px solid red";
        return;
    }
    playerName = playerNameInput.value.trim();
    mode = "single";
    startGame();
};

multiPlayerBtn.onclick = () => {
    if (playerNameInput.value.trim() === "") {
        playerNameInput.style.border = "2px solid red";
        return;
    }
    friendNameContainer.style.display = "block";
};

startMultiBtn.onclick = () => {
    if (friendNameInput.value.trim() === "") {
        friendNameInput.style.border = "2px solid red";
        return;
    }
    playerName = playerNameInput.value.trim();
    friendName = friendNameInput.value.trim();
    mode = "multi";
    startGame();
};

// ----------- Game Logic -----------

function startGame() {
    loginScreen.style.display = "none";
    endScreen.style.display = "none";
    gameScreen.style.display = "flex";
    score = 0;
    friendScore = 0;
    timer = 30;
    turn = 1;
    gameActive = true;
    updateHeader();
    generateTargets();
    drawGame();
    timerInterval = setInterval(gameTick, 1000);
    shot = false;
    turnInfo.textContent = mode === "multi" ? `Turn: ${turn === 1 ? playerName : friendName}` : "";
}

function updateHeader() {
    playerInfo.textContent = mode === "multi" ?
        `${playerName} vs ${friendName}` : `Player: ${playerName}`;
    scoreSpan.textContent = mode === "multi" ?
        `${playerName}: ${score} | ${friendName}: ${friendScore}` :
        `Score: ${score}`;
    timerSpan.textContent = `Time: ${timer}`;
}

function gameTick() {
    if (!gameActive) return;
    timer--;
    updateHeader();
    if (timer <= 0) {
        clearInterval(timerInterval);
        if (mode === "multi" && turn === 1) {
            // Switch to friend turn
            turn = 2;
            timer = 30;
            shot = false;
            generateTargets();
            drawGame();
            timerInterval = setInterval(gameTick, 1000);
            turnInfo.textContent = `Turn: ${friendName}`;
        } else {
            gameActive = false;
            showEndScreen();
        }
    }
}

canvas.onclick = function(e) {
    if (!gameActive) return;
    if (shot) return; // one shot per second
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let hit = false;
    for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const dist = Math.sqrt((mx - t.x) ** 2 + (my - t.y) ** 2);
        if (dist < t.r) {
            hit = true;
            // Remove target, give score
            targets.splice(i, 1);
            if (mode === "multi" && turn === 2) {
                friendScore += t.points;
            } else {
                score += t.points;
            }
            drawShot(mx, my, true);
            break;
        }
    }
    if (!hit) {
        drawShot(mx, my, false);
    }
    shot = true;
    setTimeout(() => {
        shot = false;
        drawGame();
    }, 250);
    updateHeader();
    // Add new target if hit
    if (hit) {
        addTarget();
    }
};

function drawShot(x, y, hit) {
    drawGame();
    ctx.save();
    ctx.strokeStyle = hit ? "#0f0" : "#f00";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
}

function generateTargets() {
    targets = [];
    for (let i = 0; i < 5; i++) addTarget();
}

function addTarget() {
    // Target radius 30, random position, random points (1-5)
    let r = 30;
    let x = Math.random() * (canvas.width - 2 * r) + r;
    let y = Math.random() * (canvas.height - 2 * r) + r;
    let points = Math.floor(Math.random() * 5) + 1;
    targets.push({ x, y, r, points });
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background crosshair
    ctx.save();
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.restore();

    // Draw targets
    for (const t of targets) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, 2 * Math.PI);
        ctx.fillStyle = "#0a0";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t.points, t.x, t.y);
        ctx.restore();
    }
}

// ----------- End Screen / Leaderboard -----------
function showEndScreen() {
    gameScreen.style.display = "none";
    endScreen.style.display = "flex";
    let msg = "";
    if (mode === "single") {
        msg = `${playerName}, your score: ${score}`;
    } else {
        msg = `${playerName}: ${score} vs ${friendName}: ${friendScore}<br>`;
        if (score > friendScore) msg += `${playerName} wins!`;
        else if (score < friendScore) msg += `${friendName} wins!`;
        else msg += "It's a tie!";
    }
    endMessage.innerHTML = msg;
    saveLeaderboard();
    showLeaderboard();
}

function saveLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem("sniper-leaderboard") || "[]");
    if (mode === "single") {
        leaderboard.push({ name: playerName, score });
    } else {
        leaderboard.push({ name: playerName, score });
        leaderboard.push({ name: friendName, score: friendScore });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("sniper-leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem("sniper-leaderboard") || "[]");
    leaderboardList.innerHTML = "";
    leaderboard.forEach((entry, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${entry.name}: ${entry.score}`;
        leaderboardList.appendChild(li);
    });
}

// ----------- UI Controls -----------
playAgainBtn.onclick = () => {
    loginScreen.style.display = "none";
    endScreen.style.display = "none";
    gameScreen.style.display = "flex";
    score = 0;
    friendScore = 0;
    timer = 30;
    turn = 1;
    gameActive = true;
    generateTargets();
    drawGame();
    updateHeader();
    timerInterval = setInterval(gameTick, 1000);
    shot = false;
    turnInfo.textContent = mode === "multi" ? `Turn: ${turn === 1 ? playerName : friendName}` : "";
};

exitBtn.onclick = () => {
    gameScreen.style.display = "none";
    endScreen.style.display = "none";
    loginScreen.style.display = "flex";
    playerNameInput.value = "";
    friendNameInput.value = "";
    friendNameContainer.style.display = "none";
};

logoutBtn.onclick = () => {
    clearInterval(timerInterval);
    gameScreen.style.display = "none";
    endScreen.style.display = "none";
    loginScreen.style.display = "flex";
    playerNameInput.value = "";
    friendNameInput.value = "";
    friendNameContainer.style.display = "none";
};
