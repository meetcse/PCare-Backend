const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const mongoose = require("mongoose");
const Person = mongoose.model("myPerson");
const { secret } = require("../server/myurl");

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secret;

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      Person.findById(jwt_payload.id)
        .then((person) => {
          if (person) {
            console.log("CALLED JSONWT STRATEGY");
            const user = {};
            user.id = person.id;
            user.usertype = jwt_payload.usertype;
            if (user.usertype.toString().toLowerCase() == "patient") {
              user.patient_id = jwt_payload.patient_id;
            } else if (user.usertype.toString().toLowerCase() == "doctor") {
              user.doctor_id = jwt_payload.doctor_id;
            } else if (
              user.usertype.toString().toLowerCase() == "receptionist"
            ) {
              user.receptionist_id = jwt_payload.receptionist_id;
            }

            return done(null, user);
          }
          return done(null, false);
        })
        .catch((err) => console.log(`Error in strategy : ${err}`));
    })
  );
};
