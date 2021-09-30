//Control variables
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const lobbyType = urlParams.get('type');
const nickname = urlParams.get('nickname');
const roomCode = urlParams.get('roomCode');

checkParameters();
initializeClient();

function checkParameters() {
    if (!lobbyType || !nickname || !roomCode) {
        window.location.href = "/";
    }
}

function initializeClient() {
    var socket = io.connect('/');
    if (lobbyType == "create") {
        socket.emit("createRoom", new Player(nickname, roomCode));
    }
    else {
        socket.emit("joinRoom", new Player(nickname, roomCode));
    }
}