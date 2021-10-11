//HTML Elements
const roomCodeHeader = document.getElementById("roomCodeHeader");
const playersHeader = document.getElementById("playersHeader");
const playersList = document.getElementById("players");
const lobbyHeader = document.getElementById("lobbyHeader");
const readyButton = document.getElementById("lobbyReady");
const canvasDiv = document.getElementById("canvasDiv");
const lobbyCanvas = document.getElementById("lobbyCanvas");
const context = lobbyCanvas.getContext("2d");

//HTML Events Setup
readyButton.onclick = onReadyClick;
document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mouseup', onMouseUp, false);
document.addEventListener('mouseout', onMouseUp, false);
document.addEventListener('mousemove', throttle(onMouseMove, 10), false);

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

function onScreenResize() {
    lobbyCanvas.width = window.innerWidth;
    lobbyCanvas.height = window.innerHeight;
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
var current = {
    color: 'black',
    x: 0,
    y: 0
};
var drawing = false;

//Initialization
checkParameters();
initializeClient();
onScreenResize();


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
    socket.on('lobbyDrawing', onDrawingEvent);
}

function updatePlayerList() {
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
}

function onMouseDown(e){
    drawing = true;
    current.x = e.clientX||e.touches[0].clientX;
    current.y = e.clientY||e.touches[0].clientY;
}

function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, current.color, true);
}

function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, current.color, true);
    current.x = e.clientX||e.touches[0].clientX;
    current.y = e.clientY||e.touches[0].clientY;
}

function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
        var time = new Date().getTime();

        if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
        }
    };
}

function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = lobbyCanvas.width;
    var h = lobbyCanvas.height;

    socket.emit('lobbyDrawing', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color
    });
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

function onDrawingEvent(data){
    var w = lobbyCanvas.width;
    var h = lobbyCanvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}