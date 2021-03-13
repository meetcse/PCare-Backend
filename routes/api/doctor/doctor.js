const express = require("express");
const router = express.Router(); //because now we getting routes from diff screen
const bcrypt = require("bcryptjs");
const jsonwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const passport = require("passport");
const key = require("../../../server/myurl");
const Doctor = mongoose.model("myDoctor");

//@type     Get
//@route    /api/doctor/
//@desc     route for getting all doctors
//@access   PRIVATE
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "patient") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    Doctor.find()
      .populate("user", "-password")
      .then((doctor) => {
        return res.json(doctor);
      })
      .catch((error) => {
        console.log(`Error in search doctor: ${error}`);
        return res.json({ error: "Some error occured" });
      });
  }
);

//@type     Get
//@route    /api/doctor/id/
//@desc     route for getting single doctors
//@access   PRIVATE
router.get(
  "/id",
  passport.authenticate("jwt", { session: false }),

  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "patient") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    Doctor.findById(req.body.doctor_id)
      .populate("user", "-password")
      .then((doctor) => {
        return res.json(doctor);
      })
      .catch((error) => {
        console.log(`Error in search doctor: ${error}`);
        return res.json({ error: "Some error occured" });
      });
  }
);

module.exports = router;
