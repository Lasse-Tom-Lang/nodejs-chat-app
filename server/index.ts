import fs from 'fs';
import figlet from 'figlet';
import gradient from "gradient-string";

// Setup server
import http from 'http';
import express, { Express, Request } from 'express';
const app: Express = express();
import fileUpload from 'express-fileupload';
import sessions from 'express-session';
const oneDay = 86400000;
var server = http.createServer(app);
import { Socket } from 'socket.io';
var io: Socket = require('socket.io')(server);
server.listen(8080, () => {
  console.log(gradient.rainbow.multiline(figlet.textSync('Server started'), { interpolation: 'hsv' }));
  console.log("Listening on port 8080");
});

// Loding user data

import { Message, Prisma, PrismaClient } from "@prisma/client";
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

declare global {
  namespace Express {
    interface Session {
      user: string
    }
  }
}

app.use(sessions({
  secret: ".f2.97rrh34?r318b24!82rb",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

// Setup pages

app.use(
  fileUpload()
);

app.get('/', (req, res) => {
  if (req.session!.user) {
    res.write(fs.readFileSync("../app/index.html"));
    res.end();
  }
  else {
    res.write(fs.readFileSync("../app/login.html"));
    res.end();
  }
});

app.get("/profile", (req, res) => {
  if (req.session!.user) {
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
  let answer = await testLogin(req.query.user, req.query.password);
  if (answer.status == 1) {
    req.session!.user = req.query.user;
  }
  res.json(answer);
  res.end();
});

app.get('/profilePictures', (req, res) => {
  if (fs.existsSync(`data/userImages/${req.query.user}.png`)) res.sendFile(`data/userImages/${req.query.user}.png`, { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get('/messageImages', (req, res) => {
  if (fs.existsSync(`data/Uploads/Images/${req.query.messageID}/${req.query.imageName}`)) res.sendFile(`data/Uploads/Images/${req.query.messageID}/${req.query.imageName}`, { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get("/getUserInfos", async (req, res) => {
  if (req.session!.user) {
    let data = await prisma.user.findFirst(
      {
        where: {
          name: req.session!.user
        },
        include: {
          chats: {
            include: {
              users: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
          },
          groups: {
            include: {
              users: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
          }
        }
      }
    );
    res.json(data);
    res.end();
  }
  else {
    res.json({ "status": 0, "errorMessage": "Not logged in" });
    res.end();
  }
});

app.get("/getChat", (req, res) => {
  if (req.session!.user) {
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
                messages: {
                  include: {
                    messageFiles: true
                  }
                }
              }
            });
            res.json(data);
            res.end();
          }
        )();
      }
      if (req.query.chatType == "group") {
        (
          async () => {
            let data = await prisma.group.findFirst({
              where: {
                groupID: req.query.chatID
              },
              include: {
                users: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                messages: {
                  include: {
                    messageFiles: true
                  }
                }
              }
            })
            res.json(data)
            res.end()
          }
        )();
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
  let file = req.files!.myFile;
  let path = __dirname + `/data/Uploads/Images/${req.body.messageID}`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${file.name}`, (err: Error) => {
    if (err) {
      return res.json({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.json({ "status": 1 });
  });
});

app.post("/uploadFile", (req, res) => {
  let file = req.files!.myFile;
  let path = __dirname + `/data/Uploads/Files/${req.body.messageID}`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${file.name}`, (err: Error) => {
    if (err) {
      return res.json({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.json({ "status": 1 });
  });
});

app.post("/changeProfilePicture", async (req, res) => {
  if (req.session!.user) {
    let file = req.files!.myFile;
    let path = __dirname + "/data/userImages/";
    let userInfo = await prisma.user.findUnique({
      where: {
        name: req.session!.user
      }
    })
    file.mv(path + userInfo!.id + ".png", (err: Error) => {
      if (err) {
        return res.json({ "status": 0, "errorMessage": "Something went wrong" });
      }
      return res.json({ "status": 1 });
    });
  }
});

app.use("/fileDownload/:fileName", (req, res) => {
  if (fs.existsSync(`data/Uploads/Files/${req.query.messageID}/${req.params.fileName}`)) {
    res.sendFile(`data/Uploads/Files/${req.query.messageID}/${req.params.fileName}`, { root: __dirname });
  }
});

// Setup socket.io

let users: { [key: string]: string } = {};

interface socketMessage {
  sendTo: string[],
  messageID: string,
  text: string,
  type: "text" | "file" | "image" | "link",
  chatType: "chat" | "group",
  chat: string,
  userName: string,
  link: string,
  messageFiles: {
    name: string
  }[]
}

io.on("connection", (socket: Socket) => {
  socket.on("connected", (user: string) => {
    users[user] = socket.id;
    io.emit("connected", Object.keys(users));
  });

  socket.on("disconnect", () => {
    let userName: string = Object.keys(users).find(key => users[key] === socket.id)!;
    delete users[userName];
    io.emit("disconnected", (userName));
  })

  socket.on("joinedRoom", (chatID) => {
    socket.join(chatID);
  })

  socket.on("leavedRoom", (chatID) => {
    socket.leave(chatID)
  })

  socket.on("message", async (message: socketMessage) => {
    let newMessage: Message
    if (message.type == "text") {
      if (message.chatType == "chat") {
        newMessage = await prisma.message.create({
          data: {
            chatID: message.chat,
            type: message.type,
            text: message.text,
            userName: message.userName
          }
        })
      }
      if (message.chatType == "group") {
        newMessage = await prisma.message.create({
          data: {
            groupID: message.chat,
            type: message.type,
            text: message.text,
            userName: message.userName
          }
        })
      }
    }
    if (message.type == "link") {
      if (message.chatType == "chat") {
        newMessage = await prisma.message.create({
          data: {
            chatID: message.chat,
            type: message.type,
            text: message.text,
            userName: message.userName,
            link: message.link
          }
        })
      }
      if (message.chatType == "group") {
        newMessage = await prisma.message.create({
          data: {
            groupID: message.chat,
            type: message.type,
            text: message.text,
            userName: message.userName,
            link: message.link
          }
        })
      }
    }
    if (message.type == "image" || message.type == "file") {
      if (message.chatType == "chat") {
        newMessage = await prisma.message.create({
          data: {
            chatID: message.chat,
            type: message.type,
            text: message.text,
            userName: message.userName
          }
        })
      }
      if (message.chatType == "group") {
        newMessage = await prisma.message.create({
          data: {
            groupID: message.chat,
            type: message.type,
            text: message.text,
            userName: message.userName
          }
        })
      }
      await prisma.messageFile.createMany({
        data: message.messageFiles.map((file) => {
          return {
            name: file.name,
            messageID: newMessage.messageID
          }
        })
      });
      newMessage = await prisma.message.findUnique({
        where: {
          messageID: newMessage!.messageID
        },
        include: {
          messageFiles: true
        }
      });
    }
    io.to(message.chat).emit("message", newMessage!);
  });
});