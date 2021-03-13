const express = require("express");
const router = express.Router(); //because now we getting routes from diff screen
const bcrypt = require("bcryptjs");
const jsonwt = require("jsonwebtoken");
const passport = require("passport");
const key = require("../../../server/myurl");

//Import Person Schema to register user
const Person = require("../../../models/user/Person");
const Doctor = require("../../../models/user/Doctor");
const Patient = require("../../../models/user/Patient");
const Receptionist = require("../../../models/user/Receptionist");
const Hospital = require("../../../models/hospital/Hospital");
const moment = require("moment");

//@type     POST
//@route    /api/auth/register
//@desc     route for registration for users
//@access   PUBLIC
router.post("/register", (req, res) => {
  Person.findOne({ mobilenumber: req.body.mobilenumber })
    .then((person) => {
      if (person) {
        return res
          .status(400)
          .json({ error: "Mobile Number is already registered" });
      } else {
        if (req.body.usertype.toString().toLowerCase() == "doctor") {
          if (req.body.hospital_id == null) {
            return res.json({
              error: "Error : Missing fields",
            });
          }
        } else if (
          req.body.usertype.toString().toLowerCase() == "receptionist"
        ) {
          if (req.body.hospital_id == null) {
            return res.json({
              error: "Error : Missing fields",
            });
          }
        }
        let userType = req.body.usertype.toString().toLowerCase();
        const addressValues = {};
        addressValues.houseno = req.body.houseno;
        addressValues.society = req.body.society;
        addressValues.area = req.body.area;
        addressValues.city = req.body.city;
        addressValues.state = req.body.state;
        if (req.body.country != null) {
          addressValues.country = req.body.country;
        }

        var newPerson = new Person({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          mobilenumber: req.body.mobilenumber,
          address: addressValues,
          password: req.body.password,
          gender: req.body.gender,
          dob: getDateUtc(req.body.dob),
          age: getAge(req.body.dob),
          usertype: req.body.usertype,
        });
        if (newPerson.gender.toString().toLowerCase() == "male") {
          newPerson.profilepic =
            "https://cdn0.iconfinder.com/data/icons/avatar-78/128/12-512.png";
        } else {
          newPerson.profilepic =
            "https://icons-for-free.com/iconfiles/png/512/female+person+user+woman+young+icon-1320196266256009072.png";
        }

        //Encrypt password using bcryptjs
        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(newPerson.password, salt, (err, hash) => {
            // Store hash in your password DB.
            if (err) throw err;
            newPerson.password = hash;

            newPerson
              .save()
              .then((person) => {
                if (userType == "patient") {
                  const newPatient = new Patient({
                    user: person.id,
                  });
                  newPatient
                    .save()
                    .then((patient) => {
                      const payload = {
                        id: person.id,
                        firstname: person.firstname,
                        mobilenumber: person.mobilenumber,
                        usertype: person.usertype,
                        patient_id: patient.id,
                      };

                      jsonwt.sign(
                        payload,
                        key.secret,
                        { expiresIn: 36000 },
                        (err, token) => {
                          if (err) {
                            throw err;
                          } else {
                            person.password = "";
                            return res.json({
                              success: true,
                              token: token,
                              user: person,
                              patient_details: patient,
                            });
                          }
                        }
                      );
                    })
                    .catch((err) => {
                      console.log(`ERROR in Saving Patient data : ${err}`);
                      return res.json({
                        error: "Error with database",
                      });
                    });
                } else if (userType == "doctor") {
                  Hospital.findById(req.body.hospital_id)
                    .then((hospital) => {
                      if (req.body.receptionist_id != null) {
                        var newDoctor = new Doctor({
                          user: person.id,
                          mci_id: req.body.mci_id,
                          specialist: req.body.specialist,
                          specialist_in: req.body.specialist_in,
                          doctor_type: req.body.doctor_type,
                          hospital_id: hospital.hospital_id,
                          approx_appoint_per_slot:
                            req.body.approx_appoint_per_slot,
                          receptionist_id: req.body.receptionist_id,
                        });
                      } else {
                        var newDoctor = new Doctor({
                          user: person.id,
                          mci_id: req.body.mci_id,
                          specialist: req.body.specialist,
                          specialist_in: req.body.specialist_in,
                          doctor_type: req.body.doctor_type,
                          hospital_id: hospital.hospital_id,
                          approx_appoint_per_slot:
                            req.body.approx_appoint_per_slot,
                        });
                      }

                      newDoctor.working_days = getWorkingDatas(
                        req.body.working_days
                      );
                      newDoctor.working_hours = getWorkingDatas(
                        req.body.working_hours
                      );

                      newDoctor
                        .save()
                        .then((doctor) => {
                          const payload = {
                            id: person.id,
                            firstname: person.firstname,
                            mobilenumber: person.mobilenumber,
                            usertype: person.usertype,
                            doctor_id: doctor.id,
                          };

                          jsonwt.sign(
                            payload,
                            key.secret,
                            { expiresIn: 36000 },
                            (err, token) => {
                              if (err) {
                                throw err;
                              } else {
                                person.password = "";
                                return res.json({
                                  success: true,
                                  token: token,
                                  user: person,
                                  doctor_details: doctor,
                                });
                              }
                            }
                          );
                        })
                        .catch((err) => {
                          console.log(`ERROR in Saving Doctor data : ${err}`);
                          return res.json({
                            error: "Error with database",
                          });
                        });
                    })
                    .catch((err) => {
                      console.log(`ERROR in searching Hospital data : ${err}`);
                      return res.json({
                        error: "Error with database",
                      });
                    });
                } else if (userType == "receptionist") {
                  Hospital.findById(req.body.hospital_id)
                    .then((hospital) => {
                      Doctor.findById(req.body.doctor_id)
                        .then((doctor) => {
                          var newReceptionist = new Receptionist({
                            user: person.id,
                            hospital_id: hospital.id,
                            doctor_id: doctor.id,
                          });

                          newReceptionist
                            .save()
                            .then((reception) => {
                              const payload = {
                                id: person.id,
                                firstname: person.firstname,
                                mobilenumber: person.mobilenumber,
                                usertype: person.usertype,
                                receptionist_id: reception.id,
                              };

                              jsonwt.sign(
                                payload,
                                key.secret,
                                { expiresIn: 36000 },
                                (err, token) => {
                                  if (err) {
                                    throw err;
                                  } else {
                                    person.password = "";
                                    return res.json({
                                      success: true,
                                      token: token,
                                      user: person,
                                      receptionist_details: reception,
                                    });
                                  }
                                }
                              );
                            })
                            .catch((error) => {
                              console.log(
                                `ERROR in saving Receptionist data : ${error}`
                              );
                              return res.json({
                                error: "Error with database",
                              });
                            });
                        })
                        .catch((error) => {
                          console.log(
                            `ERROR in searching Doctor data : ${error}`
                          );
                          return res.json({
                            error: "Error with database",
                          });
                        });
                    })
                    .catch((error) => {
                      console.log(
                        `ERROR in searching Hospital data : ${error}`
                      );
                      return res.json({
                        error: "Error with database",
                      });
                    });
                }
              })
              .catch((err) => {
                console.log(
                  `Error in registration in saving into database ${err}`
                );
                return res.json({
                  error: "Error with database",
                });
              });
          });
        });
      }
    })
    .catch((err) => {
      console.log(`Error in Registration : ${err}`);
      return res.json({
        error: "Error with database",
      });
    });
});

