const express = require("express");
const router = express.Router(); //because now we getting routes from diff screen
const bcrypt = require("bcryptjs");
const jsonwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const passport = require("passport");
const key = require("../../../server/myurl");
const Receptionist = mongoose.model("myReceptionist");
const Person = mongoose.model("myPerson");
const Doctor = mongoose.model("myDoctor");
const Patient = mongoose.model("myPatient");
const FullTreatment = require("../../../models/treatment/FullTreatment");

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
      .populate("hospital_id")
      .populate("receptionist_id")
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

//@type     POST
//@route    /api/doctor/addrecept
//@desc     route for adding receptionist from doctor side
//@access   PRIVATE
router.post(
  "/addrecept",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "doctor") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    if (!req.body.receptionist_id) {
      return res.status(400).json({ error: "Missing fields" });
    }

    Doctor.findById(req.user.doctor_id)
      .then((doctor) => {
        Receptionist.findById(req.body.receptionist_id)
          .then((reception) => {
            if (doctor.receptionist_id == reception.id) {
              return res
                .status(400)
                .json({ error: "Receptionist already added" });
            }
            doctor.receptionist_id = req.body.receptionist_id;

            Doctor.findByIdAndUpdate(
              req.user.doctor_id,
              {
                $set: {
                  receptionist_id: doctor.receptionist_id,
                },
              },
              { new: true }
            )
              .then((newDoctor) => {
                reception.doctor_id.push(req.user.doctor_id);
                Receptionist.findByIdAndUpdate(
                  req.body.receptionist_id,
                  {
                    $set: {
                      doctor_id: reception.doctor_id,
                    },
                  },
                  { new: true }
                )
                  .then((receptionist) => {
                    return res.json({
                      success: "Successfully added receptionist",
                    });
                  })
                  .catch((error) => {
                    console.log(
                      "Error in updating receptionist : " + error.toString()
                    );
                    return res
                      .status(401)
                      .json({ error: "Error in updating receptionist" });
                  });
              })
              .catch((error) => {
                console.log("Error in updating doctor : " + error.toString());
                return res
                  .status(401)
                  .json({ error: "Error in updating receptionist" });
              });
          })
          .catch((error) => {
            console.log("Error in finding reception : " + error.toString());
            return res.status(401).json({ error: "Error in searchin" });
          });
      })
      .catch((error) => {
        console.log("Error in finding doctor : " + error.toString());
        return res.status(401).json({ error: "Error in searching doctor" });
      });
  }
);

//@type     POST
//@route    /api/doctor/search/recept
//@desc     route for searching receptionist from doctor side
//@access   PRIVATE
router.post(
  "/search/recept",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "doctor") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    if (!req.body.name) {
      return res.status(400).json({ error: "Missing fields" });
    }

    Person.find({
      // $or: [
      //   {
      //     firstname: { $regex: req.body.name, $options: "i" },
      //     lastname: { $regex: req.body.name, $options: "i" },
      //   },
      // ],
      usertype:
        // "receptionist",
        { $regex: "receptionist", $options: "i" },
    })
      .or([
        {
          firstname: { $regex: req.body.name, $options: "i" },
        },
        { lastname: { $regex: req.body.name, $options: "i" } },
      ])
      .then((person) => {
        // console.log("Person : " + person.toString());
        if (!person || person.length == 0) {
          return res.status(401).json({ error: "No user found" });
        }
        Doctor.findById(req.user.doctor_id)
          .then((doctor) => {
            if (doctor.hospital_id) {
              var receptionists = [];
              var promise = new Promise((resolve, reject) => {
                person.forEach((singlePerson, index, array) => {
                  Receptionist.findOne({
                    hospital_id: doctor.hospital_id,
                    user: singlePerson.id,
                  })
                    .populate("user")
                    .populate({
                      path: "[doctor_id]",
                      // populate: {
                      //   path: "user",
                      // },
                    })
                    // .populate("doctor_id")
                    .populate("hospital_id")
                    .then((reception) => {
                      receptionists.push(reception);
                      if (index === array.length - 1) resolve();
                    })
                    .catch((error) => {
                      console.log(
                        "Error in searching receptionist : " + error.toString()
                      );
                      return res
                        .status(401)
                        .json({ error: "Error in searching" });
                    });
                });
              });

              promise.then(() => {
                return res.json(receptionists);
              });
            } else {
              return res.json(person);
            }
          })
          .catch((error) => {
            console.log("Error in searching doctor : " + error.toString());
            return res.status(401).json({ error: "Error in searching" });
          });
      })
      .catch((error) => {
        console.log("Error in searching person : " + error.toString());
        return res.status(401).json({ error: "Error in searching" });
      });
  }
);

