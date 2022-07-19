var crypto = require('crypto'); // console.log(crypto.createHash('md5').update("test").digest('hex'));
const fs = require('fs');

// Setup server
const url = require("url");
const http = require('http');
const express = require('express');
const app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(8080);

//Loding user data
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

// Setup pages
app.get('/', function (req, res) {
  res.write(fs.readFileSync("../app/index.html"));
  res.end();
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
  urldata = url.parse(req.url,true).query;
  res.write(testLogin(urldata.user, urldata.password));
  res.end();
});

//Setup socket.io
io.on("connection", (socket) => {
  socket.on("message", (message) => {
    io.emit("message", message);
  });
});