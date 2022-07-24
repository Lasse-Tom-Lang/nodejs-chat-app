const socket = io("ws://localhost:8080");

connectedUsers = [];

chat = undefined;
chatInfo = undefined;

chatList = document.getElementById("chatList");
messageDiv = document.querySelector("main>div:nth-of-type(2)");
chatImage = document.querySelector("chatInfo img");
chatName = document.querySelector("chatInfo p");

function setChat(chatID, chatType) {
  chat = chatID;
  fetch("http://localhost:8080/getChat?chatID=" + chatID + "&chatType=" + chatType)
    .then(response => response.json())
    .then(data => {
      chatInfo = data;
      console.log(chatInfo);
    });
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

userInfo = "";
fetch("http://localhost:8080/getUserInfos")
  .then(response => response.json())
  .then(data => {
    userInfo = data;
    socket.emit("connected", data.name);
    userInfo.chats.forEach(element => {
      chatList.innerHTML += `
        <button class="chat" onclick="setChat(` + element.id + `, 'chat');">
          <img src="profilePictures?user=` + element.user.id + `">
          <a>
            ` + element.user.name + `
          </a>
        </button>
      `;
    });
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
    el.classList = message.user == userInfo.name?"ownMessage":"otherMessage";
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
    text = text.replace(/\n/g, "<br>");
    socket.emit("message", {text: text, user: userInfo.name, chat: chat});
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
  }
});