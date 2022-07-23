const socket = io("ws://localhost:8080");

connectedUsers = [];

chat = "";

chatList = document.getElementById("chatList");
messageDiv = document.querySelector("main>div:nth-of-type(2)");

function setChat(chatID) {
  chat = chatID;
  if (window.screen.availWidth <= 600 && chat) {
    chatList.style.display = "none";
    messageDiv.style.display = "block";
  }
}

function back() {
  chat = "";
  chatList.style.display = "flex";
  messageDiv.style.display = "none";
}

window.onresize = function() {
  if (window.screen.availWidth > 600) {
    chatList.style.display = "flex";
    messageDiv.style.display = "block";
  }
}

user = "";
fetch("http://localhost:8080/getSession")
  .then(response => response.text())
  .then(data => {
    user = data;
    socket.emit("connected", data);
  });

socket.on("connected", (users) => {
  connectedUsers = users;
});

socket.on("disconnected", (user) => {
  connectedUsers.pop(user);
});

textInput = document.getElementById("messageInput");
messages = document.getElementById("messages");

socket.on("message", message => {
  if (message.chat == chat) {
    el = document.createElement("div");
    el.classList = message.user == user?"ownMessage":"otherMessage";
    el.innerHTML = "<p>" + message.text + "</p><a>" + message.user +"</a>";
    messages.appendChild(el);
  }
});

textInput.addEventListener("input", () => {
  if (textInput.value.split("\n").length > 1) {
    textInput.style.height = "150px";
    textInput.style.borderTopLeftRadius = "15px";
    textInput.style.borderTopRightRadius = "15px";
  }
  else {
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
  }
});

document.getElementById("btn-send").addEventListener("click",  () => {
  if (textInput.value.trim().length != 0) {
    text = textInput.value.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/\n/g, "<br>")
    socket.emit("message", {text: text, user: user, chat: chat});
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
  }
});