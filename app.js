//require the express module
const express = require("express");
const cors = require("cors");
const dateTime = require("simple-datetime-formater");
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatroute");
const loginRouter = require("./route/loginRoute");
//database connection
const Chat = require("./models/Chat"); // 데이터베이스 모델
const ChatRoom = require("./models/ChatRoom"); // 새로운 채팅방 모델 추가
const connect = require("./dbconnect"); // 데이터베이스 모델

const app = express();
const { Server } = require("socket.io");
//require the http module
const http = require("http").Server(app);

// require the socket.io module
const io = new Server(http, {
  cors: {
    origin: "http://localhost:8888",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "username"],
    credentials: true,
  },
});

const port = 3000;

// 미들웨어 설정
//미들웨어란: 요청과 응답의 중간에 위치하며 클라이언트에게 요청이 오면
//그 요청에 대한 응답을 보내기 위해 중간에서 목적에 맞게 처리를 해주는 함수
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:8888",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "username"],
    credentials: true,
  })
);

//bodyparser middleware
//bodyparser : "body-parser"는 node.js의 모듈로써,
//클라이언트 POST request data의 body로부터 파라미터를 편리하게 추출해주는 역할
app.use(bodyParser.json());

// //routes
app.use("/chats", chatRouter);
app.use("/login", loginRouter);

// 소켓 이벤트 설정
io.on("connection", (socket) => {
  console.log("사용자 연결됨");

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("disconnect", function () {
    console.log("사용자 연결 해제됨");
  });

  //Someone is typing
  socket.on("typing", (data) => {
    socket.broadcast.emit("notifyTyping", {
      user: data.user,
      message: data.message,
    });
  });

  //when soemone stops typing
  socket.on("stopTyping", () => {
    socket.broadcast.emit("notifyStopTyping");
  });

  socket.on("chat message", function (msg) {
    console.log("message: " + msg.message);

    // Broadcast message to everyone in port:3000 except yourself
    socket.broadcast.emit("received", {
      message: msg.message,
      sender: msg.sender,
      createdAt: new Date().toISOString(), // ISO 형식으로 설정
      roomId: msg.roomId,
    });

    // Save chat to the database
    connect.then((db) => {
      console.log("서버에 정상적으로 연결됨");
      let chatMessage = new Chat({
        message: msg.message,
        sender: msg.sender,
        createdAt: new Date(), // Date 객체로 설정
        roomId: msg.roomId,
      });

      chatMessage.save();
    });
  });
});

http.listen(port, () => {
  console.log("포트에서 실행 중: " + port);
});
