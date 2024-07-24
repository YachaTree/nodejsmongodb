const express = require("express"); // express 라이브러리 사용하겠다는 뜻
const app = express();
const { MongoClient, ObjectId } = require("mongodb"); //mongodb 서버 연결
const url = require("./key.js"); // key.js에서 url 변수 요청해서 가져오기
const methodOverride = require("method-override");

const session = require("express-session"); // 세션 만들때 사용하는 라이브러리
const passport = require("passport"); //회원인증 도와주는 메인 라이브러리
const LocalStrategy = require("passport-local"); //아이디 비번 방식으로 인증하고 싶을때 사용하는 라이브러리
const bcrypt = require("bcrypt"); // 암호화 설정
const MongoStore = require("connect-mongo"); //세션을 몽고 db에 저장하기 위한 라이브러리

//socket io
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Socket } = require("dgram");
const server = createServer(app);
const io = new Server(server);

require("dotenv").config;

app.use(passport.initialize());
app.use(
  session({
    secret: "암호화에 쓸 비번", // 세션의 document id는 암호화해서 유저에게 보냄
    resave: false, // 유저가 서버로 요청할 떄마다 세션 갱신할건지
    saveUninitialized: false, //로그인 안해도 세션 만들것인지
    cookie: { maxAge: 60 * 60 * 1000 }, //세선 유지 시간 설정 : 1시간
    store: MongoStore.create({
      // db에 이제 로그인시 세션 document 발행해줌
      mongoUrl: url,
      dbName: "forum",
    }),
  })
);

app.use(passport.session());

app.use(methodOverride("_method"));
//css파일 적용, __dirname = "directory와 name의 합성어" 현재의 파일(file)이 위치한 폴더(directory)의 절대경로(absolute path)를 알려줌
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs"); //ejs 템플릿 적용
app.use(express.json()); //
app.use(express.urlencoded({ extended: true }));
// app.use(checkLogin); //api 100개 미들웨어 전부 적용하고 싶다 => 이렇게하면 모든 api에 checkLogin 미들웨어 적용됨

let db;
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum");
    server.listen(8080, () => {
      console.log("http://localhost:8080 에서 서버 실행중");
    });
  })
  .catch((err) => {
    console.log(err);
  });

// function checkLogin(req, res, next) {
//   if (!req.user) {
//     로그인하세요;
//   }
//   next();
// }

// app.get("/", checkLogin, (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

app.get("/news", (req, res) => {
  db.collection("post").insertOne({ title: "어쩌구" }); // post라는 컬렉션 폴더에
  res.send("오늘 비옴");
});
/*************** 글 리스트 페이지****************/
app.get("/list", async (req, res) => {
  console.log(req.user);
  let answer = await db.collection("post").find().toArray(); // post라는 컬렉션 폴더에 모든 도큐먼트(toArray) 가져온다
  res.render("list.ejs", { 글목록: answer });
});

app.get("/time", async (req, res) => {
  let time = new Date(); // post라는 컬렉션 폴더에
  res.render("time.ejs", { 시간: time });
});

/*************** 글 등록 페이지****************/
app.get("/write", (req, res) => {
  res.render("write.ejs");
});

/*************** 글 등록 post****************/
app.post("/add", async (req, res) => {
  console.log(req.user);

  try {
    if (req.body.title == "") {
      res.send("제목 입력 안했는데?");
    } else {
      await db.collection("post").insertOne({
        title: req.body.title,
        content: req.body.content,
        user: req.user._id,
        username: req.user.username,
      });
      res.redirect("/list");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("서버에러남");
  }
});

/*************** 상세 페이지 조회 ****************/
app.get("/detail/:id", async (req, res) => {
  let result2 = await db
    .collection("comment")
    .find({ parentId: new ObjectId(req.params.id) })
    .toArray();

  let result = await db
    .collection("post")
    .findOne({ _id: new ObjectId(req.params.id) });
  res.render("detail.ejs", { result: result, result2: result2 });
});

/*************** 게시물 수정페이지 이동 ****************/
app.get("/edit/:id", async (req, res) => {
  let postId = req.params; //파라미터 값 요청으로 받아옴

  try {
    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(postId) });
    if (result == null) {
      res.status(400).send("url 잘못 입력함");
    }
    res.render("edit.ejs", { edit: result });
  } catch (error) {
    console.log(error);
    res.status(400).send("url 잘못 입력함");
  }
});

