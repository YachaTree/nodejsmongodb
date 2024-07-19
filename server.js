const express = require("express"); // express 라이브러리 사용하겠다는 뜻
const app = express();

app.use(express.static(__dirname + "/public")); //css파일 적용
app.set("view engine", "ejs"); //ejs 템플릿 적용

const { MongoClient } = require("mongodb"); //mongodb 서버 연결
const url = require("./key.js"); // key.js에서 url 변수 요청해서 가져오기

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

app.get("/list", async (요청, 응답) => {
  let answer = await db.collection("post").find().toArray(); // post라는 컬렉션 폴더에
  응답.render("list.ejs", { 글목록: answer });
});

app.get("/time", async (요청, 응답) => {
  let time = new Date(); // post라는 컬렉션 폴더에
  응답.render("time.ejs", { 시간: time });
});
