# Wanderers

A remake of the once-popular, now-defunct browser game wanderers.io.

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

## Next Steps

Next I would like to work on:
- ~~Resources~~ Done! (partially)
- **Entity classes**
- Minimap
- Server logic generating a new map
- A task system for the tribesmen, activated by proximity
- ~~art~~(never)