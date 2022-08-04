const fs = require('fs');

// Setup server
const http = require('http');
const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload');
const sessions = require('express-session');
const oneDay = 86400000;
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
      return { "status": 0, "errorMessage": "Login data incorrect" };
    }
    else {
      return { "status": 1 };
    }
  }
  else {
    return { "status": 0, "errorMessage": "Data missing" };
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

app.get("/profile", (req, res) => {
  if (req.session.user) {
    res.write(fs.readFileSync("../app/profile.html"));
    res.end();
  }
  else {
    res.redirect('/');
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
  if (answer.status == 1) {
    req.session.user = req.query.user;
  }
  res.json(answer);
  res.end();
});

app.get('/profilePictures', (req, res) => {
  if (fs.existsSync("data/userImages/" + req.query.user + ".png")) res.sendFile("data/userImages/" + req.query.user + ".png", { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get('/messageImages', (req, res) => {
  if (fs.existsSync("data/Uploads/Images/" + req.query.chatID + "/" + req.query.messageID + "/" + req.query.imageName)) res.sendFile("data/Uploads/Images/" + req.query.chatID + "/" + req.query.messageID + "/" + req.query.imageName, { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get("/getUserInfos", (req, res) => {
  if (req.session.user) {
    for (i = 0; i < usersInfo.length; i++) {
      if (usersInfo[i].name == req.session.user) {
        res.json(usersInfo[i]);
        res.end();
      }
    }
  }
  else {
    res.json({ "status": 0, "errorMessage": "Not logged in" });
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
        chatIndex = chatInfo.groups.map((a) => { return a.id; }).indexOf(parseInt(req.query.chatID));
        if (chatIndex != -1) {
          if (chatInfo.groups[chatIndex].users.map((a) => { return a.name; }).includes(req.session.user)) {
            res.json(chatInfo.groups[chatIndex]);
            res.end();
          }
        }
      }
    }
    else {
      res.json({ "status": 0, "errorMessage": "Data missing" });
      res.end();
    }
  }
  else {
    res.json({ "status": 0, "errorMessage": "Not logged in" });
    res.end();
  }
});

app.post("/uploadImage", (req, res) => {
  file = req.files.myFile;
  path = __dirname + "/data/Uploads/Images/" + req.body.chatID + "/" + req.body.messageID;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(path + "/" + file.name, (err) => {
    if (err) {
      return res.send({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.send({ "status": 1 });
  });
});

app.post("/uploadFile", (req, res) => {
  file = req.files.myFile;
  path = __dirname + "/data/Uploads/Files/" + req.body.chatID + "/" + req.body.messageID;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(path + "/" + file.name, (err) => {
    if (err) {
      return res.send({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.send({ "status": 1 });
  });
});

app.post("/changeProfilePicture", (req, res) => {
  file = req.files.myFile;
  path = __dirname + "/data/userImages/";
  usersInfo.forEach(element => {
    if (element.name == req.session.user) userID =  element.id; return
  })
  file.mv(path + userID + ".png", (err) => {
    if (err) {
      return res.send({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.send({ "status": 1 });
  });
});

app.use("/fileDownload/:fileName", (req, res) => {
  if (fs.existsSync("data/Uploads/Files/" + req.query.chatID + "/" + req.query.messageID + "/" + req.params.fileName)) {
    res.sendFile("data/Uploads/Files/" + req.query.chatID + "/" + req.query.messageID + "/" + req.params.fileName, { root: __dirname });
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
    message.sendTo.forEach(element => {
      if (users[element]) {
        socket.broadcast.to(users[element]).emit("message", message);
      }
    });
  });
});