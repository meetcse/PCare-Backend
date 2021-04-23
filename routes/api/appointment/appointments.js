const express = require("express");
const router = express.Router(); //because now we getting routes from diff screen
const bcrypt = require("bcryptjs");
const jsonwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const passport = require("passport");
const key = require("../../../server/myurl");
const Doctor = mongoose.model("myDoctor");
const Receptionist = mongoose.model("myReceptionist");
const Patient = mongoose.model("myPatient");
const moment = require("moment-timezone");
var asyncPack = require("async");

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

    Doctor.findById(doctor_id)
      .then((doctor) => {
        Appointment.find({
          appointment_date: appointment_date,
          appointment_time: appointment_time,
          doctor_id: doctor_id,
        })
          .then((appointment) => {
            if (appointment.length < doctor.approx_appoint_per_slot) {
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
            } else {
              return res.json({
                error: "Sorry! Appointments Slots are filled up.",
              });
            }
          })
          .catch((error) => {
            console.log("Error in finding appointment : " + error.toString());
            return res
              .status(401)
              .json({ error: "Error in searching appointments" });
          });
      })
      .catch((error) => {
        console.log("Error in finding doctor : " + error.toString());
        return res.status(401).json({ error: "Error in searching doctor" });
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

              .populate({
                path: "patient_id",
                populate: {
                  path: "user",
                },
              })
              .populate({
                path: "doctor_id",
                populate: {
                  path: "user",
                },
              })
              .populate({
                path: "doctor_id",
                populate: {
                  path: "hospital_id",
                },
              })
              // .populate({
              //   path: "doctor_id",
              //   populate: {
              //     path: "receptionist_id",
              //   },
              // })

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
          appointments.sort((a, b) => b.appointment_date - a.appointment_date);
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

    const date = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    Appointment.find({
      doctor_id: req.user.doctor_id,
      status: { $regex: "accepted", $options: "i" },
      appointment_date: date,
    })
      .populate({
        path: "patient_id",
        populate: {
          path: "user",
        },
      })
      .populate({
        path: "doctor_id",
        populate: {
          path: "user",
        },
      })
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

    const date = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    Appointment.find({
      doctor_id: req.user.doctor_id,
      appointment_date: { $gt: date },
    })
      .populate({
        path: "patient_id",
        populate: {
          path: "user",
        },
      })
      .populate({
        path: "doctor_id",
        populate: {
          path: "user",
        },
      })
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
      .populate({
        path: "patient_id",
        populate: {
          path: "user",
        },
      })
      .populate({
        path: "doctor_id",
        populate: {
          path: "user",
        },
      })
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

//@type     GET
//@route    /api/appointment/incoming/recept/all
//@desc     route for getting incoming appointment req from receptionist  side
//@access   PRIVATE
router.get(
  "/incoming/recept/all",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "receptionist") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    const date = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    Receptionist.findById(req.user.receptionist_id)
      .then((myReception) => {
        let appointments = [];

        var promise = new Promise((resolve, reject) => {
          asyncPack.eachSeries(
            myReception.doctor_id,
            (doctorIds, callback) => {
              console.log("DOCTOR ID : " + doctorIds);
              Appointment.find({
                doctor_id: doctorIds,
                status: { $regex: "pending", $options: "i" },
                appointment_date: { $gte: date },
              })
                .sort("appointment_date")
                .populate({
                  path: "patient_id",
                  populate: {
                    path: "user",
                  },
                })
                .populate({
                  path: "doctor_id",
                  populate: {
                    path: "user",
                  },
                })
                .populate({
                  path: "doctor_id",
                  populate: {
                    path: "hospital_id",
                  },
                })
                .then((newAppointment) => {
                  if (newAppointment.length > 0) {
                    appointments.push({ newAppointment });
                  }
                  callback();
                })
                .catch((error) => {
                  console.log(
                    "Error in finding receptionist : " + error.toString()
                  );
                  return res
                    .status(401)
                    .json({ error: "Error in finding appointments" });
                });
            },
            () => {
              resolve();
            }
          );
        });

        promise.then(() => {
          if (appointments.length > 0) {
            return res.json(appointments);
          }
          return res.json({ success: "No pending appointments found" });
        });
      })
      .catch((error) => {
        console.log("Error in finding receptionist : " + error.toString());
        return res
          .status(401)
          .json({ error: "Error in finding receptionist details" });
      });
  }
);

