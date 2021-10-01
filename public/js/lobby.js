//HTML Elements
const roomCodeHeader = document.getElementById("roomCodeHeader");
const playersHeader = document.getElementById("playersHeader");
const playersList = document.getElementById("players");
const lobbyHeader = document.getElementById("lobbyHeader");

//Control variables
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const lobbyType = urlParams.get('type');
const nickname = urlParams.get('nickname');
const roomCode = urlParams.get('roomCode');
var socket;
var currentRoom;

checkParameters();
initializeClient();

function checkParameters() {
    if (!lobbyType || !nickname || !roomCode) {
        window.location.href = "/";
    }
}

function initializeClient() {
    setupSocket();
    if (lobbyType == "create") {
        socket.emit("createRoom", new Player(nickname, roomCode));
    }
    else {
        socket.emit("joinRoom", new Player(nickname, roomCode));
    }
}

function setupSocket() {
    socket = io.connect("/");

    socket.on("joinComplete", onJoinComplete);
    socket.on("playerJoined", onPlayerJoined);
    socket.on("joinFailed", onJoinFailed);
    socket.on("joinFailedMaxPlayers", onJoinFailedMaxPlayers);
}

function updatePlayerList() {
    playersList.innerHTML = "";
    for (var i = 0; i < currentRoom.players.length; i++){
        var p = document.createElement("p");
        p.className = "player";
        p.innerHTML = currentRoom.players[i].nickname;
        playersList.appendChild(p);
    }
}

function onJoinComplete(data) {
    currentRoom = data;
    roomCodeHeader.innerHTML = " Room: " + currentRoom.roomCode;
    updatePlayerList();
}

function onJoinFailed(data) {
    lobbyHeader.innerHTML = "Room not found!";
    setTimeout(() => {
        window.location.href = "/";
    }, 2000);
}

function onJoinFailedMaxPlayers(){
    lobbyHeader.innerHTML = "Room is full!";
    setTimeout(() => {
        window.location.href = "/";
    }, 2000);
}

function onPlayerJoined(data) {
    currentRoom = data;
    updatePlayerList();
}

