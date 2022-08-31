import fs from 'fs';

// Setup server
import http from 'http';
import express, { Express, Request, Response } from 'express';
const app: Express = express();
import cookieParser from "cookie-parser";
import fileUpload from 'express-fileupload';
import sessions, { Session } from 'express-session';
const oneDay = 86400000;
var server = http.createServer(app);
import { Socket } from 'socket.io';
var io = require('socket.io')(server);
server.listen(8080);

// Loding user data

import { PrismaClient } from "@prisma/client";
const prisma: PrismaClient = new PrismaClient();

async function testLogin(user: string, password: string) {
  if (user && password) {
    let userData = await prisma.user.findFirst({
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

interface userAuthentificationQuery {
  user: string
  password: string
}

app.get('/userauthentification', async (req: Request<"", "", "", userAuthentificationQuery>, res) => {
  let answer = await testLogin(req.query.user, req.query.password);
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
    let data = await prisma.user.findFirst(
      {
        where: {
          name: req.session.user
        },
        select: {
          chats: true,
          groups: true,
          name: true,
          id: true
        }
      }
    );
    let chatUsers = await prisma.chat.findMany(
      {
        where: {
          chatID: { in: data.chats.chatID }
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
    );
    let groupUsers = await prisma.group.findMany(
      {
        where: {
          groupID: { in: data?.groups.groupID }
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
    );
    data.chats = chatUsers;
    data.groups = groupUsers;
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
        (
          async () => {
            let data = await prisma.chat.findFirst({
              where: {
                chatID: req.query.chatID
              },
              include: {
                users: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                messages: true
              }
            })
            res.json(data)
            res.end()
          }
        )();
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
  let file = req.files.myFile;
  let path = __dirname + `/data/Uploads/Files/${req.body.chatID}/${req.body.messageID}`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${file.name}`, (err) => {
    if (err) {
      return res.send({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.send({ "status": 1 });
  });
});

app.post("/changeProfilePicture", (req, res) => {
  let file = req.files.myFile;
  let path = __dirname + "/data/userImages/";
  usersInfo.forEach(element => {
    if (element.name == req.session.user) userID = element.id; return
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

let users:{[key: string]:string } = {};

io.on("connection", (socket: Socket) => {
  socket.on("connected", (user:string) => {
    users[user] = socket.id;
    io.emit("connected", Object.keys(users));
  });

  socket.on("disconnect", () => {
    let userName:string = Object.keys(users).find(key => users[key] === socket.id)!;
    delete users[userName];
    io.emit("disconnected", (userName));
  })

  socket.on("message", (message) => {
    chatInfo.chats.forEach((element, count) => {
      if (element.id == message.chat) {
        var newMessage = { type: message.type, text: message.text, date: new Date(), user: message.user };
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
        var newMessage = { type: message.type, text: message.text, date: new Date(), user: message.user };
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