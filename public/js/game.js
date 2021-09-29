const socket = io();
const wordIpt = document.querySelector("#wordIpt");
const sendBtn = document.querySelector("#sendBtn");
const timer = document.querySelector("#timer");
const imgClock = document.querySelector("#img-clock");
const clockAudio = document.querySelector("#clockAudio");

sendBtn.onclick = function () {
  const text = wordIpt.value;
  if (text) {
    console.log(text);
  }
};

let timerInterval;
let cont = 120; // 120s = 2min
const initTimer = () => {
  timerInterval = setInterval(() => {
    cont--;
    const time = (cont / 60).toFixed(2).toString().split(".");
    const min = time[0];
    const sec = ((time[1] * 60) / 100).toFixed(0);
    timer.innerHTML = `${min}:${sec < 10 ? `0${sec}` : sec}`;
    if (cont <= 0) {
      stopTimer();
    }
  }, 1000);
};

initTimer();

const stopTimer = () => {
  timer.innerHTML = `0:00`;
  imgClock.classList.add("animate");
  wordIpt.value = "";
  wordIpt.disabled = true;
  sendBtn.disabled = true;
  playClockAudio();
  clearInterval(timerInterval);
};

const playClockAudio = () => {
  clockAudio.play();
  setTimeout(() => {
    clockAudio.pause();
  }, 5000);
};
