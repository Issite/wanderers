import {
  MAP_HEIGHT,
  MAP_WIDTH,
  MAX_MOVE_SPEED,
  MEADOW_BASE_SIZE,
  MEADOW_SIZE_FACTOR,
  TEAM_COLORS
} from "../shared/constants.js";

let tribeID = null;
let localTribe = null;
let lastTotemUpdateTime = 0;
let ws = null;
let canvas = null;
let ctx = null;
let gameState = { tribes: [], updatesPerSecond: 0 };
let mouseMoveData = null;  

const TRIBESMAN_SIZE = 15;
const TOTEM_SIZE = 25;
const TRIBESMAN_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
const MINIMAP_MEADOW_SIZE_MULTIPLIER = 1.5;
const MIN_MINIMAP_TRIBE_SIZE = 5;
const MINIMAP_TRIBE_SIZE_MULTIPLIER = 5;
const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 200;
const MINIMAP_MARGIN = 20;

let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Camera position (follows player's tribe actual position)
let cameraX = 0;
let cameraY = 0;

// FPS tracking
let frameCount = 0;
let lastFpsTime = Date.now();
let currentFps = 0;

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
  if (tribeID === null || !localTribe || !localTribe.resources) {
    // console.log('Not in game yet, ignoring mouse down');
    return;
  };
  
  let shortcut = false;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;


  const resourceTypes = Object.keys(localTribe.resources);

  let resourceX = (canvas.width / 2) - ((resourceTypes.length * 100) / 2);
  const resourceY = 50;
  resourceTypes.forEach(type => {
    if (mouseX >= resourceX && mouseX <= resourceX + 90 && mouseY >= resourceY - 20 && mouseY <= resourceY) {
      // Clicked on resource box; send drop resource request to server
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'dropResource',
          resourceType: type
        }));

        shortcut = true; // Prevent further processing of this click
      }
    }

    resourceX += 100;
  });

  if (shortcut) {
    return;
  }
  

  // Convert screen coordinates to world coordinates
  const worldX = mouseX + cameraX;
  const worldY = mouseY + cameraY;
  
  const totem = localTribe.totem;
  const distance = Math.hypot(worldX - totem.x, worldY - totem.y);
  
  if (distance < TOTEM_SIZE) {
    console.log('Started dragging totem');
    isDragging = true;
    dragOffset.x = worldX - totem.x;
    dragOffset.y = worldY - totem.y;
    canvas.style.cursor = 'grabbing';

    shortcut = true; // Prevent further processing of this click, but we can just
    return; //here since dragging will handle the rest
  }

  if (gameState.entities) {
    gameState.entities.forEach(entity => {
      if (entity.entityType === 'mushroom') {
        const mushroomScreenX = entity.x - cameraX;
        const mushroomScreenY = entity.y - cameraY;
        const mushroomDistance = Math.hypot(mouseX - mushroomScreenX, mouseY - mushroomScreenY);

        if (mushroomDistance < 10) {
          targetMushroom(entity.id);

          shortcut = true; // Prevent further processing of this click
        }
      }
    });

    if (shortcut) {
      return;
    }
  }
}

function handleCanvasMouseMove(e) {
    mouseMoveData = e;
}

