const socket = io("ws://localhost:8080");

let connectedUsers = [];

interface chatInfo {
  name: string,
  id: string,
  users: {
    id: string
    name: string
  }[],
  messages: {
    id: string,
    text: string,
    type: "text" | "file" | "image" | "link",
    user: {
      name: string,
      id: string
    }
  }[]
}

let chatInfo:chatInfo;

let chat = undefined;

interface userInfo {
  name: string,
  id: string
}

let userInfo:userInfo;

let chatNameList = [];

let textInput = document.getElementById("messageInput") as HTMLInputElement;
let chatList = document.getElementById("chatList")!;
let messageDiv = document.querySelector("main>div:nth-of-type(2)") as HTMLDivElement;
let chatImage = document.querySelector("#chatInfos img") as HTMLImageElement;
let chatName = document.querySelector("#chatInfos p")!;
let messages = document.getElementById("messages")!;
let messageTypeDiv = document.getElementById("messageTypeChoose")!;
let messageImageUpload = document.getElementById("messageImageUpload") as HTMLInputElement;
let messageFileUpload = document.getElementById("messageFileUpload") as HTMLInputElement;
let uploadInfo = document.getElementById("uploadInfo")!;
let messageLinkInput = document.getElementById("messageLinkInput") as HTMLInputElement;
let chatInfos = document.getElementById("chatInfos")!;
let groupInfos = document.getElementById("groupInfos")!;
let groupInfoImg = document.getElementById("groupInfoImg") as HTMLImageElement;
let groupInfoName = document.getElementById("groupInfoName")!;
let groupInfoUsers = document.getElementById("groupInfoUsers")!;
let groupInfoClose = document.getElementById("groupInfoClose")!;
let groupInfoLeave = document.getElementById("groupInfoLeave")!;
let imageMessagesIDs = [];
let fileMessagesIDs = [];

let messageType: "text" | "file" | "image" | "link" = "text";

chatInfos.addEventListener("click", () => {
  if (chat) {
    groupInfos.style.display = "flex";
    groupInfoUsers.innerHTML = "";
    if (chatInfo.name) {
      groupInfoImg.src = `profilePictures?user=${chatInfo.id}`;
      groupInfoName.innerHTML = chatInfo.name;
      chatInfo.users.forEach(element => {
        if (element.id == userInfo.id) {
          groupInfoUsers.innerHTML += `<a>${element.name}<i> (You)</i></a>`;
        }
        else {
          groupInfoUsers.innerHTML += `<a>${element.name}</a>`;
        }
      });
      groupInfoLeave.innerHTML = "Leave group";
    }
    else {
      if (chatInfo.users[0].id == userInfo.id) {
        groupInfoImg.src = `profilePictures?user=${chatInfo.users[1].id}`;
        groupInfoName.innerHTML = chatInfo.users[1].name;
      }
      else if (chatInfo.users[1].id == userInfo.id) {
        groupInfoImg.src = `profilePictures?user=${chatInfo.users[0].id}`;
        groupInfoName.innerHTML = chatInfo.users[0].name;
      }
      groupInfoLeave.innerHTML = "Leave chat";
    }
  }
});

groupInfoClose.addEventListener("click", () => {
  groupInfos.style.display = "none";
});

function toggleMessageType() {
  if (messageTypeDiv.style.display == "flex") {
    messageTypeDiv.style.display = "none";
  }
  else {
    messageTypeDiv.style.display = "flex";
  }
}

document.getElementById("messageImageButton")!.addEventListener("click", () => {
  messageImageUpload.click();
});

document.getElementById("messageFileButton")!.addEventListener("click", () => {
  messageFileUpload.click();
});

messageImageUpload.addEventListener("change", () => {
  messageTypeDiv.style.display = "none";
  uploadInfo.style.display = "block";
  messageLinkInput.style.display = "none";
  uploadInfo.innerHTML = `${messageImageUpload.files.length} Images choosen`;
  messageType = "image";
});

