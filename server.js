const express = require("express");
const bodyparser = require("body-parser");
const passport = require("passport");

const mongoose = require("mongoose");

const app = express();

//bring all routes
const auth = require("./routes/api/auth/auth");
const hospital = require("./routes/api/hospital/hospital");
const doctor = require("./routes/api/doctor/doctor");
const appointment = require("./routes/api/appointment/appointments");

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

// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set("useFindAndModify", false);

//PASSPORT MIDDLEWARE
app.use(passport.initialize());

//Config for jwt strategy
require("./strategies/jsonwtStrategies")(passport);

//testing - route
app.get("/", (req, res) => {
  res.send("PCARE");
});

//actual routes
app.use("/api/auth", auth);
app.use("/api/hospital", hospital);

//doctor
app.use("/api/doctor", doctor);

//appointment
app.use("/api/appointment", appointment);

const port = process.env.port || 3000;

app.listen(port, () => console.log(`App is running at port ${port}`));
