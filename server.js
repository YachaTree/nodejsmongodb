const express = require("express"); // express 라이브러리 사용하겠다는 뜻
const app = express();
const { MongoClient, ObjectId } = require("mongodb"); //mongodb 서버 연결
const url = require("./key.js"); // key.js에서 url 변수 요청해서 가져오기
const methodOverride = require("method-override");

app.use(methodOverride("_method"));
//css파일 적용, __dirname = "directory와 name의 합성어" 현재의 파일(file)이 위치한 폴더(directory)의 절대경로(absolute path)를 알려줌
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs"); //ejs 템플릿 적용
app.use(express.json()); //
app.use(express.urlencoded({ extended: true }));

let db;
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum");
    app.listen(8080, () => {
      console.log("http://localhost:8080 에서 서버 실행중");
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (요청, 응답) => {
  응답.sendFile(__dirname + "/index.html");
});

app.get("/news", (요청, 응답) => {
  db.collection("post").insertOne({ title: "어쩌구" }); // post라는 컬렉션 폴더에
  응답.send("오늘 비옴");
});
/*************** 글 리스트 페이지****************/
app.get("/list", async (요청, 응답) => {
  let answer = await db.collection("post").find().toArray(); // post라는 컬렉션 폴더에 모든 도큐먼트(toArray) 가져온다
  응답.render("list.ejs", { 글목록: answer });
});

app.get("/time", async (요청, 응답) => {
  let time = new Date(); // post라는 컬렉션 폴더에
  응답.render("time.ejs", { 시간: time });
});

/*************** 글 등록 페이지****************/
app.get("/write", (req, res) => {
  res.render("write.ejs");
});

/*************** 글 등록 post****************/
app.post("/add", async (req, res) => {
  console.log(req.body);

  try {
    if (req.body.title == "") {
      res.send("제목 입력 안했는데?");
    } else {
      await db
        .collection("post")
        .insertOne({ title: req.body.title, content: req.body.content });
      res.redirect("/list");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("서버에러남");
  }
});

/*************** 상세 페이지 조회 ****************/
app.get("/detail/:id", async (req, res) => {
  let postId = req.params; //파라미터 값 요청으로 받아옴

  try {
    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(postId) });
    if (result == null) {
      res.status(400).send("url 잘못 입력함");
    }
    res.render("detail.ejs", { detail: result });
  } catch (error) {
    console.log(error);
    res.status(400).send("url 잘못 입력함");
  }
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
    { _id: new ObjectId(req.query.docid) }
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
