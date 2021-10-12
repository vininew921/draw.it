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
        player.socketId = socket.id;
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
        player.socketId = socket.id;
        var currentRoom = this.getRoomByCode(player.roomCode);
        if (currentRoom) {
            if (currentRoom.players.length >= currentRoom.maxPlayers) {
                socket.emit("joinFailedMaxPlayers");
                return;
            }
            currentRoom.addPlayer(player);
            io.to(currentRoom.roomCode).emit("playersChanged", currentRoom);
            socket.join(currentRoom.roomCode);
            socket.emit("joinComplete", currentRoom);
        }
        else {
            socket.emit("joinFailed");
        }
    }

    drawing(io, player, data){
        var currentRoom = this.getRoomByCode(player.roomCode);
        io.to(currentRoom.roomCode).emit("playerDrawing", data);
    }

    changePlayerReady(io, socket, player) {
        const iterator = socket.rooms.values();
        var roomCode = iterator.next()?.value;
        while (roomCode) {
            var currentRoom = this.getRoomByCode(roomCode);
            if (currentRoom) {
                for (let i = 0; i < currentRoom.players.length; i++){
                    if (currentRoom.players[i].nickname == player.nickname) {
                        currentRoom.players[i].ready = player.ready;
                        break;
                    }
                }

                io.to(currentRoom.roomCode).emit("playersChanged", currentRoom);
            }
            roomCode = iterator.next()?.value;
        }
    }

    removePlayerFromRooms(io, socket) {
        const iterator = socket.rooms.values();
        var roomCode = iterator.next()?.value;
        while (roomCode) {
            console.log("Removing " + socket.id + " from room " + roomCode);
            var currentRoom = this.getRoomByCode(roomCode);
            if (currentRoom) {
                var newPlayersList = [];
                for (let i = 0; i < currentRoom.players.length; i++) {
                    if (currentRoom.players[i].socketId != socket.id) {
                        newPlayersList.push(currentRoom.players[i]);
                    }
                }

                currentRoom.players = newPlayersList;
                io.to(currentRoom.roomCode).emit("playersChanged", currentRoom);
            }
            roomCode = iterator.next()?.value;
        }
    }
}

module.exports = LobbyController;