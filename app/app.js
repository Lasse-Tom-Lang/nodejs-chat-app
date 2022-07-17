const socket = io("ws://localhost:5500");

socket.on("message", text => {
  el = document.createElement("li");
  el.innerHTML = text;
  document.querySelector("ul").appendChild(el);
});

document.querySelector("button").onclick = () => {
  text = document.querySelector("input").value;
  socket.emit("message", text);
}