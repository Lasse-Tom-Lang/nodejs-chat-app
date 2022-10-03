const socket = io("/");

interface chatInfo {
  name: string,
  chatID?: string,
  groupID?: string,
  description?: string
  users: {
    id: string
    name: string
    bio: string
  }[],
  messages: {
    messageID: string,
    text: string,
    type: "text" | "file" | "image" | "link",
    userName: string,
    link: string,
    sendedAt: Date,
    messageFiles: {
      name: string,
      id: string
    }[]
  }[]
}

interface socketMessage {
  messageID: string,
  text: string,
  type: "text" | "file" | "image" | "link",
  userName: string,
  link: string,
  messageFiles: {
    name: string,
    id: string
  }[],
  chatID: string,
  groupID: string
}

interface userInfo {
  name: string,
  id: string
}

type MessageType = "text" | "file" | "image" | "link";

let chatInfo: chatInfo;

let chat: string;

let chatType: "chat" | "group";

let userInfo: userInfo;

let chatNameList: string[] = [];

let addSelectedType: "chat" | "group" = "chat";

let choosenUserID: String;

let choosenUsersIDs: string[] = [];

let messageType: MessageType = "text";

let textInput = document.getElementById("messageInput") as HTMLInputElement;
let chatList = document.getElementById("chatList") as HTMLDivElement;
let messageDiv = document.querySelector("main>div:nth-of-type(2)") as HTMLDivElement;
let chatImage = document.querySelector("#chatInfos img") as HTMLImageElement;
let chatName = document.querySelector("#chatInfos p") as HTMLParagraphElement;
let messages = document.getElementById("messages") as HTMLDivElement;
let messageTypeDiv = document.getElementById("messageTypeChoose") as HTMLDivElement;
let messageImageUpload = document.getElementById("messageImageUpload") as HTMLInputElement;
let messageFileUpload = document.getElementById("messageFileUpload") as HTMLInputElement;
let uploadInfo = document.getElementById("uploadInfo") as HTMLDivElement;
let messageLinkInput = document.getElementById("messageLinkInput") as HTMLInputElement;
let chatInfos = document.getElementById("chatInfos") as HTMLDivElement;
let groupInfos = document.getElementById("groupInfos") as HTMLDivElement;
let groupInfoImg = document.getElementById("groupInfoImg") as HTMLImageElement;
let groupInfoName = document.getElementById("groupInfoName") as HTMLAnchorElement;
let groupInfoUsers = document.getElementById("groupInfoUsers") as HTMLDivElement;
let groupInfoClose = document.getElementById("groupInfoClose") as HTMLButtonElement;
let groupInfoLeave = document.getElementById("groupInfoLeave") as HTMLButtonElement;
let addDiv = document.getElementById("addDiv") as HTMLDivElement;
let addWindowClose = document.getElementById("addWindowClose") as HTMLButtonElement;
let addTypeChat = document.querySelector("#chooseAddType button:first-of-type") as HTMLButtonElement;
let addTypeGroup = document.querySelector("#chooseAddType button:last-of-type") as HTMLButtonElement;
let addChatDiv = document.getElementById("addChatDiv") as HTMLDivElement;
let addGroupDiv = document.getElementById("addGroupDiv") as HTMLDivElement;
let addChatInput = document.querySelector("#addChatDiv input") as HTMLInputElement;
let addChatError = document.querySelector("#addChatDiv p") as HTMLParagraphElement;
let createButton = document.querySelector("#addDiv>button:last-of-type") as HTMLButtonElement;
let addGroupInput = document.querySelector("#addGroupDiv input:nth-of-type(3)") as HTMLInputElement;
let addGroupName = document.querySelector("#addGroupDiv input:nth-of-type(1)") as HTMLInputElement;
let addGroupDescription = document.querySelector("#addGroupDiv input:nth-of-type(2)") as HTMLInputElement;
let addGroupImage = document.querySelector("#addGroupDiv input:nth-of-type(4)") as HTMLInputElement;
let addGroupError = document.querySelector("#addGroupDiv p") as HTMLParagraphElement;
let choosenUsers = document.getElementById("choosenUsers") as HTMLDivElement;
let groupImageInput = document.getElementById("groupImageInput") as HTMLInputElement;
let groupAddUser = document.getElementById("groupAddUser") as HTMLButtonElement;
let groupAddUserInput = document.getElementById("groupAddUserInput") as HTMLInputElement;
let messageImageButton = document.getElementById("messageImageButton") as HTMLButtonElement;
let messageFileButton = document.getElementById("messageFileButton") as HTMLButtonElement;
let messageLinkButton = document.getElementById("messageLinkButton") as HTMLButtonElement;
let btnSend = document.getElementById("btn-send") as HTMLButtonElement;
let bio = document.getElementById("bio") as HTMLParagraphElement;

