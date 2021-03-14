const express = require("express");
const router = express.Router(); //because now we getting routes from diff screen
const bcrypt = require("bcryptjs");
const jsonwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const passport = require("passport");
const key = require("../../../server/myurl");
const Doctor = mongoose.model("myDoctor");
const Patient = mongoose.model("myPatient");
const Appointment = mongoose.model("singleAppointment");
const moment = require("moment");

//treatment model
const SingleTreatment = require("../../../models/treatment/SingleTreatment");
const FullTreatment = require("../../../models/treatment/FullTreatment");

//@type     GET
//@route    /api/treatment/single
//@desc     route for getting single treatment
//@access   PRIVATE
router.get(
  "/single",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() == "receptionist") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    const appointment_id = req.body.appointment_id;
    if (!appointment_id) {
      return res.status(400).json({ error: "Missing fields" });
    }

    //TODO:
  }
);

//TODO: APIS PENDING :-
// Single Treatment
// Full Treatment

module.exports = router;
