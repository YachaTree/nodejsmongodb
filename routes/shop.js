const router = require("express").Router();

router.get("/shop/shirts", (req, res) => {
  res.send("셔츠파는 페이지");
});

router.get("/shop/pants", (req, res) => {
  res.send("바지파는 페이지");
});

module.exports = router;
