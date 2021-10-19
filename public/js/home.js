//HTML Elements
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

//Control variables
var currentOpenModal = null;

//Functions
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
  window.location.href = "/lobby?type=join&nickname=" + nickname + "&roomCode=" + roomCode;
}

confirmCreateModalBtn.onclick = function () {
  const nickname = createNicknameIpt.value;
  window.location.href = "/lobby?type=create&nickname=" + nickname + "&roomCode=" + generateRoomCode(6);
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

function generateRoomCode(roomCodeLength) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < roomCodeLength; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
 return result;
}