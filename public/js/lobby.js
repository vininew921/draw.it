//HTML Elements
const roomCodeHeader = document.getElementById("roomCodeHeader");
const playersHeader = document.getElementById("playersHeader");
const playersList = document.getElementById("players");
const lobbyHeader = document.getElementById("lobbyHeader");
const readyButton = document.getElementById("lobbyReady");

//HTML Events Setup
readyButton.onclick = onReadyClick;

//HTML Events Definition
function onReadyClick() {
    if (readyButton.className == "readyButton ready") {
        readyButton.className = "readyButton cancel";
        readyButton.innerHTML = "Cancel";
        player.ready = true;
        socket.emit("playerReadyChanged", player);
    }
    else {
        readyButton.className = "readyButton ready";
        readyButton.innerHTML = "Ready";
        player.ready = false;
        socket.emit("playerReadyChanged", player);
    }
}

//Control variables
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const lobbyType = urlParams.get('type');
const nickname = urlParams.get('nickname');
const roomCode = urlParams.get('roomCode');
var player;
var socket;
var currentRoom;
var startGameTimer;
var startGameSeconds = 5;

//Initialization
checkParameters();
initializeClient();


//Functions
function checkParameters() {
    if (!lobbyType || !nickname || !roomCode) {
        window.location.href = "/";
    }
}

function initializeClient() {
    setupSocket();
    player = new Player(nickname, roomCode);
    if (lobbyType == "create") {
        socket.emit("createRoom", player);
    }
    else {
        socket.emit("joinRoom", player);
    }
}

function setupSocket() {
    socket = io.connect("/");

    socket.on("joinComplete", onJoinComplete);
    socket.on("playersChanged", onPlayersChanged);
    socket.on("joinFailed", onJoinFailed);
    socket.on("joinFailedMaxPlayers", onJoinFailedMaxPlayers);
}

function updatePlayerList() {
    if (!currentRoom.gameStarted) {
        playersList.innerHTML = "";
        playersHeader.innerHTML = "Players - " + currentRoom.players.length + "/" + currentRoom.maxPlayers;
        for (var i = 0; i < currentRoom.maxPlayers; i++){
            var p = document.createElement("p");
            if (currentRoom.players[i]) {
                p.className = "player joined";
                p.innerHTML = currentRoom.players[i].nickname;
                if (currentRoom.players[i].ready) {
                    p.innerHTML += " 👍";
                }
            }
            else {
                p.className = "player empty";
                p.innerHTML = "Empty";
            }
            playersList.appendChild(p);
        }

        if (currentRoom.everyoneReady) {
            startGame(true);
        }
        else {
            startGame(false);
        }
    }
}

function startGame(start) {
    if (start && !startGameTimer) {
        startGameTimer = setInterval(() => {
            if (startGameSeconds == 0) {
                window.location.href = "/game?roomCode=" + currentRoom.roomCode + "&playerId=" + socket.id;
            }
            else {
                lobbyHeader.innerHTML = "Game starting in " + startGameSeconds;
                startGameSeconds--;
            }
        }, 1000);
    }
    else {
        clearInterval(startGameTimer);
        startGameTimer = undefined;
        startGameSeconds = 5;
        lobbyHeader.innerHTML = "Waiting Room";
    }
}

//Socket events
function onJoinComplete(data) {
    currentRoom = data;
    roomCodeHeader.innerHTML = "Room " + currentRoom.roomCode;
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

function onPlayersChanged(data) {
    currentRoom = data;
    updatePlayerList();
}

