var crypto = require('crypto'); // console.log(crypto.createHash('md5').update("test").digest('hex'));
const fs = require('fs');

// Setup server
const url = require("url");
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

// Setup sessions

app.use(sessions({
  secret: ".f2.97rrh34?r318b24!82rb",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

app.use(cookieParser());

app.get('/setSession', function(req, res) {
  urldata = url.parse(req.url, true).query;
  req.session.user = { name:urldata.username};
  res.send('Session set');
  res.end();
});

app.get('/getSession', function(req, res) {
  res.send(req.session.user);
});

// Setup pages
app.get('/', function (req, res) {
  if (req.session.user) {
    res.write(fs.readFileSync("../app/index.html"));
    res.end();
  }
  else {
    res.write(fs.readFileSync("../app/login.html"));
    res.end();
  }
});

app.get('/style.css', function (req, res) {
  res.write(fs.readFileSync("../app/style.css"));
  res.end();
});

app.get('/app.js', function (req, res) {
  res.write(fs.readFileSync("../app/app.js"));
  res.end();
});

app.get('/userauthentification', function (req, res) {
  urldata = url.parse(req.url, true).query;
  res.write(testLogin(urldata.user, urldata.password));
  res.end();
});

app.get('/profilePictures', function (req, res) {
  urldata = url.parse(req.url, true).query;
  res.sendFile("data/userImages/" + urldata.user + ".png", { root : __dirname});
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