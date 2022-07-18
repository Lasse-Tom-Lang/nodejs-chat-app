const url = require("url");
var crypto = require('crypto'); // console.log(crypto.createHash('md5').update("test").digest('hex'));
const fs = require('fs');

const userPassword = JSON.parse(fs.readFileSync('data/users.json')).users;

/**
 * @param {string} user Username to check
 * @param {string} password Password to check
 * @return {string} Gives back if login is correct
 */
function testLogin(user, password) {
  if (user && password) {
    correct = false;
    userPassword.forEach(element => {
      if (element.name == user && element.password == password) {
        correct = true;
        return;
      }
    });
    if (!correct) {
      return "Login incorrect";
    }
    else {
      return "Login correct";
    }
  }
  else {
    return "Missing values";
  }
}

const http = require("http").createServer((req, res) => {
  path = url.parse(req.url,true).pathname;
  urldata = url.parse(req.url,true).query;
  switch (path) {
    case "/userauthentification":
      res.write(testLogin(urldata.user, urldata.password));
      res.end();
      break;
    default:
      res.write('Page not found');
      res.end();
  }
});

const io = require("socket.io")(http, {
  cors: {origin: "*"}
});

io.on("connection", (socket) => {
  socket.on("message", (message) => {
    io.emit("message", message);
  });
});

http.listen(8080, () => {
  console.log("Listen on port 8080")
});