//@type     POST
//@route    /api/doctor/search/doctor
//@desc     route for searching doctor for receptionist registration
//@access   PUBLIC
router.post("/search/doctor", (req, res) => {
  if (req.body.doctor_name == null || !req.body.doctor_name) {
    return res.json({
      error: "Missing fields",
    });
  }

  //case insensitive search
  Person.find({
    usertype:
      // "receptionist",
      { $regex: "doctor", $options: "i" },
  })
    .or([
      {
        firstname: { $regex: req.body.doctor_name, $options: "i" },
      },
      { lastname: { $regex: req.body.doctor_name, $options: "i" } },
    ])
    .then((person) => {
      if (!person || person == [] || person.length == 0) {
        return res.status(401).json({ error: "No user found" });
      }

      let doctors = [];
      var promise = new Promise((resolve, reject) => {
        person.forEach((singlePerson, index, array) => {
          Doctor.findOne({
            user: singlePerson.id,
          })
            .populate("user")
            // .populate({
            //   path: "[doctor_id]",
            //   // populate: {
            //   //   path: "user",
            //   // },
            // })
            // .populate("doctor_id")
            .populate("hospital_id")
            .then((doctor) => {
              if (doctor) {
                doctors.push(doctor);
                if (index === array.length - 1) resolve();
              }
              if (index === array.length - 1) resolve();
            })
            .catch((error) => {
              console.log("Error in searching doctors : " + error.toString());
              return res.status(401).json({ error: "Error in searching" });
            });
        });
      });

      promise.then(() => {
        console.log("CAME HERE");
        if (doctors) {
          return res.json(doctors);
        } else {
          return res.status(401).json({ error: "No user found" });
        }
      });
    })
    .catch((error) => {
      console.log("Error in searching doctor : " + error);
      return res.status(401).json({ error: "Error in searching doctor" });
    });
});

//@type     GET
//@route    /api/doctor/mypatients
//@desc     route for getting current doctors patients
//@access   PUBLIC
router.get(
  "/mypatients",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "doctor") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    Doctor.findById(req.user.doctor_id)
      .then((doctor) => {
        let patients = [];
        var promise = new Promise((resolve, reject) => {
          if (doctor.treatment_id != null && doctor.treatment_id.length > 0) {
            doctor.treatment_id.forEach((ids, index, array) => {
              FullTreatment.findById(ids)
                .then((fullTreatment) => {
                  Patient.findById(fullTreatment.patient_id)
                    .populate("user", "-password")
                    .populate({
                      path: "appointment_id",
                      populate: {
                        path: "appointment",
                      },
                    })
                    .then((patient) => {
                      if (patient != null) {
                        patients.push(patient);
                        if (index === array.length - 1) resolve();
                      }
                      if (index === array.length - 1) resolve();
                    })
                    .catch((error) => {
                      console.log("Error in finding patient : " + error);
                      return res
                        .status(401)
                        .json({ error: "Error in finding patient" });
                    });
                })
                .catch((error) => {
                  console.log("ERROR : " + error);
                  return res
                    .status(401)
                    .json({ error: "Error in finding full treatment" });
                });
            });
          } else {
            return res.json({ error: "No Patients found" });
          }
        });

        promise.then(() => {
          if (patients.length == 0) {
            return res.json({ error: "No Patients found" });
          }
          return res.json(patients);
        });
      })
      .catch((error) => {
        console.log("ERROR IN FINDING DOCTOR : " + error);
        return res.status(401).json({ error: "Error in searching doctor" });
      });
  }
);

module.exports = router;