//@type     POST
//@route    /api/auth/login
//@desc     route for login of users
//@access   PUBLIC
router.post("/login", (req, res) => {
  const mobilenumber = req.body.mobilenumber;
  const password = req.body.password;

  Person.findOne({ mobilenumber: mobilenumber })
    .then((person) => {
      if (!person) {
        return res.status(404).json({ error: "Mobile Number does not exist" });
      }
      bcrypt
        .compare(password, person.password)
        .then((isSuccess) => {
          if (isSuccess) {
            // res.status(200).json({ message: "Successfully Logged In" });

            if (person.usertype.toString().toLowerCase() == "patient") {
              Patient.findOne({ user: person.id })
                .then((patient) => {
                  //use payload and create token for user
                  const payload = {
                    id: person.id,
                    firstname: person.firstname,
                    mobilenumber: person.mobilenumber,
                    usertype: person.usertype,
                    patient_id: patient.id,
                  };
                  person.password = "";

                  jsonwt.sign(
                    payload,
                    key.secret,
                    { expiresIn: 36000 },
                    (err, token) => {
                      if (err) {
                        throw err;
                      } else {
                        return res.json({
                          success: true,
                          token: token,
                          user: person,
                          patient_details: patient,
                        });
                      }
                    }
                  );
                })
                .catch((error) => {
                  console.log(`Error in finding patient: ${error}`);
                  return res.json({
                    error: "Error with database",
                  });
                });
            } else if (person.usertype.toString().toLowerCase() == "doctor") {
              Doctor.findOne({ user: person.id })
                .then((doctor) => {
                  //use payload and create token for user
                  const payload = {
                    id: person.id,
                    firstname: person.firstname,
                    mobilenumber: person.mobilenumber,
                    usertype: person.usertype,
                    doctor_id: doctor.id,
                  };
                  person.password = "";

                  jsonwt.sign(
                    payload,
                    key.secret,
                    { expiresIn: 36000 },
                    (err, token) => {
                      if (err) {
                        throw err;
                      } else {
                        return res.json({
                          success: true,
                          token: token,
                          user: person,
                          doctor_details: doctor,
                        });
                      }
                    }
                  );
                })
                .catch((error) => {
                  console.log(`Error in finding doctor: ${error}`);
                  return res.json({
                    error: "Error with database",
                  });
                });
            } else if (
              person.usertype.toString().toLowerCase() == "receptionist"
            ) {
              Receptionist.findOne({ user: person.id })
                .then((receptionist) => {
                  //use payload and create token for user
                  const payload = {
                    id: person.id,
                    firstname: person.firstname,
                    mobilenumber: person.mobilenumber,
                    usertype: person.usertype,
                    receptionist_id: receptionist.id,
                  };
                  person.password = "";

                  jsonwt.sign(
                    payload,
                    key.secret,
                    { expiresIn: 36000 },
                    (err, token) => {
                      if (err) {
                        throw err;
                      } else {
                        return res.json({
                          success: true,
                          token: token,
                          user: person,
                          receptionist_details: receptionist,
                        });
                      }
                    }
                  );
                })
                .catch((err) => {
                  console.log(`Error in finding receptionist: ${err}`);
                  return res.json({
                    error: "Error with database",
                  });
                });
            }
          } else {
            res
              .status(400)
              .json({ error: `Mobile Number & Password does not match` });
          }
        })
        .catch((err) => {
          console.log(`ERROR IN LOGIN : ${err}`);
          return res.json({
            error: "Error with database",
          });
        });
    })
    .catch((err) => {
      console.log(`Error in LOGIN : ${err}`);
      return res.json({
        error: "Error with database",
      });
    });
});

//methods

function getAge(dateString) {
  let age = moment.utc(getDate(dateString)).fromNow();
  let finalAge = age.split(" ");
  return finalAge[0] + " " + finalAge[1];
}

function getDate(dateString) {
  let date = moment(dateString, "DD-MM-YYYY");
  return date.format("YYYY-MM-DD");
}

function getDateUtc(dateString) {
  let date = moment.utc(getDate(dateString));
  return date;
}

function getWorkingDatas(workingDays) {
  // console.log(workingDays);
  // console.log(workingDays.typeof);
  let workingdays = [];
  workingDays.forEach((value) => {
    // console.log(value);
    workingdays.push(value);
  });
  return workingdays;
}

module.exports = router;
