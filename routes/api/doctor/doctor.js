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
        if (!person) {
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

module.exports = router;
