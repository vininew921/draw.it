class Room{
    constructor(maxPlayers, roomCode) {
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.roomCode = roomCode;
    }

    addPlayer(player) {
        this.player.push(player);
    }
}

module.exports = Room;