//@type     GET
//@route    /api/appointment/upcoming/recept
//@desc     route for getting all upcoming accepted appointments for receptionist
//@access   PRIVATE
router.get(
  "/upcoming/recept",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "receptionist") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    Receptionist.findById(req.user.receptionist_id)
      .then((receptionist) => {
        const date = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
        let appointmentsForRes = [];
        var promise = new Promise((resolve, reject) => {
          if (
            receptionist.doctor_id != null &&
            receptionist.doctor_id.length > 0
          ) {
            asyncPack.eachSeries(
              receptionist.doctor_id,
              (docId, callback) => {
                Appointment.find({
                  doctor_id: docId,
                  status: { $regex: "accepted", $options: "i" },
                  appointment_date: { $gte: date },
                })
                  .populate({
                    path: "patient_id",
                    populate: {
                      path: "user",
                    },
                  })
                  .populate({
                    path: "doctor_id",
                    populate: {
                      path: "user",
                    },
                  })
                  .sort("appointment_date")
                  .exec((error, appointments) => {
                    if (error) {
                      console.log("ERROR IN Finding appointment : " + error);

                      return res
                        .status(400)
                        .json({ error: "Error in finding appointments" });
                    }

                    appointments.forEach((appSingle) => {
                      let index = appointmentsForRes.findIndex((appDate) => {
                        return (
                          getDate(appDate.appointment_date) ===
                          getDate(appSingle.appointment_date)
                        );
                      });
                      if (index == -1) {
                        appointmentsForRes.push({
                          appointment_date: appSingle.appointment_date,
                          appointments: [appSingle],
                        });
                      } else {
                        appointmentsForRes[index].appointments.push(appSingle);
                      }
                    });
                    callback();

                    //  return res.json(appointments);
                  });
              },
              () => {
                resolve();
              }
            );
          } else {
            return res.json({ error: "No Appointments found" });
          }
        });

        promise
          .then(() => {
            return res.json(appointmentsForRes);
          })
          .catch((error) => {
            console.log("Error in getting appointments : " + error.toString());
            return res
              .status(400)
              .json({ error: "Error in getting appointments" });
          });
      })
      .catch((error) => {
        console.log("Error in finding Receptionist : " + error.toString());
        return res.status(400).json({ error: "Error in finding Receptionist" });
      });
  }
);

//@type     POST
//@route    /api/appointment/recept/update
//@desc     route for getting all upcoming accepted appointments for receptionist
//@access   PRIVATE
router.post(
  "/recept/update",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "receptionist") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    if (!req.body.status || !req.body.single_appointment_id) {
      return res.status(401).json({ error: "Missing fields" });
    }

    //STATUS = 0 => Rejected
    //STATUS = 1 => Accepted

    let status;
    if (req.body.status == 1) {
      status = "Accepted";
    } else {
      status = "Rejected";
    }

    Appointment.findById(req.body.single_appointment_id)
      .then((appRess) => {
        if (appRess.status.toLowerCase() != "pending") {
          return res.status(404).json({ error: "Appointment already updated" });
        }
        Appointment.findByIdAndUpdate(
          req.body.single_appointment_id,
          {
            $set: {
              status: status,
            },
          },
          { new: true }
        )
          .then((appointment) => {
            return res.json({
              success: "Appointment Status updated",
              appointment: appointment,
            });
          })
          .catch((error) => {
            console.log("Error in updating appointment status : " + error);
            return res
              .status(400)
              .json({ error: "Error in updating appointment" });
          });
      })
      .catch((error) => {
        console.log("Error in getting appointment status : " + error);
        return res.status(400).json({ error: "Error in getting appointment" });
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
