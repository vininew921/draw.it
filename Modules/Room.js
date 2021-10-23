/*
  Draw.it
  Copyright (C) 2021  Various Authors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

class Room {
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
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[i].ready) {
        this.everyoneReady = false;
        return;
      }
    }

    this.everyoneReady = true;
  }
}

module.exports = Room;
