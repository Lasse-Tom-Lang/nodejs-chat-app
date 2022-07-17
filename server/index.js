const http = require("http").createServer();

const io = require("socket.io")(http, {
  cors: {origin: "*"}
});

io.on("connection", (socket) => {
  console.log("Connected")
  socket.on("message", (message) => {
    io.emit("message", message);
  });
});

http.listen(5500, () => {
  console.log("Listen on port 5500")
});