messageFileUpload.addEventListener("change", () => {
  messageTypeDiv.style.display = "none";
  uploadInfo.style.display = "block";
  messageLinkInput.style.display = "none";
  uploadInfo.innerHTML = `${messageFileUpload.files.length} Files choosen`;
  messageType = "file";
});

document.getElementById("messageLinkButton")!.addEventListener("click", () => {
  messageTypeDiv.style.display = "none";
  uploadInfo.style.display = "none";
  messageLinkInput.style.display = "block";
  messageType = "link";
});

function setChat(chatID, chatType) {
  chat = chatID;
  fetch(`/getChat?chatID=${chatID}&chatType=${chatType}`)
    .then(response => response.json())
    .then(data => {
      chatInfo = data;
      if (chatType == "chat") {
        if (chatInfo.users[0].id == userInfo.id) {
          chatImage.src = `profilePictures?user=${chatInfo.users[1].id}`;
          chatImage.style.display = "inline";
          chatName.innerHTML = chatInfo.users[1].name;
        }
        else if (chatInfo.users[1].id == userInfo.id) {
          chatImage.src = `profilePictures?user=${chatInfo.users[0].id}`;
          chatImage.style.display = "inline";
          chatName.innerHTML = chatInfo.users[0].name;
        }
      }
      else if (chatType == "group") {
        chatImage.src = `profilePictures?user=${chatInfo.groupID}`;
        chatImage.style.display = "inline";
        chatName.innerHTML = chatInfo.name;
      }
      messages.innerHTML = "";
      chatInfo.messages.forEach(element => {
        var el = document.createElement("div") as HTMLElement;
        el.classList = element.userName == userInfo.name ? "ownMessage" : "otherMessage";
        if (element.type == "image") {
          imageMessagesIDs.push(element.messageID);
          el.innerHTML = "<div>";
          element.messageFiles.forEach(image => {
            el.firstChild.innerHTML += `<img src='/messageImages?chatID=${chatID}&messageID=${element.messageID}&imageName=${image.name}'>`;
          });
        }
        if (element.type == "link") {
          el.innerHTML = `<a class='messageLink' href='${element.link}'>${element.link}</a>`;
        }
        if (element.type == "file") {
          fileMessagesIDs.push(element.messageID);
          el.innerHTML = "<div class='fileList'>";
          element.files.forEach(file => {
            el.firstChild.innerHTML += `<a href='fileDownload/${file}?chatID=${chatID}&messageID=${element.id}' download>${file}</a>`;
          });
        }
        el.innerHTML += `<p>${element.text}</p><a>${element.userName}</a>`;
        messages.appendChild(el);
      });
    });
  if (window.innerWidth <= 800 && chat) {
    chatList.style.display = "none";
    messageDiv.style.display = "block";
  }
}

function back() {
  chat = undefined;
  chatList.style.display = "flex";
  messageDiv.style.display = "none";
}

window.onresize = function () {
  if (window.screen.availWidth > 800) {
    chatList.style.display = "flex";
    messageDiv.style.display = "block";
  }
}

fetch("/getUserInfos")
  .then(response => response.json())
  .then(data => {
    userInfo = data;
    socket.emit("connected", data.name);
    data.chats.forEach(element => {
      let user = data.name == element.users[0].name?element.users[1]:element.users[0];
      chatList.innerHTML += `
        <button class="chat" onclick="setChat('${element.chatID}', 'chat');">
          <img src="profilePictures?user=${user.id}">
          <div class="online"></div>
          <a>
            ${user.name}
          </a>
        </button>
      `;
      chatNameList.push(user.name);
    });
    data.groups.forEach(element => {
      chatList.innerHTML += `
        <button class="chat" onclick="setChat('${element.groupID}', 'group');">
          <img src="profilePictures?user=${element.groupID}">
          <a>
            ${element.name}
          </a>
        </button>
      `;
    });
  });

