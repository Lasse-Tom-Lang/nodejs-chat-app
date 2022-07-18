const socket = io("ws://localhost:8080");

const user = "Test user"

// var passhash = CryptoJS.MD5(password).toString();

textInput = document.getElementById("messageInput");
messages = document.getElementById("messages");

socket.on("message", message => {
  el = document.createElement("div");
  el.classList = message.user == user?"ownMessage":"otherMessage";
  el.innerHTML = "<p>" + message.text + "</p><a>" + message.user +"</a>";
  messages.appendChild(el);
});

document.getElementById("btn-send").addEventListener("click",  () => {
  socket.emit("message", {text: textInput.value, user: user});
});