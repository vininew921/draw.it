class Room{
    constructor(maxPlayers, roomCode) {
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.roomCode = roomCode;
        this.mostRecentPlayer = undefined;
    }

    addPlayer(player) {
        this.players.push(player);
        this.mostRecentPlayer = player;
    }
}

module.exports = Room;