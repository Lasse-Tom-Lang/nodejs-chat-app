const fs = require('fs');

// Setup server
const http = require('http');
const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const oneDay = 1000 * 60 * 60 * 24;
var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(8080);

// Loding user data
const usersInfo = JSON.parse(fs.readFileSync('data/users.json')).users;

/**
 * @param {string} user Username to check
 * @param {string} password Password to check
 * @return {string} Gives back if login is correct
 */
function testLogin(user, password) {
  if (user && password) {
    correct = false;
    usersInfo.forEach(element => {
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

// Setup sessions

app.use(sessions({
  secret: ".f2.97rrh34?r318b24!82rb",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

app.use(cookieParser());

app.get('/getSession', (req, res) => {
  res.send(req.session.user);
});

// Setup pages
app.get('/', (req, res) => {
  if (req.session.user) {
    res.write(fs.readFileSync("../app/index.html"));
    res.end();
  }
  else {
    res.write(fs.readFileSync("../app/login.html"));
    res.end();
  }
});

app.get('/style.css', (req, res) => {
  res.write(fs.readFileSync("../app/style.css"));
  res.end();
});

app.get('/app.js', (req, res) => {
  res.write(fs.readFileSync("../app/app.js"));
  res.end();
});

app.get('/userauthentification', (req, res) => {
  answer = testLogin(req.query.user, req.query.password);
  if (answer == "Login correct") {
    req.session.user = req.query.user;
  }
  res.write(answer);
  res.end();
});

app.get('/profilePictures', (req, res) => {
  res.sendFile("data/userImages/" + req.query.user + ".png", { root : __dirname});
});

app.get("/getUserInfos", (req, res) => {
  if (req.session.user) {
    for (i=0; i < usersInfo.length; i++) {
      if (usersInfo[i].name == req.session.user) {
        res.write(JSON.stringify(usersInfo[i]));
        res.end();
      }
    }
  }
  else {
    res.write("Not logged in");
    res.end();
  }
});

// Setup socket.io

const users = {};

io.on("connection", (socket) => {
  socket.on("connected", (user) => {
    users[user] = socket.id;
    io.emit("connected", Object.keys(users));
  });

  socket.on("disconnect", () => {
    userName = Object.keys(users).find(key => users[key] === socket.id);
    delete users[userName];
    io.emit("disconnected", (userName));
  })

  socket.on("message", (message) => {
    io.emit("message", message);
  });
});