function updateTotemPos(e) {
  if (!isDragging || tribeID === null || !e) return ;
  
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

function gameOver() {
  tribeID = null;
  localTribe = null;
  showError('Game over! You have been eliminated.');
  menuScreen.classList.add('active');
  gameScreen.classList.remove('active');
}

function targetMushroom(mushroomId) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'targetMushroom',
      mushroomId: mushroomId
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
      console.log(`Joined game with tribe ID: ${tribeID}, name: ${localTribe.name}`);
      cameraX = localTribe.x - canvas.width / 2;
      cameraY = localTribe.y - canvas.height / 2;
      showGameScreen();
    } else if (data.type === 'registered') {
      console.log('Registered with tribe ID:', data.tribeId);
    } else if (data.type === 'gameOver') {
      console.log('Game over for tribe:', data.tribeId);
      gameOver();
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

  updateTotemPos(mouseMoveData);

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

  // Draw minimap
  drawMinimap();

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

function drawMinimap() {
  if (!localTribe || !gameState.entities) {
    return;
  }

  const minimapWidth = MINIMAP_WIDTH;
  const minimapHeight = MINIMAP_HEIGHT;
  const margin = MINIMAP_MARGIN;
  const minimapX = canvas.width - minimapWidth - margin;
  const minimapY = canvas.height - minimapHeight - margin;
  const minimapCenterX = minimapX + minimapWidth / 2;
  const minimapCenterY = minimapY + minimapHeight / 2;
  const minimapRadius = Math.min(minimapWidth, minimapHeight) / 2;
  const scaleX = minimapWidth / MAP_WIDTH;
  const scaleY = minimapHeight / MAP_HEIGHT;
  const meadowScale = Math.min(scaleX, scaleY);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(minimapCenterX, minimapCenterY, minimapRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(minimapCenterX, minimapCenterY, minimapRadius, 0, Math.PI * 2);
  ctx.stroke();

  gameState.entities.forEach(entity => {
    if (entity.entityType === 'meadow') {
      const meadowX = minimapX + entity.x * scaleX;
      const meadowY = minimapY + entity.y * scaleY;
      const meadowRadius = (MEADOW_BASE_SIZE + entity.size) * MINIMAP_MEADOW_SIZE_MULTIPLIER * MEADOW_SIZE_FACTOR * meadowScale;
      ctx.fillStyle = '#0b5f21';
      ctx.beginPath();
      ctx.arc(meadowX, meadowY, meadowRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (entity.entityType === 'tribe') {
      const tribeX = minimapX + entity.x * scaleX;
      const tribeY = minimapY + entity.y * scaleY;
      const tribesmenCount = Array.isArray(entity.tribesmen) ? entity.tribesmen.length : 0;
      const tribeSize = Math.max(MIN_MINIMAP_TRIBE_SIZE, Math.sqrt(tribesmenCount) * MINIMAP_TRIBE_SIZE_MULTIPLIER);
      const isSameTeam = entity.teamId === localTribe.teamId;
      ctx.fillStyle = isSameTeam ? '#00ff66' : '#ff2f2f';
      ctx.fillRect(tribeX - tribeSize / 2, tribeY - tribeSize / 2, tribeSize, tribeSize);
    } else if (entity.entityType === 'crate') {
      const crateX = minimapX + entity.x * scaleX;
      const crateY = minimapY + entity.y * scaleY;
      ctx.fillStyle = '#d5ab00ff';
      ctx.fillRect(crateX - 3, crateY - 3, 6, 6);
    }
  });
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
  if (entity.entityType === 'tribe') {
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
      ctx.fillStyle = TEAM_COLORS[tribe.teamId] || '#666';
      ctx.beginPath();
      ctx.arc(localTribe.totem.x - cameraX, localTribe.totem.y - cameraY, TOTEM_SIZE, 0, Math.PI * 2);
      ctx.fill();
    } else if (!(tribe.teamId === 0)) { // Don't draw barbarian totems
      ctx.fillStyle = TEAM_COLORS[tribe.teamId] || '#666';
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
      ctx.fillStyle = TEAM_COLORS[tribe.teamId] || '#666';
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
  } else if (entity.entityType === 'meadow') {
    const meadow = entity;
    const screenX = meadow.x - cameraX;
    const screenY = meadow.y - cameraY;

    // Only draw if meadow is on screen
    if (
      screenX + 150 < 0 ||
      screenX - 150 > canvas.width ||
      screenY + 150 < 0 ||
      screenY - 150 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = `rgba(100, ${155 + meadow.moisture * 5}, ${100 + meadow.moisture * 2.5})`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, (MEADOW_BASE_SIZE + meadow.size) * MEADOW_SIZE_FACTOR, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.entityType === 'mushroom') {
    const mushroom = entity;
    const screenX = mushroom.x - cameraX;
    const screenY = mushroom.y - cameraY;

    // Only draw if mushroom is on screen
    if (
      screenX + 20 < 0 ||
      screenX - 20 > canvas.width ||
      screenY + 20 < 0 ||
      screenY - 20 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = `hsl(${mushroom.type * 45}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.entityType === 'grass') {
    const grass = entity;
    const screenX = grass.x - cameraX;
    const screenY = grass.y - cameraY;

    // Only draw if grass is on screen
    if (
      screenX + 25 < 0 ||
      screenX - 25 > canvas.width ||
      screenY + 25 < 0 ||
      screenY - 25 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = '#55aa55';
    ctx.fillRect(screenX - 5, screenY - 5, 40, 25);
  } else if (entity.entityType === 'rock') {
    const rock = entity;
    const screenX = rock.x - cameraX;
    const screenY = rock.y - cameraY;

    // Only draw if rock is on screen
    if (
      screenX + 30 < 0 ||
      screenX - 30 > canvas.width ||
      screenY + 30 < 0 ||
      screenY - 30 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = 'hsla(30, 10%,' + (40 + rock.health) + '%, 1.00)';
    ctx.fillRect(screenX - rock.size * 5, screenY - rock.size * 5, rock.size * 25, rock.size * 35);
  } else if (entity.entityType === 'tree') {
    const tree = entity;
    const screenX = tree.x - cameraX;
    const screenY = tree.y - cameraY;

    // Only draw if tree is on screen
    if (
      screenX + 30 < 0 ||
      screenX - 30 > canvas.width ||
      screenY + 30 < 0 ||
      screenY - 30 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = 'hsla(30, 50%,' + (10 + tree.health * 5) + '%, 1.00)';
    ctx.fillRect(screenX - 10, screenY - 10, 30, 70);
    
    ctx.fillStyle = 'hsla(329, 100%, 40%, 1.00)';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 45, 50, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.entityType === 'post') {
    const post = entity;
    const screenX = post.x - cameraX;
    const screenY = post.y - cameraY;

    // Only draw if post is on screen
    if (
      screenX + 30 < 0 ||
      screenX - 30 > canvas.width ||
      screenY + 30 < 0 ||
      screenY - 30 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = ['#ff4444', '#44ff44', '#4444ff'][post.type % 3];
    ctx.fillRect(screenX - 35, screenY - 25, 70, 50);
  } else if (entity.entityType === 'resource') {
    const resource = entity;
    const screenX = resource.x - cameraX;
    const screenY = resource.y - cameraY;

    // Only draw if resource is on screen
    if (
      screenX + 20 < 0 ||
      screenX - 20 > canvas.width ||
      screenY + 20 < 0 ||
      screenY - 20 > canvas.height
    ) {
      return;
    }

    // For now. When art is added won't be nescessary
    const resourceColors = {
      food: '#ff2f2fff',
      wood: '#6e4200ff',
      gold: '#f9ca24',
      water: '#45b7d1'
    };

    const color = resourceColors[resource.resourceType] || '#ccc';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.entityType === 'rabbit') {
    const rabbit = entity;
    const screenX = rabbit.x - cameraX;
    const screenY = rabbit.y - cameraY;

    // Only draw if rabbit is on screen
    if (
      screenX + 20 < 0 ||
      screenX - 20 > canvas.width ||
      screenY + 20 < 0 ||
      screenY - 20 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = '#fff1e4ff';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (entity.entityType === 'cloud') {
    const cloud = entity;
    const screenX = cloud.x - cameraX;
    const screenY = cloud.y - cameraY;

    // Only draw if cloud is on screen
    if (
      screenX + 50 < 0 ||
      screenX - 50 > canvas.width ||
      screenY + 50 < 0 ||
      screenY - 50 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 40, 0, Math.PI * 2);
    ctx.fill();

    if (cloud.isRaining) {
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)';
      ctx.lineWidth = 2;
      for (let i = -30; i <= 30; i += 10) {
        ctx.beginPath();
        ctx.moveTo(screenX + i, screenY + 40);
        ctx.lineTo(screenX + i, screenY + 60);
        ctx.stroke();
      }
    }
  } else if (entity.entityType === 'crate') {
    const crate = entity;
    const screenX = crate.x - cameraX;
    const screenY = crate.y - cameraY;

    // Only draw if crate is on screen
    if (
      screenX + 20 < 0 ||
      screenX - 20 > canvas.width ||
      screenY + 20 < 0 ||
      screenY - 20 > canvas.height
    ) {
      return;
    }

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(screenX - 15, screenY - 15, 30, 30);
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
