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

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient()

async function test() {
  // data = await prisma.chat.create({
  //   data: {
  //     users: {connect: [{name: "Test"}]},
  //   }
  // })
  // console.log(data)
  var data = await prisma.user.findFirst(
    {
      where: {
        name: {in: ["Test", "User"]}
      },
      select:{
        chats: true
      }
    }
  )
  var a = 0
  await data.chats.forEach(async chat => { 
    test = await prisma.chat.findUnique(
      {
        where: {
          chatID: chat.chatID
        },
        include: {
          users: {
            select: {
              name: true
            }
          }
        }
      }
    )
    data.chats[a] = Object.assign(data.chats[a], test)
    a++
  });
  // data = await prisma.user.update(
  //   {
  //     where: {name: "Test"},
  //     data: {
  //       chats: {connect: [{chatID: '9d997e39-64c5-4a8c-8f2f-00a13bc02275'}]}
  //     }
  //   }
  // )
}
test()

usersInfo = JSON.parse(fs.readFileSync('data/users.json')).users;
chatInfo = JSON.parse(fs.readFileSync('data/chats.json'))

/**
 * @param {string} user Username to check
 * @param {string} password Password to check
 * @return {string} Gives back if login is correct
 */
async function testLogin(user, password) {
  if (user && password) {
    userData = await prisma.user.findFirst({
      where: {
        name: user,
        password: password
      }
    });
    if (!userData) {
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

app.get('/userauthentification', async (req, res) => {
  answer = await testLogin(req.query.user, req.query.password);
  if (answer.status == 1) {
    req.session.user = req.query.user;
  }
  res.json(answer);
  res.end();
});

app.get('/profilePictures', (req, res) => {
  if (fs.existsSync(`data/userImages/${req.query.user}.png`)) res.sendFile(`data/userImages/${req.query.user}.png`, { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get('/messageImages', (req, res) => {
  if (fs.existsSync(`data/Uploads/Images/${req.query.chatID}/${req.query.messageID}/${req.query.imageName}`)) res.sendFile(`data/Uploads/Images/${req.query.chatID}/${req.query.messageID}/${req.query.imageName}`, { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get("/getUserInfos", async (req, res) => {
  if (req.session.user) {
    data = await prisma.user.findFirst(
      {
        where: {
          name: req.session.user
        },
        select:{
          chats: true,
          name: true,
          id: true
        }
      }
    )
    test = await prisma.chat.findMany(
      {
        where: {
          chatID: {in: data.chats.chatID}
        },
        include: {
          users: {
            select: {
              name: true,
              id: true
            }
          }
        }
      }
    )
    data.chats = test;
    res.json(data);
    res.end();
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
  path = __dirname + `/data/Uploads/Images/${req.body.chatID}/${req.body.messageID}`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${file.name}`, (err) => {
    if (err) {
      return res.send({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.send({ "status": 1 });
  });
});

app.post("/uploadFile", (req, res) => {
  file = req.files.myFile;
  path = __dirname + `/data/Uploads/Files/${req.body.chatID}/${req.body.messageID}`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${file.name}`, (err) => {
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
  if (fs.existsSync(`data/Uploads/Files/${req.query.chatID}/${req.query.messageID}/${req.params.fileName}`)) {
    res.sendFile(`data/Uploads/Files/${req.query.chatID}/${req.query.messageID}/${req.params.fileName}`, { root: __dirname });
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
    chatInfo.chats.forEach((element, count) => {
      if (element.id == message.chat) {
        newMessage = {type: message.type, text: message.text, date: new Date(), user: message.user};
        if (message.type != "text") {
          newMessage.messageID = message.messageID;
          switch (message.type) {
            case "link":
              newMessage.link = message.link;
              break;
            case "file":
              newMessage.files = message.files;
              break;
            case "image":
              newMessage.images = message.images;
              break;
          }
        }
        chatInfo.chats[count].messages.push(newMessage);
        return;
      }
    });
    chatInfo.groups.forEach((element, count) => {
      if (element.id == message.chat) {
        newMessage = {type: message.type, text: message.text, date: new Date(), user: message.user};
        if (message.type != "text") {
          newMessage.messageID = message.messageID;
          switch (message.type) {
            case "link":
              newMessage.link = message.link;
              break;
            case "file":
              newMessage.files = message.files;
              break;
            case "image":
              newMessage.images = message.images;
              break;
          }
        }
        chatInfo.groups[count].messages.push(newMessage);
        return;
      }
    });
    message.sendTo.forEach(element => {
      if (users[element]) {
        socket.broadcast.to(users[element]).emit("message", message);
      }
    });
  });
});