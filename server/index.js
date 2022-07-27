const fs = require('fs');

// Setup server
const http = require('http');
const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload');
const sessions = require('express-session');
const oneDay = 1000 * 60 * 60 * 24;
var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(8080);

// Loding user data
usersInfo = JSON.parse(fs.readFileSync('data/users.json')).users;
chatInfo = JSON.parse(fs.readFileSync('data/chats.json'))

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

// Setup pages

app.use(
  fileUpload()
);

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

app.get('/messageImages', (req, res) => {
  res.sendFile("data/Uploads/Images/" + req.query.messageID + "/" + req.query.imageName, { root : __dirname});
});

app.get("/getUserInfos", (req, res) => {
  if (req.session.user) {
    for (i=0; i < usersInfo.length; i++) {
      if (usersInfo[i].name == req.session.user) {
        res.json(usersInfo[i]);
        res.end();
      }
    }
  }
  else {
    res.write("Not logged in");
    res.end();
  }
});

app.get("/getChat", (req, res) => {
  if (req.session.user) {
    if (req.query.chatID && req.query.chatType) {
      if (req.query.chatType == "chat") {
        chatInfo.chats.forEach(element => {
          if (element.id == req.query.chatID) {
            element.users.forEach(elementUser => {
              if (elementUser.name == req.session.user) {
                res.json(element);
                res.end();
                return;
              }
            });
            return;
          }
        });
      }
      if (req.query.chatType == "group") {
        chatIndex = chatInfo.groups.map((a) => {return a.id;}).indexOf(parseInt(req.query.chatID));
        if (chatIndex != -1) {
          if (chatInfo.groups[chatIndex].users.map((a) => {return a.name;}).includes(req.session.user)) {
            res.json(chatInfo.groups[chatIndex]);
            res.end();
          }
        }
      }
    }
    else {
      res.write("No chat selected");
      res.end();
    }
  }
  else {
    res.write("Not logged in");
    res.end();
  }
});

app.post("/uploadImage", (req, res) => {
  file = req.files.myFile;
  path = __dirname + "/data/Uploads/Images" + req.body.id;
  if (!fs.existsSync(path)) fs.mkdir(path, () => {});
  file.mv(path + "/" + file.name, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    return res.send({ status: "success", path: path });
  });
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
    message.sendTo.forEach(element => {
      if (users[element]) {
        socket.broadcast.to(users[element]).emit("message", message);
      }
    });
  });
});