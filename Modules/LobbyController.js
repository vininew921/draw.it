class LobbyController{
    constructor() {
        this.rooms = [];
    }

    addRoom(room) {
        this.rooms.push(room);
    }

    getRoomByCode(roomCode) {
        for (var i = 0; i < this.rooms.length; i++){
            if (this.rooms[i].roomCode == roomCode) {
                return this.rooms[i];
            }
        }

        return undefined;
    }
}

module.exports = LobbyController;