socket.on("connected", (users) => {
  connectedUsers = users;
  connectedUsers.forEach(element => {
    if (chatNameList.includes(element)) {
      chatList.children[chatNameList.indexOf(element) + 1].querySelector("div").style.backgroundColor = "rgb(86, 255, 100)";
    }
  });
});

socket.on("disconnected", (user) => {
  if (chatNameList.includes(user)) {
    chatList.children[chatNameList.indexOf(user) + 1].querySelector("div").style.backgroundColor = "rgb(100, 100, 100)";
  }
  connectedUsers.pop(user);
});

socket.on("message", message => {
  if (message.chat == chat) {
    switch (message.type) {
      case "text":
        var el = document.createElement("div");
        el.classList = "otherMessage";
        el.innerHTML = `<p>${message.text}</p><a>${message.user.name}</a>`;
        messages.appendChild(el);
        break;
      case "image":
        var el = document.createElement("div");
        el.classList = "otherMessage";
        el.innerHTML = "<div>"
        message.images.forEach(image => {
          el.firstChild.innerHTML += `<img src='/messageImages?chatID=${chat}&messageID=${message.messageID}&imageName=${image}'>`;
        });
        el.innerHTML += `<p>${message.text}</p><a>${message.user.name}</a>`;
        messages.appendChild(el);
        break;
      case "link":
        var el = document.createElement("div");
        el.classList = "otherMessage";
        el.innerHTML = `<a class='messageLink' href='${message.link}'>${message.link}</a>`;
        el.innerHTML += `<p>${message.text}</p><a>${message.user.name}</a>`;
        messages.appendChild(el);
        break;
      case "file":
        var el = document.createElement("div");
        el.classList = "otherMessage";
        el.innerHTML = `<a class='messageLink' href='${message.link}'>${message.link}</a>`;
        el.innerHTML = "<div class='fileList'>";
        message.files.forEach(file => {
          el.firstChild.innerHTML += `<a href='fileDownload/${file}?chatID=${chat}&messageID=${message.messageID}' download>${file}</a>`;
        });
        el.innerHTML += `<p>${message.text}</p><a>${message.user.name}</a>`;
        messages.appendChild(el);
        break;
    }
  }
});

textInput.addEventListener("input", () => {
  if (textInput.value.split("\n").length > 1) {
    textInput.style.height = "150px";
    if (uploadInfo.style.display == "block") {
      uploadInfo.style.bottom = "160px";
    }
    else if (messageLinkInput.style.display == "block") {
      messageLinkInput.style.bottom = "160px";
    }
    else {
      textInput.style.borderTopLeftRadius = "15px";
      textInput.style.borderTopRightRadius = "15px";
    }
  }
  else {
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
    uploadInfo.style.bottom = "40px";
    messageLinkInput.style.bottom = "40px";
  }
});

