class Room{
    constructor(maxPlayers, roomCode) {
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.roomCode = roomCode;
        this.mostRecentPlayer = undefined;
        this.everyoneReady = false;
        this.gameStarted = false;
    }

    addPlayer(player) {
        this.players.push(player);
        this.mostRecentPlayer = player;
    }

    checkEveryoneReady() {
        for (let i = 0; i < this.players.length; i++){
            if (!this.players[i].ready) {
                this.everyoneReady = false;
                return;
            }
        }
        
        this.everyoneReady = true;
    }
}

module.exports = Room;