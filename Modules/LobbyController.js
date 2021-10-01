const Room = require("./Room.js");

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

    createRoom(socket, player) {
        var currentRoom = this.getRoomByCode(player.roomCode);
        if (!currentRoom) {
            currentRoom = new Room(8, player.roomCode);
            currentRoom.addPlayer(player);
            this.addRoom(currentRoom);
            socket.join(currentRoom.roomCode);
            socket.emit("joinComplete", currentRoom);
        }
        else {
            socket.emit("joinFailed");
        }
    }

    joinRoom(io, socket, player) {
        var currentRoom = this.getRoomByCode(player.roomCode);
        if (currentRoom) {
            if (currentRoom.players.length >= currentRoom.maxPlayers) {
                socket.emit("joinFailedMaxPlayers");
                return;
            }
            currentRoom.addPlayer(player);
            io.to(currentRoom.roomCode).emit("playerJoined", currentRoom);
            socket.join(currentRoom.roomCode);
            socket.emit("joinComplete", currentRoom);
        }
        else {
            socket.emit("joinFailed");
        }
    }
}

module.exports = LobbyController;