function renderMessage(userName: string, type: MessageType, messageID: string, messageFiles: { name: string, id: string }[], link: string, text: string) {
  switch (type) {
    case "text":
      var newMessage = `
        <div class=${userName == userInfo.name ? "ownMessage" : "otherMessage"}>
          <p>
            ${text}
          </p>
          <a>
            ${userName}
          </a>
        </div>
      `;
      break;
    case "image":
      let images = "";
      messageFiles.forEach(image => {
        images += `<img src='/messageImages?messageID=${messageID}&imageName=${image.name}'>`;
      });
      var newMessage = `
        <div class=${userName == userInfo.name ? "ownMessage" : "otherMessage"}>
          <div>
            ${images}
          </div>
          <p>
            ${text}
          </p>
          <a>
            ${userName}
          </a>
        </div>
      `;
      break;
    case "link":
      var newMessage = `
        <div class=${userName == userInfo.name ? "ownMessage" : "otherMessage"}>
          <a class='messageLink' href='${link}'>
            ${link}
          </a>
          <p>
            ${text}
          </p>
          <a>
            ${userName}
          </a>
        </div>
      `;
      break;
    case "file":
      let files = "";
      messageFiles.forEach(file => {
        files += `<a href='fileDownload/${file.name}?messageID=${messageID}' download>${file.name}</a>`;
      });
      var newMessage = `
        <div class=${userName == userInfo.name ? "ownMessage" : "otherMessage"}>
          <div class='fileList'>
            ${files}
          </div>
          <p>
            ${text}
          </p>
          <a>
            ${userName}
          </a>
        </div>
      `;
      break;
  }
  messages.innerHTML += newMessage;
}

groupInfoLeave.addEventListener("click", () => {
  if (chatType == "group") {
    fetch(`/deleteGroup?groupID=${chatInfo.groupID}`);
    groupInfos.style.display = "none";
  }
  else if (chatType == "chat") {
    fetch(`/deleteChat?chatID=${chatInfo.chatID}`);
    groupInfos.style.display = "none";
  }
});

groupAddUser.addEventListener("click", () => {
  groupAddUserInput.style.display = "block";
  groupAddUser.style.display = "none";
  groupAddUserInput.focus();
});

groupAddUserInput.addEventListener("blur", () => {
  groupAddUserInput.style.display = "none";
  groupAddUser.style.display = "block";
  if (!chatInfo.users.map(user => { return user.name.toLowerCase() }).includes(groupAddUserInput.value.toLowerCase())) {
    fetch(`/groupAddUser?groupID=${chatInfo.groupID}&userName=${groupAddUserInput.value}`)
      .then(data => data.json())
      .then(data => {
        if (data.status == 1) {
          groupInfoUsers.innerHTML += `<a>${data.user}</a>`
        }
      });
  }
  groupAddUserInput.value = "";
});

addWindowClose.addEventListener("click", () => {
  addDiv.style.display = "none";
})

