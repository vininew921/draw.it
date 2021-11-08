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

/*
 * HTML Elements
 */

const joinRoomBtn = document.getElementById("joinBtn");
const createRoomBtn = document.getElementById("createBtn");

const joinRoomModal = document.getElementById("joinRoomModal");
const roomCodeIpt = document.getElementById("roomCodeIpt");
const joinNicknameIpt = document.getElementById("joinNicknameIpt");
const confirmJoinModalBtn = document.getElementById("confirmJoinModalBtn");

const createRoomModal = document.getElementById("createRoomModal");
const createNicknameIpt = document.getElementById("createNicknameIpt");
const confirmCreateModalBtn = document.getElementById("confirmCreateModalBtn");

const spanBtns = document.getElementsByClassName("cancelModal");

/*
 * Control variables
 */

let currentOpenModal = null;
let whichOpen = null;

/*
 * Functions
 */

function generateRoomCode(roomCodeLength) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < roomCodeLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function resetInputValues() {
  joinNicknameIpt.value = "";
  createNicknameIpt.value = "";
  roomCodeIpt.value = "";
}

function hideModal() {
  currentOpenModal.style.display = "none";
  resetInputValues();
  whichOpen = null;
}

/*
 * Event Definitions
 */

function onCreateRoomBtnClick() {
  createRoomModal.style.display = "block";
  currentOpenModal = createRoomModal;
  whichOpen = 1;
}

function onJoinRoomBtnClick() {
  joinRoomModal.style.display = "block";
  currentOpenModal = joinRoomModal;
  whichOpen = 2;
}

function onConfirmCreateRoomBtnClick() {
  const nickname = createNicknameIpt.value;
  window.location.href = `/lobby?type=create&nickname=${nickname}&roomCode=${generateRoomCode(
    6
  )}`;
}

function onConfirmJoinRoomBtnClick() {
  const nickname = joinNicknameIpt.value;
  const roomCode = roomCodeIpt.value;
  window.location.href = `/lobby?type=join&nickname=${nickname}&roomCode=${roomCode}`;
}

/*
 * Init
 */

createRoomBtn.onclick = onCreateRoomBtnClick;
joinRoomBtn.onclick = onJoinRoomBtnClick;
confirmCreateModalBtn.onclick = onConfirmCreateRoomBtnClick;
confirmJoinModalBtn.onclick = onConfirmJoinRoomBtnClick;

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideModal();
  }
  if (event.key === "Enter") {
    if (whichOpen == 1) onConfirmCreateRoomBtnClick();
    else if (whichOpen == 2) onConfirmJoinRoomBtnClick();
  }
});

window.onclick = (event) => {
  if (event.target === currentOpenModal) {
    hideModal();
  }
};

Array.from(spanBtns).forEach((spanBtn) => {
  spanBtn.onclick = hideModal;
});
