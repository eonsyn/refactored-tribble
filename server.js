const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello from Express!"); // Basic route to test
});
app.get("/home", async (req, res) => {
  res.send("you are at home page .");
});
const port = 2300;
app.listen(port, () => {
  console.log("Server is listening on port 2300");
});