addTypeChat.addEventListener("click", () => {
  addTypeChat.style.backgroundColor = "rgb(180, 180, 180)";
  addTypeGroup.style.backgroundColor = "white";
  addSelectedType = "chat";
  addChatDiv.style.display = "flex";
  addGroupDiv.style.display = "none";
})

addTypeGroup.addEventListener("click", () => {
  addTypeGroup.style.backgroundColor = "rgb(180, 180, 180)";
  addTypeChat.style.backgroundColor = "white";
  addSelectedType = "group";
  addChatDiv.style.display = "none";
  addGroupDiv.style.display = "flex";
})

addChatInput.addEventListener("blur", () => {
  if (addChatInput.value != "" && addChatInput.value != userInfo.name) {
    fetch(`/userExists?userName=${addChatInput.value}`)
      .then(data => data.json())
      .then(data => {
        if (data.status == 0) {
          addChatError.innerHTML = "User not found";
        }
        if (data.status == 1) {
          addChatError.innerHTML = "";
          let userInfo = `
            <div id="addChatUser">
              <img src="profilePictures?user=${data.id}">
              <a>
                ${data.name}
              </a>
            </div>
          `;
          addChatDiv.innerHTML += userInfo;
          choosenUserID = data.id;
        }
      });
  }
  else {
    addChatError.innerHTML = "";
  }
});

addGroupInput.addEventListener("blur", () => {
  if (addGroupInput.value != "" && addGroupInput.value != userInfo.name) {
    fetch(`/userExists?userName=${addGroupInput.value}`)
      .then(data => data.json())
      .then(data => {
        if (data.status == 0) {
          addGroupError.innerHTML = "User not found";
        }
        if (data.status == 1 && !choosenUsersIDs.includes(data.id)) {
          addGroupError.innerHTML = "";
          let userInfo = `
            <div class="addChatUser">
              <img src="profilePictures?user=${data.id}">
              <a>
                ${data.name}
              </a>
            </div>
          `;
          choosenUsers.innerHTML += userInfo;
          choosenUsersIDs.push(data.id);
          addGroupInput.value = "";
        }
      });
  }
  else {
    addGroupError.innerHTML = "";
  }
});

chatInfos.addEventListener("click", () => {
  if (chat) {
    groupInfos.style.display = "flex";
    groupInfoUsers.innerHTML = "";
    if (chatInfo.name) {
      groupInfoImg.src = `profilePictures?user=${chatInfo.groupID}`;
      groupInfoName.innerHTML = chatInfo.name;
      chatInfo.users.forEach(element => {
        if (element.id == userInfo.id) {
          groupInfoUsers.innerHTML += `<a>${element.name}<i> (You)</i></a>`;
        }
        else {
          groupInfoUsers.innerHTML += `<a>${element.name}</a>`;
        }
      });
      groupInfoLeave.innerHTML = "Delete group";
      groupInfoImg.addEventListener("click", () => {
        groupImageInput.click();
      });
      groupInfoImg.style.cursor = "pointer";
      groupAddUser.style.display = "block";
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
      groupInfoLeave.innerHTML = "Delete chat";
      groupInfoImg.removeEventListener("click", () => { });
      groupInfoImg.style.cursor = "default";
      groupAddUser.style.display = "none";
    }
  }
});

groupImageInput.addEventListener("change", () => {
  let xml = new XMLHttpRequest();
  xml.open('POST', '/changeGroupImage', true);
  let formdata = new FormData();
  formdata.append("myFile", groupImageInput.files![0]);
  formdata.append("groupID", chatInfo.groupID!);
  xml.send(formdata);
});

