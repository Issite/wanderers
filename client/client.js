let tribeID = null;
let localTribe = null;
let lastTotemUpdateTime = 0;
let ws = null;
let canvas = null;
let ctx = null;
let gameState = { tribes: [], updatesPerSecond: 0 };

const MAP_WIDTH = 32768;
const MAP_HEIGHT = 32768;
const TRIBESMAN_SIZE = 15;
const TOTEM_SIZE = 25;
const TRIBESMAN_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];

let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Camera position (follows player's tribe actual position)
let cameraX = 0;
let cameraY = 0;
let targetCameraX = 0;
let targetCameraY = 0;
const CAMERA_SPEED = 500; // pixels per second

// FPS tracking
let frameCount = 0;
let lastFpsTime = Date.now();
let currentFps = 0;
let lastFrameTime = Date.now();

// DOM Elements
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const joinForm = document.getElementById('join-form');
const errorMessage = document.getElementById('error-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  joinForm.addEventListener('submit', handleJoinGame);
  connectWebSocket();
  setupCanvas();
});

function setupCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  
  // Set canvas size to window size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Mouse event handlers for dragging
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseup', handleCanvasMouseUp);
  canvas.addEventListener('mouseleave', handleCanvasMouseUp);
}

function handleCanvasMouseDown(e) {
  if (!tribeID) return;
  
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Convert screen coordinates to world coordinates
  const worldX = mouseX + cameraX;
  const worldY = mouseY + cameraY;
  
  const totem = localTribe.totem;
  const distance = Math.hypot(worldX - totem.x, worldY - totem.y);
  
  if (distance < TOTEM_SIZE) {
    isDragging = true;
    dragOffset.x = worldX - totem.x;
    dragOffset.y = worldY - totem.y;
    canvas.style.cursor = 'grabbing';
  }
}

function handleCanvasMouseMove(e) {
  if (!isDragging || !tribeID) return;
  
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // Convert screen coordinates to world coordinates
  const worldX = mouseX + cameraX;
  const worldY = mouseY + cameraY;
  
  // Update totem position
  localTribe.totem.x = worldX - dragOffset.x;
  localTribe.totem.y = worldY - dragOffset.y;
  
  // Send update to server (max 24 updates per second)
  const now = Date.now();
  if (!lastTotemUpdateTime || now - lastTotemUpdateTime >= 1000 / 24) {
    lastTotemUpdateTime = now;
    sendTotemUpdate();
  }
}

function handleCanvasMouseUp() {
  sendTotemUpdate();
  isDragging = false;
  canvas.style.cursor = 'default';
}

function sendTotemUpdate() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'updateTotem',
      totem: {
        x: localTribe.totem.x,
        y: localTribe.totem.y
      }
    }));
  }
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
    clearError();
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'gameState') {
      gameState.entities = data.entities;
      localTribe = gameState.entities.find(t => t.id === tribeID);
      gameState.updatesPerSecond = data.updatesPerSecond || 0;
    } else if (data.type === 'gameJoined') {
      localTribe = data.tribe;
      tribeID = data.tribe.id;
      cameraX = localTribe.x - canvas.width / 2;
      cameraY = localTribe.y - canvas.height / 2;
      targetCameraX = cameraX;
      targetCameraY = cameraY;
      showGameScreen();
    } else if (data.type === 'registered') {
      console.log('Registered with tribe ID:', data.tribeId);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    showError('Server connection error. Attempting to reconnect...');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    if (localTribe) {
      showError('Connection to server lost. Reconnecting in 3 seconds...');
    }
    setTimeout(connectWebSocket, 3000);
  };
}

async function handleJoinGame(event) {
  event.preventDefault();
  clearError();

  const playerName = document.getElementById('tribe-name').value.trim();
  const teamCode = document.getElementById('team-code').value.trim();

  // Allow empty name - server will auto-generate it
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    showError('Not connected to server. Please wait...');
    return;
  }

  try {
    // Send join game message via WebSocket
    ws.send(JSON.stringify({
      type: 'joinGame',
      playerName: playerName || null,
      teamCode: teamCode || null
    }));
  } catch (error) {
    console.error('Error joining game:', error);
    showError(error.message);
  }
}

function showGameScreen() {
  menuScreen.classList.remove('active');
  gameScreen.classList.add('active');

  // Update debug info
  document.getElementById('debug-tribe-name').textContent = localTribe.name;
  document.getElementById('debug-tribe-id').textContent = localTribe.id;
  document.getElementById('debug-team').textContent = localTribe.teamCode;

  // Start rendering
  render();
}

