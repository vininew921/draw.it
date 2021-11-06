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

class Room {
  constructor(maxPlayers, roomCode) {
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.availableDrawers = [];
    this.roomCode = roomCode;
    this.mostRecentPlayer = undefined;
    this.everyoneReady = false;
    this.gameStarted = false;
    this.drawerIndex = 0;
    this.drawer = undefined;
    this.words = [
      'Astronauta',
      'Leite',
      'Pescador',
      'Livro',
      'Melancia',
      'Escola',
      'Macaco',
      'Palma',
      'Margarida',
      'Cérebro',
      'Lagarto',
      'Saco',
      'Saia',
      'Violão',
      'Cometa',
      'Hamburger',
      'Giz',
      'Rosa',
      'Alface',
      'Vendedor',
      'Tambor',
      'Pente',
      'Tempestade',
      'Salto',
      'Ouro',
      'Meia',
    ];
    this.word = undefined;
  }

  /* -------------------------------------------------------------------------*/
  /*                                  Player                                  */
  /* -------------------------------------------------------------------------*/

  addPlayer(player) {
    this.players.push(player);
    this.mostRecentPlayer = player;
  }

  /* -------------------------------------------------------------------------*/
  /*                                  Lobby                                   */
  /* -------------------------------------------------------------------------*/

  setupAvaialbleDrawers() {
    this.availableDrawers = [...this.players];
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

  /* -------------------------------------------------------------------------*/
  /*                                   Game                                   */
  /* -------------------------------------------------------------------------*/

  chooseDrawer() {
    const drawerIndex = this.randomIndex(0, this.players.length);
    this.drawer = this.availableDrawers.pop(drawerIndex);
  }

  chooseWord() {
    const wordIndex = this.randomIndex(0, this.words.length);
    this.word = this.words.pop(wordIndex);
  }

  /* -------------------------------------------------------------------------*/
  /*                                 Utility                                  */
  /* -------------------------------------------------------------------------*/

  randomIndex(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = Room;
