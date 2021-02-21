const express = require("express");
const bodyparser = require("body-parser");

const mongoose = require("mongoose");

const app = express();

//bring all routes
const auth = require("./routes/api/auth/auth");

//middleware for body parser
app.use(bodyparser.urlencoded({ extended: false })); //for encoding url and parsing it into json
app.use(bodyparser.json()); //as we have to send our data into json we will use this

//mongoDB configuration
const db = require("./server/myurl").mongoUrl;

//Attempt to connect to DB
mongoose
  .connect(db, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => console.log("Mongo DB Connected successfully"))
  .catch((err) => console.log(`Failed to connect to Server with error ${err}`));

//testing - route
app.get("/", (req, res) => {
  res.send("PCARE");
});

//actual routes
app.use("/api/auth", auth);

const port = process.env.port || 3000;

app.listen(port, () => console.log(`App is running at port ${port}`));