createButton.addEventListener("click", () => {
  if (addSelectedType == "chat" && choosenUserID && userInfo.id) {
    fetch(`/addChat?user1=${choosenUserID}&user2=${userInfo.id}`)
    addDiv.style.display = "none";
  }
  else if (addSelectedType == "group" && choosenUsersIDs && userInfo.id && addGroupName.value.trim().length > 0 && addGroupDescription.value.trim().length > 0 && addGroupImage.files!.length == 1) {
    let xml = new XMLHttpRequest();
    xml.open('POST', '/createGroup', true);
    let formdata = new FormData();
    formdata.append("myFile", addGroupImage.files![0]);
    formdata.append("groupName", addGroupName.value);
    formdata.append("groupDescription", addGroupDescription.value);
    formdata.append("users", userInfo.id);
    for (let i = 0; i < choosenUsersIDs.length; i++) {
      formdata.append("users", choosenUsersIDs[i])
    }
    xml.send(formdata);
    addDiv.style.display = "none";
  }
})

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

messageImageButton.addEventListener("click", () => {
  messageImageUpload.click();
});

messageFileButton.addEventListener("click", () => {
  messageFileUpload.click();
});

messageImageUpload.addEventListener("change", () => {
  messageTypeDiv.style.display = "none";
  uploadInfo.style.display = "block";
  messageLinkInput.style.display = "none";
  uploadInfo.innerHTML = `${messageImageUpload.files!.length} Images choosen`;
  messageType = "image";
});

messageFileUpload.addEventListener("change", () => {
  messageTypeDiv.style.display = "none";
  uploadInfo.style.display = "block";
  messageLinkInput.style.display = "none";
  uploadInfo.innerHTML = `${messageFileUpload.files!.length} Files choosen`;
  messageType = "file";
});

messageLinkButton.addEventListener("click", () => {
  messageTypeDiv.style.display = "none";
  uploadInfo.style.display = "none";
  messageLinkInput.style.display = "block";
  messageType = "link";
});

function setChat(chatID, chatLoadType) {
  chatType = chatLoadType;
  chat = chatID;
  socket.emit("joinedRoom", chatID);
  fetch(`/getChat?chatID=${chatID}&chatType=${chatType}`)
    .then(response => response.json())
    .then(data => {
      chatInfo = data;
      if (chatType == "chat") {
        if (chatInfo.users[0].id == userInfo.id) {
          chatImage.src = `profilePictures?user=${chatInfo.users[1].id}`;
          chatImage.style.display = "inline";
          chatName.innerHTML = chatInfo.users[1].name;
          bio.innerHTML = chatInfo.users[1].bio;
        }
        else if (chatInfo.users[1].id == userInfo.id) {
          chatImage.src = `profilePictures?user=${chatInfo.users[0].id}`;
          chatImage.style.display = "inline";
          chatName.innerHTML = chatInfo.users[0].name;
          bio.innerHTML = chatInfo.users[0].bio;
        }
      }
      else if (chatType == "group") {
        chatImage.src = `profilePictures?user=${chatInfo.groupID}`;
        chatImage.style.display = "inline";
        chatName.innerHTML = chatInfo.name;
        bio.innerHTML = chatInfo.description!;
      }
      messages.innerHTML = "";
      chatInfo.messages.sort((a, b) => {
        a.sendedAt = new Date(a.sendedAt);
        b.sendedAt = new Date(b.sendedAt)
        return a.sendedAt.getTime() - b.sendedAt.getTime();
      });
      chatInfo.messages.forEach(element => {
        renderMessage(element.userName, element.type, element.messageID, element.messageFiles, element.link, element.text)
      });
    });
  if (window.innerWidth <= 800 && chat) {
    chatList.style.display = "none";
    messageDiv.style.display = "block";
  }
}

