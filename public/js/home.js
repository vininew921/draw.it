const joinRoomModal = document.getElementById("joinRoomModal");
const createRoomModal = document.getElementById("createRoomModal");
const joinRoomBtn = document.getElementById("joinBtn");
const createRoomBtn = document.getElementById("createBtn");
const confirmJoinModalBtn = document.getElementById("confirmJoinModalBtn");
const confirmCreateModalBtn = document.getElementById("confirmCreateModalBtn");
const spanBtn = document.getElementsByClassName("close");
const cancelBtn = document.getElementsByClassName("cancelModal");
const joinNicknameIpt = document.getElementById("joinNicknameIpt");
const createNicknameIpt = document.getElementById("createNicknameIpt");
const roomCodeIpt = document.getElementById("roomCodeIpt");
var currentOpenModal = null;

for (let index = 0; index < spanBtn.length; index++) {
    const span = spanBtn[index];
    const cancel = cancelBtn[index];
    span.onclick = function() {
      currentOpenModal.style.display = "none";
      resetInputValues();
    }
    cancel.onclick = function() {
      currentOpenModal.style.display = "none";
      resetInputValues();
    }
}

joinRoomBtn.onclick = function() {
    joinRoomModal.style.display = "block";
    currentOpenModal = joinRoomModal;
}

createRoomBtn.onclick = function() {
    createRoomModal.style.display = "block";
    currentOpenModal = createRoomModal;
}

confirmJoinModalBtn.onclick = function () {
  const nickname = joinNicknameIpt.value;
  const roomCode = roomCodeIpt.value;
  alert(nickname + " entrou na sala " + roomCode); //placeholder enquanto o lobby de espera não está funcionando
}

confirmCreateModalBtn.onclick = function () {
  const nickname = createNicknameIpt.value;
  alert(nickname + " criou uma sala"); //placeholder enquanto o lobby de espera não está funcionando
}

window.onclick = function(event) {
  if (event.target == currentOpenModal) {
    currentOpenModal.style.display = "none";
  }
}

function resetInputValues() {
  joinNicknameIpt.value = "";
  createNicknameIpt.value = "";
  roomCodeIpt.value = "";
}