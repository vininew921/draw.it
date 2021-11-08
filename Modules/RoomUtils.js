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

class RoomUtils {
  /**
   * Checks for the existence of a player with the same nickname in the given
   * players list.
   *
   * @param {Object} playerToCheck the player with the nickname to check
   * @param {Object[]} players the players list to check
   * @returns
   */
  static checkRepeatedNicknames(playerToCheck, playersList) {
    for (let i = 0; i < playersList.length; i++) {
      if (playersList[i].nickname === playerToCheck.nickname) return false;
    }
    return true;
  }

  /**
   * Returns a random index between min (inclusive) and max (exclusive).
   *
   * @param {number} min the minimum index value
   * @param {number} max the maximum index value
   * @returns the random index
   */
  static randomIndex(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = RoomUtils;
