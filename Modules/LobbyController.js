/*
 *  Draw.it
 *  Copyright (C) 2021 Various Authors
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const Room = require('./Room');
const RoomUtils = require('./RoomUtils');

class LobbyController {
  constructor() {
    this.rooms = [];
  }

  /* -------------------------------------------------------------------------*/
  /*                                   Room                                   */
  /* -------------------------------------------------------------------------*/

  /**
   * Adds the given room to the list of rooms.
   *
   * @param {Room} room
   */
  addRoom(room) {
    this.rooms.push(room);
  }

  /**
   * Gets the correspondent room by the given code.
   *
   * @param {string} roomCode
   * @returns {Object} the correspondent room or undefined if not found
   */
  getRoomByCode(roomCode) {
    for (let i = 0; i < this.rooms.length; i++) {
      if (this.rooms[i].roomCode === roomCode) {
        return this.rooms[i];
      }
    }
    return undefined;
  }

  /**
   * Creates a new room with the given player's room code, and adds the player
   * to the created room.
   *
   * @param {Object} socket the user's socket
   * @param {Object} player the new player
   */
  createRoom(socket, player) {
    player.socketId = socket.id; // updates the player's socket id
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

  /**
   * Checks if the room with the given player's room code exists and if so,
   * connects the player to the aforementioned room.
   *
   * @param {Object} io the server
   * @param {Object} socket player's socket
   * @param {Object} player the new player
   */
  joinRoom(io, socket, player) {
    player.socketId = socket.id; // updates the player's socket id
    const currentRoom = this.getRoomByCode(player.roomCode);

    if (currentRoom && !currentRoom.gameStarted) {
      if (currentRoom.players.length >= currentRoom.maxPlayers) {
        socket.emit('joinFailedMaxPlayers');
        return;
      }

      if (!RoomUtils.checkRepeatedNicknames(player, currentRoom.players)) {
        socket.emit('nickInUse');
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

  /**
   * Removes the player whose socket disconnected from all rooms' players list
   * he/she was connected to.
   *
   * @param {Object} io the server
   * @param {Object} socket the socket who disconnect
   */
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

  /* -------------------------------------------------------------------------*/
  /*                                  Lobby                                   */
  /* -------------------------------------------------------------------------*/

  /**
   * Updates the players status of all rooms the player whose status changed is
   * connected to.
   *
   * @param {Object} io the server
   * @param {Object} socket the user's socket
   * @param {Object} player the player whose status changed
   */
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
        currentRoom.setupAvaialbleDrawers();
        this.setupRound(roomCode);
        io.to(currentRoom.roomCode).emit('playersChanged', currentRoom);
      }

      roomCode = iterator.next()?.value;
    }
  }

  /* -------------------------------------------------------------------------*/
  /*                                  Game                                    */
  /* -------------------------------------------------------------------------*/

  /**
   * Updates the player socket id on the redirection to the game page and
   * connects the new socket to the room of the lobby that started the game.
   *
   * @param {Object} io the server
   * @param {Object} socket the user's new socket
   * @param {string} playerId the player id
   * @param {string} roomCode the code of the room the player was connected
   */
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

  /**
   * Setups the game for the room with the given room code.
   *
   * @param {string} roomCode the code of the room whose round is being set up
   * @returns {Object} the room whose game was set up
   */
  setupRound(roomCode) {
    const currentRoom = this.getRoomByCode(roomCode);
    currentRoom.chooseDrawer();
    currentRoom.chooseWord();
    return currentRoom;
  }

  /**
   * Resets the game for the room with the given room code.
   *
   * @param {Object} io the server
   * @param {string} roomCode the code of the room where a new round is starting
   */
  newRound(io, roomCode) {
    let currentRoom = this.getRoomByCode(roomCode);

    if (currentRoom.availableDrawers.length === 0) {
      io.to(currentRoom.roomCode).emit('endGame', currentRoom);
      return;
    }

    currentRoom = this.setupRound(roomCode);
    io.to(currentRoom.roomCode).emit('newGame', currentRoom);
  }

  /**
   * Ends the round for the room with the given room code.
   *
   * @param {Object} io the server
   * @param {string} roomCode the code of the room where the round just ended
   */
  endRound(io, player) {
    const currentRoom = this.getRoomByCode(player.roomCode);

    for (let i = 0; i < currentRoom.players.length; i++) {
      if (currentRoom.players[i].nickname === player.nickname) {
        currentRoom.players[i].ready = true;
        break;
      }
    }

    currentRoom.checkEveryoneReady();
    io.to(currentRoom.roomCode).emit(
      'wordWas',
      `A palavra era: ${currentRoom.word}`
    );
    if (currentRoom.everyoneReady) this.newRound(io, player.roomCode);
  }

  /**
   * Ends the round for the room with the given room code.
   *
   * @param {Object} io
   * @param {string} roomCode
   */
  guessWord(io, player, word) {
    let playerIndex = 0;
    const currentRoom = this.getRoomByCode(player.roomCode);

    if (currentRoom.word === word && !player.alreadyPointed) {
      for (let i = 0; i < currentRoom.players.length; i++) {
        if (currentRoom.players[i].nickname === player.nickname) {
          playerIndex = i;
          break;
        }
      }

      currentRoom.players[playerIndex].points += 1;
      currentRoom.players[playerIndex].alreadyPointed = true;
      io.to(currentRoom.roomCode).emit('guessedRight', currentRoom, player);
    } else {
      io.to(currentRoom.roomCode).emit('guessedWrong', currentRoom, player);
    }
  }

  /* -------------------------------------------------------------------------*/
  /*                                 Canvas                                   */
  /* -------------------------------------------------------------------------*/

  /**
   * Broadcasts the incoming drawing input from a player to all the other
   * players in the room.
   *
   * @param {Object} io the server
   * @param {Object} player the player who is emiting the drawing input
   * @param {Object} data the drawing input metadata
   */
  drawing(io, player, data) {
    const currentRoom = this.getRoomByCode(player.roomCode);
    io.to(currentRoom.roomCode).emit('playerDrawing', data);
  }

  /**
   * Broadcasts the itens erases from a player to all the other
   * players in the room.
   *
   * @param {Object} io the server
   * @param {Object} player the player who is emiting the drawing input
   * @param {Object} data the drawing input metadata
   */
  erasing(io, player, data) {
    const currentRoom = this.getRoomByCode(player.roomCode);
    io.to(currentRoom.roomCode).emit('playerErasing', data);
  }

  /**
   * Broadcasts to the given player room that the canvasnvas should be cleared.
   *
   * @param {Object} io the server
   * @param {Object} player the player who is emiting the clear canvas signal
   */
  clearBoard(io, player) {
    const currentRoom = this.getRoomByCode(player.roomCode);
    io.to(currentRoom.roomCode).emit('resetBoard');
  }

  /* -------------------------------------------------------------------------*/
  /*                                 Utility                                  */
  /* -------------------------------------------------------------------------*/

  /**
   * Returns a random word from the list of available words.
   */
  randomizeWord() {
    const number = RoomUtils.randomIndex(0, this.words.length);
    this.word = this.list.pop(number);
  }
}

module.exports = LobbyController;
