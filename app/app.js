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
    socket.emit("message", {text: text, user: user});
    textInput.value = "";
    textInput.style.height = "30px";
    textInput.style.borderTopLeftRadius = "0px";
    textInput.style.borderTopRightRadius = "0px";
  }
});