document.getElementById("btn-send")!.addEventListener("click", () => {
  if (textInput.value.trim().length != 0 && chatInfo && messageType == "text") {
    var text = textInput.value.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/\n/g, "<br>");
    socket.emit("message", { text: text, type: "text", user: {name: userInfo.name, id: userInfo.id}, chat: chat, sendTo: chatInfo.users.map((a) => { return a.name; }) });
    el = document.createElement("div");
    el.classList = "ownMessage";
    el.innerHTML = "<p>" + text + "</p><a>" + userInfo.name + "</a>";
    messages.appendChild(el);
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
  }
  else if (messageType == "image" && chatInfo) {
    var ID = Math.floor(Math.random() * (999999999 - 100000000 + 1) + 100000000);
    while (imageMessagesIDs.includes(ID)) {
      ID = Math.floor(Math.random() * (999999999 - 100000000 + 1) + 100000000);
    }
    let imageList = [];
    for (var i = 0; i < messageImageUpload.files.length; i++) {
      if (["png", "jpeg", "jpg"].includes(messageImageUpload.files[i].name.split(".")[1].toLowerCase())) {
        imageList.push(messageImageUpload.files[i].name);
        var xml = new XMLHttpRequest();
        xml.open('POST', '/uploadImage', true);
        var formdata = new FormData();
        formdata.append("myFile", messageImageUpload.files[i]);
        formdata.append("chatID", chat);
        formdata.append("messageID", ID.toString());
        xml.send(formdata);
      }
    };
    imageMessagesIDs.push(ID);
    var text = textInput.value.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/\n/g, "<br>");
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
    uploadInfo.style.bottom = "40px";
    uploadInfo.style.display = "none";
    messageImageUpload.value = null;
    messageType = "text";
    setTimeout(() => {
      socket.emit("message", { text: text, type: "image", messageID: ID, images: imageList, user: {name: userInfo.name, id: userInfo.id}, chat: chat, sendTo: chatInfo.users.map((a) => { return a.name; }) });
      var el = document.createElement("div");
      el.classList = "ownMessage";
      el.innerHTML = "<div>"
      imageList.forEach(image => {
        el.firstChild.innerHTML += `<img src='/messageImages?chatID=${chat}&messageID=${ID}&imageName=${image}'>`;
      });
      el.innerHTML += `<p>${text}</p><a>${userInfo.name}</a>`;
      messages.appendChild(el);
    }, imageList.length * 250);
  }
  else if (messageType == "link" && chatInfo && messageLinkInput.value.trim().length != 0) {
    var text = textInput.value.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/\n/g, "<br>");
    socket.emit("message", { text: text, type: "link", link: messageLinkInput.value, user: {name: userInfo.name, id: userInfo.id}, chat: chat, sendTo: chatInfo.users.map((a) => { return a.name; }) });
    var el = document.createElement("div");
    el.classList = "ownMessage";
    el.innerHTML = `<a class='messageLink' href='${messageLinkInput.value}'>${messageLinkInput.value}</a>`;
    el.innerHTML += `<p>${text}</p><a>${userInfo.name}</a>`;
    messages.appendChild(el);
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
    messageLinkInput.style.display = "none";
    messageLinkInput.value = null;
    messageLinkInput.style.bottom = "40px";
    messageType = "text";
  }
  else if (messageType == "file" && chatInfo) {
    var ID = Math.floor(Math.random() * (999999999 - 100000000 + 1) + 100000000);
    while (fileMessagesIDs.includes(ID)) {
      ID = Math.floor(Math.random() * (999999999 - 100000000 + 1) + 100000000);
    }
    var fileList = [];
    for (i = 0; i < messageFileUpload.files.length; i++) {
      fileList.push(messageFileUpload.files[i].name);
      var xml = new XMLHttpRequest();
      xml.open('POST', '/uploadFile', true);
      var formdata = new FormData();
      formdata.append("myFile", messageFileUpload.files[i]);
      formdata.append("chatID", chat);
      formdata.append("messageID", ID.toString());
      xml.send(formdata);
    };
    fileMessagesIDs.push(ID);
    var text = textInput.value.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/\n/g, "<br>");
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
    uploadInfo.style.bottom = "40px";
    uploadInfo.style.display = "none";
    messageFileUpload.value = null;
    messageType = "text";
    socket.emit("message", { text: text, type: "file", messageID: ID, files: fileList, user: {name: userInfo.name, id: userInfo.id}, chat: chat, sendTo: chatInfo.users.map((a) => { return a.name; }) });
    var el = document.createElement("div");
    el.classList = "ownMessage";
    el.innerHTML = "<div class='fileList'>";
    fileList.forEach(file => {
      el.firstChild.innerHTML += `<a href='fileDownload/${file}?chatID=${chat}&messageID=${ID}' download>${file}</a>`;
    });
    el.innerHTML += `<p>${text}</p><a>${userInfo.name}</a>`;
    messages.appendChild(el);
  }
});