function render() {
  if (!localTribe) {
    requestAnimationFrame(render);
    return;
  }

  cameraX = localTribe.x - canvas.width / 2;
  cameraY = localTribe.y - canvas.height / 2;

  // Clamp camera to map bounds
  cameraX = Math.max(0, Math.min(MAP_WIDTH - canvas.width, cameraX));
  cameraY = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, cameraY));

  // Clear canvas
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid (optional visual aid)
  drawGrid();

  // Draw all tribes
  gameState.entities.forEach(entity => {
    drawEntity(entity);
  });

  // Draw resources
  drawResources();

  // Draw debug info
  drawDebugInfo();

  // Update FPS counter
  frameCount++;
  const fpsCheckTime = Date.now();
  if (fpsCheckTime - lastFpsTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    lastFpsTime = fpsCheckTime;
  }

  requestAnimationFrame(render);
}

function drawDebugInfo() {
  ctx.fillStyle = '#ccc';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  
  const debugLines = [
    `FPS: ${currentFps}`,
    `Updates/sec: ${gameState.updatesPerSecond}`,
    `Tribes: ${gameState.tribes.length}`,
    `Your pos: (${Math.round(localTribe.x)}, ${Math.round(localTribe.y)})`
  ];
  
  let y = 30;
  debugLines.forEach(line => {
    ctx.textAlign = 'right';
    ctx.fillText(line, canvas.width - 15, y);
    ctx.textAlign = 'left';
    y += 20;
  });
}

function drawGrid() {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  const gridSize = 100;

  // Calculate which grid lines are visible
  const startX = Math.floor(cameraX / gridSize) * gridSize;
  const startY = Math.floor(cameraY / gridSize) * gridSize;
  const endX = startX + canvas.width + gridSize;
  const endY = startY + canvas.height + gridSize;

  // Draw vertical lines
  for (let x = startX; x < endX; x += gridSize) {
    const screenX = x - cameraX;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = startY; y < endY; y += gridSize) {
    const screenY = y - cameraY;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvas.width, screenY);
    ctx.stroke();
  }
}

function drawEntity(entity) {
  if (entity.type == 'tribe') {
    const tribe = entity;
    // Convert world coordinates to screen coordinates
    const screenX = tribe.x - cameraX;
    const screenY = tribe.y - cameraY;

    // Only draw if totem is on screen
    if (
      screenX + TOTEM_SIZE < 0 ||
      screenX - TOTEM_SIZE > canvas.width ||
      screenY + TOTEM_SIZE < 0 ||
      screenY - TOTEM_SIZE > canvas.height
    ) {
      return;
    }

    // Draw totem (circle)
    if (tribe.id === tribeID) {
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(localTribe.totem.x - cameraX, localTribe.totem.y - cameraY, TOTEM_SIZE, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(screenX, screenY, TOTEM_SIZE, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw tribesmen around the tribe's actual position
    tribe.tribesmen.forEach((tribesman, index) => {
      const angle = (index / tribe.tribesmen.length) * Math.PI * 2;
      const distance = TOTEM_SIZE + 40;
      const worldX = tribe.x + Math.cos(angle) * distance;
      const worldY = tribe.y + Math.sin(angle) * distance;

      const screenX = worldX - cameraX;
      const screenY = worldY - cameraY;

      // Only draw if tribesman is on screen
      if (
        screenX + TRIBESMAN_SIZE / 2 < 0 ||
        screenX - TRIBESMAN_SIZE / 2 > canvas.width ||
        screenY + TRIBESMAN_SIZE / 2 < 0 ||
        screenY - TRIBESMAN_SIZE / 2 > canvas.height
      ) {
        return;
      }

      // Draw tribesman (square)
      ctx.fillStyle = '#999';
      ctx.fillRect(screenX - TRIBESMAN_SIZE / 2, screenY - TRIBESMAN_SIZE / 2, TRIBESMAN_SIZE, TRIBESMAN_SIZE);

      // Draw health indicator
      ctx.fillStyle = '#444';
      ctx.fillRect(screenX - TRIBESMAN_SIZE / 2, screenY + TRIBESMAN_SIZE / 2 + 5, TRIBESMAN_SIZE, 5);
      
      ctx.fillStyle = '#66ff66';
      const healthWidth = (tribesman.health / 3) * TRIBESMAN_SIZE;
      ctx.fillRect(screenX - TRIBESMAN_SIZE / 2, screenY + TRIBESMAN_SIZE / 2 + 5, healthWidth, 5);

      // Draw colored dot in center to differentiate tribesman type
      const dotColor = TRIBESMAN_COLORS[index % TRIBESMAN_COLORS.length];
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function drawResources() {
  if (!localTribe.resources) {
    return;
  }

  const resourceTypes = Object.keys(localTribe.resources);
  const resourceColors = {
    food: '#ff2f2fff',
    wood: '#6e4200ff',
    gold: '#f9ca24',
    water: '#45b7d1'
  };

  let x = (canvas.width / 2) - ((resourceTypes.length * 100) / 2);
  const y = 50;
  resourceTypes.forEach(type => {
    const color = resourceColors[type] || '#ccc';
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 20, 90, 20);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${type}: ${localTribe.resources[type]}`, x + 40, y - 5);
    
    x += 100;
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.classList.remove('show');
}
