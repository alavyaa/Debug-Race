// --- Avatar Options ---
export const AVATAR_OPTIONS = [
    { id: 'avatar1', icon: '🏎️', name: 'Racer' },
    { id: 'avatar2', icon: '💨', name: 'Speedster' },
    { id: 'avatar3', icon: '🚀', name: 'Rocket' },
    { id: 'avatar4', icon: '🏁', name: 'Chequered' },
    { id: 'avatar5', icon: '🔥', name: 'Blaze' },
    { id: 'avatar6', icon: '⚡', name: 'Shock' },
    { id: 'avatar7', icon: '⚙️', name: 'Gearhead' },
    { id: 'avatar8', icon: '🤖', name: 'Bot' },
];

// --- Player Colors (used on race track and leaderboard) ---
export const PLAYER_COLORS = ['#00ff88', '#00aaff', '#ff6b6b', '#ffdd00'];

// --- Level Definitions ---
export const LEVELS = {
    1: { name: 'Rookie', laps: 2, difficulty: 1 },
    2: { name: 'Intermediate', laps: 3, difficulty: 2 },
    3: { name: 'Pro', laps: 4, difficulty: 3 },
    4: { name: 'Expert', laps: 5, difficulty: 4 },
    5: { name: 'Godlike', laps: 6, difficulty: 5 }
};

// You can add other common constants here, e.g., Socket Events
export const SOCKET_EVENTS = {
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  PLAYER_CONNECTED: 'playerConnected', // For players re-connecting or joining the first time
  PLAYER_READY: 'playerReady',
  PLAYER_READY_UPDATE: 'playerReadyUpdate', // Server broadcast
  RACE_START_REQUEST: 'requestRaceStart', // Client to server
  RACE_STARTING: 'raceStarting', // Server broadcast (countdown initiated)
  ROOM_UPDATE: 'roomUpdate', // Server broadcast (full room state)
  LEAVE_ROOM: 'leaveRoom',
  ERROR: 'error'
  // ... more events as the game progresses
};