function back() {
  chat = "";
  chatList.style.display = "flex";
  messageDiv.style.display = "none";
  socket.emit("leavedRoom", { chatID: chat })
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
      let user: { name: string, id: string } = data.name == element.users[0].name ? element.users[1] : element.users[0];
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

socket.on("connected", (users: string[]) => {
  users.forEach(element => {
    if (chatNameList.includes(element)) {
      chatList.children[chatNameList.indexOf(element) + 1].querySelector("div")!.style.backgroundColor = "rgb(86, 255, 100)";
    }
  });
});

socket.on("disconnected", (user: string) => {
  if (chatNameList.includes(user)) {
    chatList.children[chatNameList.indexOf(user) + 1].querySelector("div")!.style.backgroundColor = "rgb(100, 100, 100)";
  }
});

socket.on("message", (message: socketMessage) => {
  if (message.type == "image" && message.userName == userInfo.name) {
    for (var i = 0; i < messageImageUpload.files!.length; i++) {
      if (["png", "jpeg", "jpg"].includes(messageImageUpload.files![i].name.split(".")[1].toLowerCase())) {
        var xml = new XMLHttpRequest();
        xml.open('POST', '/uploadImage', true);
        var formdata = new FormData();
        formdata.append("myFile", messageImageUpload.files![i]);
        formdata.append("messageID", message.messageID);
        xml.send(formdata);
      }
    };
    setTimeout(() => { }, messageImageUpload.files!.length * 300)
    messageImageUpload.value = "";
  }
  if (message.type == "file" && message.userName == userInfo.name) {
    for (i = 0; i < messageFileUpload.files!.length; i++) {
      var xml = new XMLHttpRequest();
      xml.open('POST', '/uploadFile', true);
      var formdata = new FormData();
      formdata.append("myFile", messageFileUpload.files![i]);
      formdata.append("messageID", message.messageID);
      xml.send(formdata);
    };
    setTimeout(() => { }, messageFileUpload.files!.length * 300)
    messageFileUpload.value = "";
  }
  if (message.chatID == chat || message.groupID == chat) {
    renderMessage(message.userName, message.type, message.messageID, message.messageFiles, message.link, message.text);
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

btnSend.addEventListener("click", () => {
  if (textInput.value.trim().length != 0 && chatInfo && messageType == "text") {
    var text = textInput.value.replace(/\n/g, "<br>");
    socket.emit("message", { text: text, type: "text", userName: userInfo.name, chatType: chatType, chat: chat });
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
  }
  else if (messageType == "image" && chatInfo) {
    let imageList: { name: string }[] = [];
    for (var i = 0; i < messageImageUpload.files!.length; i++) {
      if (["png", "jpeg", "jpg"].includes(messageImageUpload.files![i].name.split(".")[1].toLowerCase())) {
        imageList.push({ name: messageImageUpload.files![i].name });
      }
    };
    var text = textInput.value.replace(/\n/g, "<br>");
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
    uploadInfo.style.bottom = "40px";
    uploadInfo.style.display = "none";
    messageType = "text";
    socket.emit("message", { text: text, type: "image", messageFiles: imageList, userName: userInfo.name, chat: chat, chatType: chatType });
  }
  else if (messageType == "link" && chatInfo && messageLinkInput.value.trim().length != 0) {
    var text = textInput.value.replace(/\n/g, "<br>");
    socket.emit("message", { text: text, type: "link", link: messageLinkInput.value, userName: userInfo.name, chatType: chatType, chat: chat });
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
    messageLinkInput.style.display = "none";
    messageLinkInput.value = "";
    messageLinkInput.style.bottom = "40px";
    messageType = "text";
  }
  else if (messageType == "file" && chatInfo) {
    var fileList: { name: string }[] = [];
    for (i = 0; i < messageFileUpload.files!.length; i++) {
      fileList.push({ name: messageFileUpload.files![i].name });
    };
    var text = textInput.value.replace(/\n/g, "<br>");
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
    uploadInfo.style.bottom = "40px";
    uploadInfo.style.display = "none";
    messageType = "text";
    socket.emit("message", { text: text, type: "file", messageFiles: fileList, userName: userInfo.name, chatType: chatType, chat: chat });
  }
});