import fs from 'fs';
import figlet from 'figlet';
import gradient from "gradient-string";

// Setup server
import http from 'http';
import express, { Express, Request } from 'express';
const app: Express = express();
import fileUpload, { UploadedFile } from 'express-fileupload';
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

declare module 'express-session' {
  interface SessionData {
    user: string
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

if (!fs.existsSync(__dirname + "/data/uploads"))  fs.mkdirSync(__dirname + "/data/uploads");
if (!fs.existsSync(__dirname + "/data/uploads/images")) fs.mkdir(__dirname + "/data/uploads/images", () => { });
if (!fs.existsSync(__dirname + "/data/uploads/files")) fs.mkdir(__dirname + "/data/uploads/files", () => { });

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
  let user = req.query.user as string;
  let password = req.query.password as string;
  let answer = await testLogin(user, password);
  if (answer.status == 1) {
    req.session.user = user;
  }
  res.json(answer);
  res.end();
});

app.get('/profilePictures', (req, res) => {
  if (fs.existsSync(`data/userImages/${req.query.user}.png`)) res.sendFile(`data/userImages/${req.query.user}.png`, { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get('/messageImages', (req, res) => {
  if (fs.existsSync(`data/uploads/images/${req.query.messageID}/${req.query.imageName}`)) res.sendFile(`data/uploads/images/${req.query.messageID}/${req.query.imageName}`, { root: __dirname });
  else res.sendFile("imageError.png", { root: __dirname });
});

app.get("/getUserInfos", async (req, res) => {
  if (req.session.user) {
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
  let chatID = req.query.chatID as string;
  if (req.session.user) {
    if (req.query.chatID && req.query.chatType) {
      if (req.query.chatType == "chat") {
        (
          async () => {
            let data = await prisma.chat.findFirst({
              where: {
                chatID: chatID
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
                groupID: chatID
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

app.get("/userExists", async (req, res) => {
  let userName = req.query.userName as string;
  let user = await prisma.user.findFirst({
    where: {
      name: userName
    }
  });
  if (user) {
    res.json({ "status": 1, "id": user.id, "name": user.name })
  }
  else {
    res.json({ "status": 0 })
  }
});

app.get("/addChat", async (req, res) => {
  let user1 = req.query.user1 as string;
  let user2 = req.query.user2 as string;
  if (req.query.user1 && req.query.user2) {
    let data = await prisma.chat.create({
      data: {
        users: {
          connect: [
            {
              id: user1,
            },
            {
              id: user2
            }
          ]
        }
      }
    });
  }
})

app.get("/deleteChat", async (req, res) => {
  let chatID = req.query.chatID as string;
  let messages = await prisma.message.findMany({
    where: {
      chatID: chatID
    },
    include: {
      messageFiles: true
    }
  });
  messages.forEach((message) => {
    if (message.type == "file") {
      fs.rmSync(`data/uploads/files/${message.messageID}`, { recursive: true, force: true })
    }
    if (message.type == "image") {
      fs.rmSync(`data/uploads/images/${message.messageID}`, { recursive: true, force: true })
    }
  });

  await prisma.chat.delete({
    where: {
      chatID: chatID
    }
  });

  await prisma.messageFile.deleteMany({
    where: {
      messageID: { in: messages.map((message => { return message.messageID })) }
    }
  });

  await prisma.message.deleteMany({
    where: {
      messageID: { in: messages.map((message => { return message.messageID })) }
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.user = undefined;
  res.end();
})

app.get("/deleteGroup", async (req, res) => {
  let groupID = req.query.groupID as string;
  fs.unlinkSync(`data/userImages/${groupID}.png`);
  let messages = await prisma.message.findMany({
    where: {
      groupID: groupID
    },
    include: {
      messageFiles: true
    }
  });
  messages.forEach((message) => {
    if (message.type == "file") {
      fs.rmSync(`data/uploads/files/${message.messageID}`, { recursive: true, force: true })
    }
    if (message.type == "image") {
      fs.rmSync(`data/uploads/images/${message.messageID}`, { recursive: true, force: true })
    }
  });

  await prisma.group.delete({
    where: {
      groupID: groupID
    }
  });

  await prisma.messageFile.deleteMany({
    where: {
      messageID: { in: messages.map((message => { return message.messageID })) }
    }
  });

  await prisma.message.deleteMany({
    where: {
      messageID: { in: messages.map((message => { return message.messageID })) }
    }
  });
});

app.post("/createGroup", async (req, res) => {
  let group = await prisma.group.create({
    data: {
      name: req.body.groupName,
      users: {
        connect: req.body.users.map((user: string) => {
          return {
            id: user
          }
        })
      }
    }
  }
  );
  let file = req.files!.myFile as UploadedFile;
  let path = __dirname + `/data/userImages`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${group.groupID}.png`, (err: Error) => {
    if (err) {
      return res.json({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.json({ "status": 1 });
  });
});

app.post("/createUser", async (req, res) => {
  let user = await prisma.user.create({
    data: {
      name: req.body.name,
      password: req.body.password
    }
  }
  );
  let file = req.files!.myFile as UploadedFile;
  let path = __dirname + `/data/userImages`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${user.id}.png`, (err: Error) => {
    if (err) {
      return res.json({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.json({ "status": 1 });
  });
});

app.post("/changeGroupImage", (req, res) => {
  let file = req.files!.myFile as UploadedFile;
  let path = __dirname + `/data/userImages`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${req.body.groupID}.png`, (err: Error) => {
    if (err) {
      return res.json({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.json({ "status": 1 });
  });
});

app.post("/uploadImage", (req, res) => {
  let file = req.files!.myFile as UploadedFile;
  let path = __dirname + `/data/uploads/images/${req.body.messageID}`;
  if (!fs.existsSync(path)) fs.mkdir(path, () => { });
  file.mv(`${path}/${file.name}`, (err: Error) => {
    if (err) {
      return res.json({ "status": 0, "errorMessage": "Something went wrong" });
    }
    return res.json({ "status": 1 });
  });
});

app.post("/uploadFile", (req, res) => {
  let file = req.files!.myFile as UploadedFile;
  let path = __dirname + `/data/uploads/files/${req.body.messageID}`;
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
    let file = req.files!.myFile as UploadedFile;
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
  if (fs.existsSync(`data/uploads/files/${req.query.messageID}/${req.params.fileName}`)) {
    res.sendFile(`data/uploads/files/${req.query.messageID}/${req.params.fileName}`, { root: __dirname });
  }
});

app.use("/changePassword", async (req, res) => {
  let oldPassword = req.query.oldPassword as string;
  let newPassword = req.query.newPassword as string;
  if (req.query.oldPassword && req.query.newPassword && req.session.user) {
    let userExists = await prisma.user.findFirst({
      where: {
        name: req.session!.user,
        password: oldPassword
      }
    });
    if (userExists) {
      await prisma.user.update({
        where: {
          name: req.session.user
        },
        data: {
          password: newPassword
        }
      })
      res.json({ "status": 1 })
    }
    else {
      res.json({ "status": 0, "errorMessage": "Wrong password" })
    }
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
      }) as Message;
    }
    io.to(message.chat).emit("message", newMessage!);
  });
});