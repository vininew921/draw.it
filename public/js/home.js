/*
 * HTML Elements
 */

const joinRoomBtn = document.getElementById('joinBtn');
const createRoomBtn = document.getElementById('createBtn');

const joinRoomModal = document.getElementById('joinRoomModal');
const roomCodeIpt = document.getElementById('roomCodeIpt');
const joinNicknameIpt = document.getElementById('joinNicknameIpt');
const confirmJoinModalBtn = document.getElementById('confirmJoinModalBtn');

const createRoomModal = document.getElementById('createRoomModal');
const createNicknameIpt = document.getElementById('createNicknameIpt');
const confirmCreateModalBtn = document.getElementById('confirmCreateModalBtn');

const spanBtns = document.getElementsByClassName('cancelModal');

/*
 * Control variables
 */

let currentOpenModal = null;

/*
 * Functions
 */

function generateRoomCode(roomCodeLength) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < roomCodeLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function resetInputValues() {
  joinNicknameIpt.value = '';
  createNicknameIpt.value = '';
  roomCodeIpt.value = '';
}

function hideModal() {
  currentOpenModal.style.display = 'none';
  resetInputValues();
}

/*
 * Event Definitions
 */

function onCreateRoomBtnClick() {
  createRoomModal.style.display = 'block';
  currentOpenModal = createRoomModal;
}

function onJoinRoomBtnClick() {
  joinRoomModal.style.display = 'block';
  currentOpenModal = joinRoomModal;
}

function onConfirmCreateRoomBtnClick() {
  const nickname = createNicknameIpt.value;
  window.location.href = `/lobby?type=create&nickname=${nickname}&roomCode=${generateRoomCode(6)}`;
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

window.onclick = (event) => { if (event.target === currentOpenModal) { hideModal(); } };

Array.from(spanBtns).forEach((spanBtn) => { spanBtn.onclick = hideModal; });
