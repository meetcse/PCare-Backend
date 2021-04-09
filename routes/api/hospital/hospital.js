const express = require("express");
const router = express.Router();

const Hospital = require("../../../models/hospital/Hospital");

//@type     POST
//@route    /api/hospital/register
//@desc     route for registration for hospital
//@access   PUBLIC
router.post("/register", (req, res) => {
  Hospital.findOne({
    hospital_name: req.body.hospital_name,
    hospital_address: req.body.hospital_address,
  })
    .then((hospital) => {
      if (hospital) {
        return res.status(400).json({
          error: "Hospital already exists. Please select from the list",
        });
      } else {
        const newHospital = new Hospital({
          hospital_name: req.body.hospital_name,
          hospital_address: req.body.hospital_address,
        });

        newHospital
          .save()
          .then((hospital) => {
            return res.json(hospital);
          })
          .catch((error) => {
            console.log(`Error in saving hospital : ${error}`);
            return res.json({
              error: "Error with database",
            });
          });
      }
    })
    .catch((error) => {
      console.log(`Error in searching hospital : ${error}`);
    });
});

//@type     Get
//@route    /api/hospital/
//@desc     route for getting list of hospitals
//@access   PUBLIC
router.post("/", async (req, res) => {
  if (req.body.hospital_name == null) {
    return res.json({
      error: "Missing fields",
    });
  }
  const query = { $text: { $search: req.body.hospital_name } };
  const projection = {
    _id: 0,
    hospital_name: 1,
  };
  //case insensitive search
  const hospital = await Hospital.find({
    hospital_name: { $regex: req.body.hospital_name, $options: "i" },
  });

  // .catch((error) => {
  //   console.log(`Error in database : ${error}`);
  //   return res.json({
  //     error: "Error with database",
  //   });
  // });
  if (hospital == null) {
    return res.json({ error: "No hospitals found" });
  }
  return res.json(hospital);
});

module.exports = router;
