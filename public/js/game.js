const wordIpt = document.getElementById("wordIpt");
const sendBtn = document.getElementById("sendBtn");
const canvasDraw = document.getElementById("canvasDraw");
var currentOpenModal = null;

sendBtn.onclick = function () {
  const text = wordIpt.value;
  if (text) {
    console.log(text);
  }
};
