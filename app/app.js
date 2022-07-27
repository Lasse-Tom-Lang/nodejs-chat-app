const socket = io("ws://localhost:8080");

connectedUsers = [];

chat = undefined;
chatInfo = undefined;

chatList = document.getElementById("chatList");
messageDiv = document.querySelector("main>div:nth-of-type(2)");
chatImage = document.querySelector("#chatInfos img");
chatName = document.querySelector("#chatInfos p");
messages = document.getElementById("messages");

function setChat(chatID, chatType) {
  chat = chatID;
  fetch("http://localhost:8080/getChat?chatID=" + chatID + "&chatType=" + chatType)
    .then(response => response.json())
    .then(data => {
      chatInfo = data;
      if (chatType == "chat") {
        if (chatInfo.users[0].id == userInfo.id) {
          chatImage.src = "profilePictures?user=" + chatInfo.users[1].id;
          chatImage.style.display = "inline";
          chatName.innerHTML = chatInfo.users[1].name;
        }
        else if (chatInfo.users[1].id == userInfo.id) {
          chatImage.src = "profilePictures?user=" + chatInfo.users[0].id;
          chatImage.style.display = "inline";
          chatName.innerHTML = chatInfo.users[0].name;
        }
      }
      else if (chatType == "group") {
        chatImage.src = "profilePictures?user=" + chatInfo.id;
        chatImage.style.display = "inline";
        chatName.innerHTML = chatInfo.name;
      }
      messages.innerHTML = "";
      chatInfo.messages.forEach(element => {
        el = document.createElement("div");
        el.classList = element.user.id == userInfo.id?"ownMessage":"otherMessage";
        if (element.type == "image") {
          el.innerHTML = "<div>"
          console.log(el.firstChild);
          element.images.forEach(image => {
            el.firstChild.innerHTML += "<img src='/messageImages?messageID=" + element.messageID + "&imageName=" + image + "'>";
          });
        }
        el.innerHTML += "<p>" + element.text + "</p><a>" + element.user.name +"</a>";
        messages.appendChild(el);
      });
    });
  if (window.screen.availWidth <= 800 && chat) {
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
  if (window.screen.availWidth > 800) {
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
    userInfo.groups.forEach(element => {
      chatList.innerHTML += `
        <button class="chat" onclick="setChat(` + element.id + `, 'group');">
          <img src="profilePictures?user=` + element.id + `">
          <a>
            ` + element.name + `
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
  if (textInput.value.trim().length != 0 && chatInfo) {
    text = textInput.value.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/\n/g, "<br>");
    socket.emit("message", {text: text, user: userInfo.name, chat: chat, sendTo: chatInfo.users.map((a) => {return a.name;})});
    el = document.createElement("div");
    el.classList = "ownMessage";
    el.innerHTML = "<p>" + text + "</p><a>" + userInfo.name +"</a>";
    messages.appendChild(el);
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
  }
});