const express = require("express");
const bodyParser = require("body-parser");
const connectdb = require("./../dbconnect");
const Chats = require("./../models/Chat");
const ChatRoom = require("./../models/ChatRoom");

const router = express.Router();

router.use(bodyParser.json());

router.route("/").get((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;

  connectdb.then((db) => {
    let data = Chats.find({ message: "Anonymous" });
    Chats.find({}).then((chat) => {
      res.json(chat);
    });
  });
});

// 로그인한 사용자가 만든 채팅방과 초대된 채팅방 목록 가져오기
router.route("/user/:username/rooms").get((req, res, next) => {
  const username = req.params.username;
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;

  connectdb.then((db) => {
    ChatRoom.find({
      $or: [{ members: username }, { createdBy: username }],
    }).then((rooms) => {
      res.json(rooms);
    });
  });
});

// 채팅방 목록 가져오기
router.route("/rooms").get((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;

  connectdb.then((db) => {
    ChatRoom.find({}).then((rooms) => {
      res.json(rooms);
    });
  });
});

// 특정 사용자가 속한 채팅방 목록 가져오기
router.route("/user/:username/rooms").get((req, res, next) => {
  const username = req.params.username;
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;

  connectdb.then((db) => {
    ChatRoom.find({ members: username }).then((rooms) => {
      res.json(rooms);
    });
  });
});

// 특정 채팅방의 메시지 가져오기
router.route("/rooms/:id/messages").get((req, res, next) => {
  const roomId = req.params.id;
  const username = req.headers["username"];

  connectdb.then((db) => {
    ChatRoom.findById(roomId).then((room) => {
      if (room.members.includes(username)) {
        Chats.find({ roomId: roomId }).then((messages) => {
          res.json(messages);
        });
      } else {
        res.status(403).json({ error: "Access denied" });
      }
    });
  });
});

// 채팅방 추가하는 엔드포인트
router.route("/createRoom").post((req, res, next) => {
  console.log("Create Room Request Body:", req.body); // 요청 바디 로그
  res.setHeader("Content-Type", "application/json");
  res.statusCode = 200;

  const { roomName, createdBy, members } = req.body;

  if (!roomName || !createdBy || !members || members.length === 0) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  connectdb.then((db) => {
    let newRoom = new ChatRoom({
      name: roomName,
      createdBy: createdBy,
      members: members,
    });
    newRoom
      .save()
      .then((room) => {
        console.log("New Room Created:", room); // 생성된 방 로그
        res.json(room);
      })
      .catch((err) => {
        console.error("Error creating room:", err); // 오류 로그
        res.status(500).json({ error: err.message });
      });
  });
});

module.exports = router;
