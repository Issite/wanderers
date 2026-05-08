# Wanderers - Minimal Client-Server Setup

A minimal web-based io game implementation focusing on the "join game" use case.

## Project Structure

```
Wanderers/
├── server/              # Node.js/Express backend
│   ├── src/
│   │   ├── index.js     # Main server entry point
│   │   └── gameLogic.js # Game entities (Tribe, Totem, Tribesman)
│   └── package.json
└── client/              # Frontend
    ├── index.html       # Main page
    ├── styles.css       # Styling
    └── client.js        # Client logic
```

## Features Implemented

### Server (Node.js/Express)
- **REST API**: POST `/api/join-game` to create a new tribe
- **WebSocket Support**: Real-time game state updates
- **Game Logic**: 
  - `Tribesman` class with type (axe/bow) and health
  - `Totem` class spawned at random location for each tribe
  - `Tribe` class with auto-assigned team or custom team code
  - `GameManager` to handle game state

### Client (HTML/JavaScript)
- **Join Form**: Input tribe name and optional team code
- **Game Screen**: Display player's tribe info, tribesmen, and totem location
- **Real-time Updates**: Connected players list using WebSocket
- **Responsive Design**: Works on desktop and mobile

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Navigate to the server directory:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

The server will be running on `http://localhost:3000`

### Usage

1. Open `http://localhost:3000` in your browser
2. Enter your tribe name and optional team code
3. Click "Play" to join the game
4. View your tribe info and see other connected players

## API Endpoints

### POST /api/join-game
Join the game with a tribe.

**Request:**
```json
{
  "playerName": "String",
  "teamCode": "String or null"
}
```

**Response:**
```json
{
  "success": true,
  "tribe": {
    "id": "Number",
    "name": "String",
    "teamCode": "String",
    "tribesmen": [
      { "type": "String", "health": "Number" }
    ],
    "totem": {
      "tribeId": "Number",
      "x": "Number",
      "y": "Number"
    },
    "createdAt": "Date"
  }
}
```

### GET /api/tribes
Get all tribes currently in the game.

**Response:**
```json
{
  "tribes": [
    { "tribe object": "..." }
  ]
}
```

## WebSocket Events

### Client → Server
- `type: "register"` - Register tribe with server

### Server → Client
- `type: "registered"` - Confirmation of registration
- `type: "gameState"` - Current state of all tribes

## Next Steps

To extend this implementation, you could add:
- Player movement and totem dragging
- Meadow clearing mechanic
- Combat system
- Resource management
- Leveling up and upgrades
- Tribesman management

## Technology Stack

- **Backend**: Express.js, WebSocket (ws)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Runtime**: Node.js
