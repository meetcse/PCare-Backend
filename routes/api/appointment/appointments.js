const express = require("express");
const router = express.Router(); //because now we getting routes from diff screen
const bcrypt = require("bcryptjs");
const jsonwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const passport = require("passport");
const key = require("../../../server/myurl");
const Doctor = mongoose.model("myDoctor");
const Patient = mongoose.model("myPatient");
const moment = require("moment");

//appointment model
const Appointment = require("../../../models/appointment/Appointment");

//@type     Post
//@route    /api/appointment/book/new
//@desc     route for booking a new appointment
//@access   PRIVATE
router.post(
  "/book/new",
  passport.authenticate("jwt", { session: false }),

  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "patient") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    if (
      !req.body.doctor_id ||
      !req.body.appointment_time ||
      !req.body.appointment_date
    ) {
      return res.status(400).json({ error: "Unable to find all fields" });
    }

    const patient_id = req.user.patient_id;
    const doctor_id = req.body.doctor_id;
    const appointment_time = req.body.appointment_time;
    const appointment_date = getDateUtc(req.body.appointment_date);

    var newAppointment = new Appointment({
      patient_id: patient_id,
      doctor_id: doctor_id,
      appointment_time: appointment_time,
      appointment_date: appointment_date,
    });
    newAppointment
      .save()
      .then((appointment) => {
        Patient.findById(req.user.patient_id)
          .then((patient) => {
            patient.appointment_id.push({
              appointment: appointment.id,
            });

            Patient.findByIdAndUpdate(
              req.user.patient_id,
              { $set: { appointment_id: patient.appointment_id } },
              { new: true }
            )
              .then((patient) => {
                return res.json(appointment);
              })
              .catch((error) => {
                console.log("Error in updating patient : " + error);
                return res.status(400).json({ error: "Error" });
              });
          })
          .catch((error) => {
            console.log("Error in finding patient : " + error);
            return res.status(400).json({ error: "Error" });
          });
      })
      .catch((error) => {
        console.log("Error in saving appointment : " + error);
        return res.status(400).json({ error: "Error" });
      });
  }
);

//@type     Get
//@route    /api/appointment/patient
//@desc     route for getting all appointments for patients
//@access   PRIVATE
router.get(
  "/patient",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "patient") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    Patient.findById(req.user.patient_id)
      .then((patient) => {
        let appointments = [];
        var promise = new Promise((resolve, reject) => {
          patient.appointment_id.forEach((element, index, array) => {
            Appointment.findById(element.appointment)
              .then((appointment) => {
                appointments.push(appointment);
                // console.log(appointments);
                if (index === array.length - 1) resolve();
              })
              .catch((error) => {
                console.log("Error in finding appointment : " + error);
                return res.status(400).json({ error: "Error" });
              });
          });
        });
        promise.then(() => {
          return res.json(appointments);
        });
      })
      .catch((error) => {
        console.log("Error in finding patient : " + error);
        return res.status(400).json({ error: "Error" });
      });
  }
);

//@type     GET
//@route    /api/appointment/today
//@desc     route for getting all appointments for today for doctor
//@access   PRIVATE
router.get(
  "/today",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "doctor") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    const date = moment().format("YYYY-MM-DD");

    Appointment.find({ doctor_id: req.user.doctor_id, appointment_date: date })
      .sort("-appointment_date")
      .exec((error, appointments) => {
        if (error) {
          console.log("ERROR IN Finding appointment : " + error);
          return res.status(400).json({ error: "Error in database" });
        }

        return res.json(appointments);
      });
  }
);

//@type     GET
//@route    /api/appointment/upcoming
//@desc     route for getting all appointments for future i.e from tomorrow for doctor
//@access   PRIVATE
router.get(
  "/upcoming",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "doctor") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    const date = moment().format("YYYY-MM-DD");

    Appointment.find({
      doctor_id: req.user.doctor_id,
      appointment_date: { $gt: date },
    })
      .sort("-appointment_date")
      .populate(
        "patient_id",
        "doctor_id",
        "full_treatment_id",
        "single_treatment_id"
      )
      .exec((error, appointments) => {
        if (error) {
          console.log("ERROR IN Finding appointment : " + error);
          return res.status(400).json({ error: "Error in database" });
        }

        return res.json(appointments);
      });
  }
);

//@type     GET
//@route    /api/appointment/doctor/all
//@desc     route for getting all appointments for doctor
//@access   PRIVATE
router.get(
  "/doctor/all",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "doctor") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    Appointment.find({ doctor_id: req.user.doctor_id })
      .sort("-appointment_date")
      .then((appointments) => {
        return res.json(appointments);
      })
      .catch((error) => {
        console.log("ERROR IN Finding appointment : " + error);
        return res.status(400).json({ error: "Error in database" });
      });
  }
);

//methods

function getDate(dateString) {
  let date = moment(dateString, "DD-MM-YYYY");
  return date.format("YYYY-MM-DD");
}

function getDateUtc(dateString) {
  let date = moment.utc(getDate(dateString));
  return date;
}

module.exports = router;
