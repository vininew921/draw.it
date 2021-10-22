const Room = require('./Room');

class LobbyController {
  constructor() {
    this.rooms = [];
  }

  addRoom(room) {
    this.rooms.push(room);
  }

  getRoomByCode(roomCode) {
    for (let i = 0; i < this.rooms.length; i++) {
      if (this.rooms[i].roomCode === roomCode) {
        return this.rooms[i];
      }
    }
    return undefined;
  }

  createRoom(socket, player) {
    player.socketId = socket.id;
    let currentRoom = this.getRoomByCode(player.roomCode);
    if (!currentRoom) {
      currentRoom = new Room(8, player.roomCode);
      currentRoom.addPlayer(player);
      this.addRoom(currentRoom);
      socket.join(currentRoom.roomCode);
      socket.emit('joinComplete', currentRoom);
    } else {
      socket.emit('joinFailed');
    }
  }

  joinRoom(io, socket, player) {
    player.socketId = socket.id;
    const currentRoom = this.getRoomByCode(player.roomCode);
    if (currentRoom && !currentRoom.gameStarted) {
      if (currentRoom.players.length >= currentRoom.maxPlayers) {
        socket.emit('joinFailedMaxPlayers');
        return;
      }

      currentRoom.addPlayer(player);
      currentRoom.everyoneReady = false;
      io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
      socket.join(currentRoom.roomCode);
      socket.emit('joinComplete', currentRoom);
    } else {
      socket.emit('joinFailed');
    }
  }

  drawing(io, player, data) {
    const currentRoom = this.getRoomByCode(player.roomCode);
    io.to(currentRoom.roomCode).emit('playerDrawing', data);
  }

  changePlayerReady(io, socket, player) {
    const iterator = socket.rooms.values();
    let roomCode = iterator.next()?.value;
    while (roomCode) {
      const currentRoom = this.getRoomByCode(roomCode);
      if (currentRoom) {
        for (let i = 0; i < currentRoom.players.length; i++) {
          if (currentRoom.players[i].nickname === player.nickname) {
            currentRoom.players[i].ready = player.ready;
            break;
          }
        }
        currentRoom.checkEveryoneReady();
        io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
      }

      roomCode = iterator.next()?.value;
    }
  }

  removePlayerFromRooms(io, socket) {
    const iterator = socket.rooms.values();
    let roomCode = iterator.next()?.value;
    while (roomCode) {
      const currentRoom = this.getRoomByCode(roomCode);
      if (currentRoom && !currentRoom.gameStarted) {
        const newPlayersList = [];
        for (let i = 0; i < currentRoom.players.length; i++) {
          if (currentRoom.players[i].socketId !== socket.id) {
            newPlayersList.push(currentRoom.players[i]);
          }
        }

        currentRoom.players = newPlayersList;
        currentRoom.checkEveryoneReady();
        io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
      }

      roomCode = iterator.next()?.value;
    }
  }

  joinGame(io, socket, playerId, roomCode) {
    const currentRoom = this.getRoomByCode(roomCode);
    if (currentRoom) {
      for (let i = 0; i < currentRoom.players.length; i++) {
        const currentPlayer = currentRoom.players[i];
        if (currentPlayer.socketId === playerId) {
          socket.join(currentRoom.roomCode);
          currentPlayer.socketId = socket.id;
          currentRoom.gameStarted = true;
          currentRoom.mostRecentPlayer = currentPlayer;
          socket.emit('joinComplete', currentRoom);
          io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
          return;
        }
      }

      socket.emit('joinFailed');
    } else {
      socket.emit('joinFailed');
    }
  }
}

module.exports = LobbyController;
