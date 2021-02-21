const express = require("express");
const router = express.Router(); //because now we getting routes from diff screen
const bcrypt = require("bcryptjs");
const jsonwt = require("jsonwebtoken");
const passport = require("passport");
const key = require("../../../server/myurl");

//Import Person Schema to register user
const Person = require("../../../models/user/Person");
const Doctor = require("../../../models/user/Doctor");
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
        let userType = req.body.usertype.toString().toLowerCase();

        if (userType == "patient") {
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
        } else if (userType == "doctor") {
          //
        } else if (userType == "receptionist") {
          //
        }

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
                const payload = {
                  id: person.id,
                  firstname: person.firstname,
                  mobilenumber: person.mobilenumber,
                  usertype: person.usertype,
                };

                jsonwt.sign(
                  payload,
                  key.secret,
                  { expiresIn: 36000 },
                  (err, token) => {
                    if (err) {
                      throw err;
                    } else {
                      if (
                        person.usertype.toString().toLowerCase() == "patient"
                      ) {
                        person.password = "";
                        return res.json({
                          success: true,
                          token: "Bearer " + token,
                          user: person,
                        });
                      }
                      res.json({
                        success: true,
                        token: "Bearer " + token,
                      });
                    }
                  }
                );
              })
              .catch((err) =>
                console.log(
                  `Error in registration in saving into database ${err}`
                )
              );
          });
        });
      }
    })
    .catch((err) => console.log(`Error in Registration : ${err}`));
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
            //use payload and create token for user
            const payload = {
              id: person.id,
              firstname: person.firstname,
              mobilenumber: person.mobilenumber,
              usertype: person.usertype,
            };

            jsonwt.sign(
              payload,
              key.secret,
              { expiresIn: 36000 },
              (err, token) => {
                if (err) {
                  throw err;
                } else {
                  if (person.usertype.toString().toLowerCase() == "patient") {
                    person.password = "";
                    return res.json({
                      success: true,
                      token: "Bearer " + token,
                      user: person,
                    });
                  }
                  res.json({
                    success: true,
                    token: "Bearer " + token,
                  });
                }
              }
            );
          } else {
            res
              .status(400)
              .json({ error: `Mobile Number & Password does not match` });
          }
        })
        .catch((err) => console.log(`ERROR IN LOGIN : ${err}`));
    })
    .catch((err) => console.log(`Error in LOGIN : ${err}`));
});

//methods

function getAge(dateString) {
  let age = moment.utc(getDate(dateString)).fromNow();
  return age;
}

function getDate(dateString) {
  let date = moment(dateString, "DD-MM-YYYY");
  return date.format("YYYY-MM-DD");
}

function getDateUtc(dateString) {
  let date = moment.utc(getDate(dateString));
  return date;
}

module.exports = router;