/*************** 게시물 수정 ****************/
app.put("/edit", async (req, res) => {
  console.log(req.body);

  try {
    if (req.body.title == "") {
      res.send("제목 입력 안했는데?");
    } else {
      await db.collection("post").updateOne(
        //db 추가하는 메서드
        { _id: new ObjectId(req.body._id) },
        { $set: { title: req.body.title, content: req.body.content } }
      );
      res.redirect("/list");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("서버에러남");
  }
});

/*************** 게시물 삭제 ****************/
app.delete("/delete", async (req, res) => {
  console.log(req.query);

  await db.collection("post").deleteOne(
    //db 삭제하는 메서드
    {
      _id: new ObjectId(req.query.docid),
      username: new ObjectId(req.user._id),
    }
  );
  res.send("삭제완료");
});

// document.querySelectorAll(".btn")[0].addEventListener("click", function () {});

/*************** 글 리스트 페이지별로 요청****************/
app.get("/list/:id", async (req, res) => {
  let result = await db
    .collection("post")
    .find()
    .skip((req.params.id - 1) * 5)
    .limit(5)
    .toArray(); // post라는 컬렉션 폴더에 5개 도큐먼트(toArray) 가져온다
  res.render("list.ejs", { 글목록: result });
  //1번~5번까지 글 찾아서 result변수에 저장
});

/*************** 글 리스트 페이지별로 요청****************/
app.get("/list/next/:id", async (req, res) => {
  let result = await db
    .collection("post")
    .find({
      _id: { $gt: new ObjectId(req.params.id) },
    })
    .limit(5)
    .toArray(); // post라는 컬렉션 폴더에 5개 도큐먼트(toArray) 가져온다
  res.render("list.ejs", { 글목록: result });
  //1번~5번까지 글 찾아서 result변수에 저장
});

/*************** 로그인 구현 ****************/
passport.use(
  //유저가 제출한 아이디 비번 검사하는 코드 적는곳
  new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    let result = await db
      .collection("user")
      .findOne({ username: 입력한아이디 });
    if (!result) {
      return cb(null, false, { message: "아이디 DB에 없음" });
    }
    if (await bcrypt.compare(입력한비번, result.password)) {
      //bcrypy한 Db비번과 유저 입력 비번 비교
      return cb(null, result);
    } else {
      return cb(null, false, { message: "비번불일치" });
    }
  })
);

//위의 result값이 user에 들어감
passport.serializeUser((user, done) => {
  //user = 로그인 시도중인 유저정보
  console.log(user);
  process.nextTick(() => {
    //세션 만들어줌 => 쿠키를 유저에게 보내줌
    done(null, { id: user._id, username: user.username });
  });
});
//passport.serializeUser 거치면 로그인시 세션 document 발행해줌

//세션쿠키를 가진 유저가 요청을 날릴때마다 실행됨.그럼 쓸데없는 Db조회 발생할수 있음,메인페이지 방문할때 필요없을수도 있음.
//그래서 특정 라우터 안에서 작동하게 할수 있음.
passport.deserializeUser(async (user, done) => {
  let result = await db
    .collection("user")
    .findOne({ _id: new ObjectId(user.id) });
  delete result.password;
  //유저가 보낸 쿠기 분석은 passport.deserializeUser()
  process.nextTick(() => {
    done(null, result);
  });
});

app.get("/login", async (req, res) => {
  console.log(req.user);
  res.render("login.ejs");
});

app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect("/list");
    });
  })(req, res, next);
});

/*************** 회원가입 구현 ****************/
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  let hash = await bcrypt.hash(req.body.password, 10);

  await db.collection("user").insertOne({
    username: req.body.username,
    password: hash,
  });
  res.redirect("/list");
});

/*************** 검색기능 ****************/

app.get("/search", async (req, res) => {
  let 검색조건 = [
    {
      $search: {
        index: "title_index",
        text: { query: req.query.val, path: "title" },
      },
    },
  ];
  let result = await db.collection("post").aggregate(검색조건).toArray();
  res.render("search.ejs", { 글목록: result });
});

/*************** 댓글 기능 ****************/

app.post("/comment", async (req, res) => {
  let result = await db.collection("comment").insertOne({
    content: req.body.content,
    writerId: new ObjectId(req.user._id),
    writer: req.user.username,
    parentId: new ObjectId(req.body.parentId),
  });

  res.redirect("back"); //이전페이지
});

/*************** 채팅 기능 ****************/
app.get("/chat/request", async (req, res) => {
  await db.collection("chatroom").insertOne({
    member: [req.user._id, new ObjectId(req.query.writerId)], //db 채팅방 도큐먼트에 요청한 사람 id, 글쓴이의 아이디 저장
    date: new Date(),
  });
  res.redirect("/chat/list");
});

app.get("/chat/list", async (req, res) => {
  let result = await db
    .collection("chatroom")
    .find({ member: req.user._id }) //Db에서 내가 속한 채팅방 불러오기
    .toArray();
  res.render("chatList.ejs", { result: result });
});

app.get("/chat/detail", async (req, res) => {
  //채팅방 상세페이지
  res.render("chatDetail.ejs");
});

app.get("/chat/detail/:id", async (req, res) => {
  //chatList에서 파라미터 받음
  console.log(req.params.id);
  let result = await db
    .collection("chatroom")
    .findOne({ _id: new ObjectId(req.params.id) }); //내가 속한 채팅방 상세페이지
  res.render("chatDetail.ejs", { result: result });
});

/*************** socket.io ****************/
io.on("connection", (socket) => {
  //유저가 웹소켓 연결시 서버에서 코드실행하려면
  console.log("웹소켓 연결");

  //room : 유저들 들어갈수 있는 웹소켓방, 한유저는 여러 Room에 들어갈수 있음, [서버 -> room에 속한 유저] 메세지 전송가능
  socket.on("ask-join", (data) => {
    socket.request.session; //현재 로그인한 유저
    socket.join(data);
  });

  socket.on("message-send", (data) => {
    // await db.collection("chatMessage").insertOne({
    //   parentRoom: new ObjectId(data.room),
    //   content: data.msg,
    //   who: new ObjectId(socket.request.session.passport.user.id),
    // });
    //message-send 서버로부터 수신하면
    io.to(data.room).emit("message-broadcast", data.msg);
  });
});
