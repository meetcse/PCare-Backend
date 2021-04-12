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

//@type     POST
//@route    /api/treatment/single
//@desc     route for getting single treatment
//@access   PRIVATE
router.post(
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
    Appointment.findById(appointment_id)
      .then((newAppointment) => {
        if (newAppointment.single_treatment_id) {
          SingleTreatment.findById(newAppointment.single_treatment_id)
            .then((singleTreatment) => {
              return res.json(singleTreatment);
            })
            .catch((error) => {
              console.log(
                "Error in fetching single treatmen : " + error.toString()
              );
              return res
                .status(401)
                .json({ error: "Error in fetching treatment" });
            });
        } else {
          return res.json({ error: "No treatment Found" });
        }
      })
      .catch((error) => {
        console.log("Error in finding appointment : " + error.toString());
        return res.status(401).json({ error: "Error in finding appointment" });
      });
  }
);

//@type     POST
//@route    /api/treatment/single/all
//@desc     route for getting all single treatment of patient for patient side
//@access   PRIVATE
router.post(
  "/single/all",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() == "receptionist") {
      return res.status(401).json({ error: "Un Authorized" });
    }

    if (req.body.patient_id) {
      Patient.findById(req.body.patient_id)
        .then((patient) => {
          var singleTreatments = [];
          var promise = new Promise((resolve, reject) => {
            patient.appointment_id.forEach((appointmentIds, index, array) => {
              Appointment.findById(appointmentIds)
                .then((appointment) => {
                  if (appointment.single_treatment_id)
                    SingleTreatment.findById(appointment.single_treatment_id)
                      .then((newSingleTreatment) => {
                        singleTreatments.push(newSingleTreatment);
                        if (index === array.length - 1) resolve();
                      })
                      .catch((error) => {
                        console.log(
                          "Error in finding Single treatment : " +
                            error.toString()
                        );
                        return res
                          .status(401)
                          .json({ error: "Error in finding single treatment" });
                      });
                })
                .catch((error) => {
                  console.log(
                    "Error in finding appointment : " + error.toString()
                  );
                  return res
                    .status(401)
                    .json({ error: "Error in finding appointment" });
                });
            });
          });

          promise.then(() => {
            return res.json(singleTreatments);
          });
        })
        .catch((error) => {
          console.log("ERROR IN FINDING PATIENT : " + error.toString());
          return res.status(401).json({ error: "Error in finding patient" });
        });
    } else {
      return res.status(400).json({ error: "Missing fields" });
    }
  }
);

//@type     POST
//@route    /api/treatment/full
//@desc     route for getting full treatment of patient
//@access   PRIVATE
router.post(
  "/full",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() == "receptionist") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    const full_treatment_id = req.body.full_treatment_id;
    if (!full_treatment_id) {
      return res.status(400).json({ error: "Missing fields" });
    }

    FullTreatment.findById(full_treatment_id)
      .sort("-appointment_date")
      .populate({
        path: "treatments",
        populate: {
          path: "single_appointment_id",
        },
      })
      .populate({
        path: "treatments",
        populate: {
          path: "single_treatment_id",
        },
      })
      .populate({
        path: "treatments",
        populate: {
          path: "patient_id",
        },
      })
      .populate({
        path: "treatments",
        populate: {
          path: "doctor_id",
        },
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
          path: "hospital_id",
        },
      })
      .populate({
        path: "doctor_id",
        populate: {
          path: "user",
        },
      })
      .then((fullTreatment) => {
        if (
          fullTreatment != null &&
          fullTreatment != undefined &&
          fullTreatment
        ) {
          if (req.user.usertype.toString().toLowerCase() == "doctor") {
            if (fullTreatment.doctor_id.id == req.user.doctor_id) {
              return res.json(fullTreatment);
            } else {
              return res.status(500).json({ error: "Un Authorised Doctor" });
            }
          } else {
            if (fullTreatment.patient_id.id == req.user.patient_id) {
              return res.json(fullTreatment);
            } else {
              return res.status(500).json({ error: "Un Authorised Patient" });
            }
          }
        } else {
          return res.json({ success: "No treatments found" });
        }
      })
      .catch((error) => {
        console.log("Error in finding full treatment : " + error.toString());
        return res
          .status(401)
          .json({ error: "Error in finding Full Treatment" });
      });
  }
);

//@type     POST
//@route    /api/treatment/add
//@desc     route for adding treatment of patient
//@access   PRIVATE
router.post(
  "/add",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.usertype.toString().toLowerCase() != "doctor") {
      return res.status(401).json({ error: "Un Authorized" });
    }
    if (
      !req.body.single_appointment_id ||
      !req.body.prescription ||
      !req.body.disease
    ) {
      return res.status(401).json({ error: "Missing fields" });
    }
    try {
      // const patient_id = req.body.patient_id;
      const single_appointment_id = req.body.single_appointment_id;
      const prescription = req.body.prescription;
      const disease = req.body.disease;
      var special_note;
      var experiments;
      var observation;
      if (req.body.special_note) {
        special_note = req.body.special_note;
      } else {
        special_note = "";
      }
      if (req.body.experiments) experiments = req.body.experiments;
      else experiments = "";

      if (req.body.observation) observation = req.body.observation;
      else observation = "";

      Appointment.findById(single_appointment_id)
        .then((appointment) => {
          if (appointment.single_treatment_id) {
            return res.status(400).json({
              error: "Sorry! Treatment already added to this appointment",
            });
          }
          const full_treatment_id = appointment.full_treatment_id;
          if (full_treatment_id) {
            var newSingleTreatment = new SingleTreatment({
              single_appointment_id: single_appointment_id,
              prescription: prescription,
              disease: disease,
              special_note: special_note,
              experiments: experiments,
              observation: observation,
            });
            newSingleTreatment
              .save()
              .then((newSingleTreatmentResponse) => {
                FullTreatment.findById(full_treatment_id)
                  .then((newFullTreatmentResponse) => {
                    newFullTreatmentResponse.treatments.push({
                      appointment_date: appointment.appointment_date,
                      single_appointment_id: appointment.id,
                      single_treatment_id: newSingleTreatmentResponse.id,
                    });
                    var status_completed_time;
                    var status;
                    if (req.body.status) status = req.body.status;
                    else status = "ONGOING";
                    if (req.body.status_completed_time)
                      status_completed_time = getDateUtc(
                        req.body.status_completed_time
                      );
                    else status_completed_time = "";
                    FullTreatment.findByIdAndUpdate(
                      full_treatment_id,
                      {
                        $set: {
                          treatments: newFullTreatmentResponse.treatments,
                          status_completed_time: status_completed_time,
                          status: status,
                        },
                      },
                      { new: true }
                    )
                      .then((newFullTreatmentResponse) => {
                        Doctor.findById(newFullTreatmentResponse.doctor_id)
                          .then((doctor) => {
                            doctor.treatment_id.push(
                              newFullTreatmentResponse.id
                            );
                            Doctor.findByIdAndUpdate(
                              newFullTreatmentResponse.doctor_id,
                              {
                                treatment_id: doctor.treatment_id,
                              },
                              { new: true }
                            )
                              .then((newDoctor) => {
                                if (
                                  status.toString().toLowerCase() == "completed"
                                ) {
                                  Patient.findById(
                                    newFullTreatmentResponse.patient_id
                                  )
                                    .then((newPatient) => {
                                      const index = newPatient.ongoing_treatment_id.indexOf(
                                        newFullTreatmentResponse.id
                                      );
                                      if (index > -1) {
                                        newPatient.ongoing_treatment_id.splice(
                                          index,
                                          1
                                        );
                                      }
                                      newPatient.completed_treatment_id.push(
                                        newFullTreatmentResponse.id
                                      );
                                      Patient.findByIdAndUpdate(
                                        newFullTreatmentResponse.patient_id,
                                        {
                                          $set: {
                                            ongoing_treatment_id:
                                              newPatient.ongoing_treatment_id,
                                            completed_treatment_id:
                                              newPatient.completed_treatment_id,
                                          },
                                        },
                                        { new: true }
                                      )
                                        .then((newPatientUpdate) => {
                                          return res.json({
                                            success:
                                              "Treatment saved successfully",
                                          });
                                        })
                                        .catch((error) => {
                                          console.log(
                                            "Error in updating patient : " +
                                              error.toString()
                                          );
                                          return res.status(401).json({
                                            error: "Error in updating patient",
                                          });
                                        });
                                    })
                                    .catch((error) => {
                                      console.log(
                                        "Error in finding patient : " +
                                          error.toString()
                                      );
                                      return res.status(401).json({
                                        error: "Error in updating patient",
                                      });
                                    });
                                } else if (
                                  status.toString().toLowerCase() == "ongoing"
                                ) {
                                  Patient.findById(
                                    newFullTreatmentResponse.patient_id
                                  )
                                    .then((newPatient) => {
                                      newPatient.ongoing_treatment_id.push(
                                        newFullTreatmentResponse.id
                                      );
                                      Patient.findByIdAndUpdate(
                                        newFullTreatmentResponse.patient_id,
                                        {
                                          $set: {
                                            ongoing_treatment_id:
                                              newPatient.ongoing_treatment_id,
                                          },
                                        },
                                        { new: true }
                                      )
                                        .then((newPatientUpdate) => {
                                          return res.json({
                                            success:
                                              "Treatment saved successfully",
                                          });
                                        })
                                        .catch((error) => {
                                          console.log(
                                            "Error in updating patient : " +
                                              error.toString()
                                          );
                                          return res.status(401).json({
                                            error: "Error in updating patient",
                                          });
                                        });
                                    })
                                    .catch((error) => {
                                      console.log(
                                        "Error in finding patient : " +
                                          error.toString()
                                      );
                                      return res.status(401).json({
                                        error: "Error in updating patient",
                                      });
                                    });
                                }
                              })
                              .catch((error) => {
                                console.log(
                                  "Error in updating doctor" + error.toString()
                                );
                                return res
                                  .status(401)
                                  .json({ error: "Error in updating doctor" });
                              });
                          })
                          .catch((error) => {
                            console.log(
                              "Error in finding doctor : " + error.toString()
                            );
                            return res
                              .status(401)
                              .json({ error: "Error in finding doctor" });
                          });
                      })
                      .catch((error) => {
                        console.log(
                          "ERROR IN UPDATING FULL TREATMENT : " +
                            error.toString()
                        );
                        return res
                          .status(401)
                          .json({ error: "Error in saving treatment" });
                      });
                  })
                  .catch((error) => {
                    console.log(
                      "Error in fetching full treatment : " + error.toString()
                    );
                    return res
                      .status(401)
                      .json({ error: "Error in fetching full treatment" });
                  });
              })
              .catch((error) => {
                console.log(
                  "Error in saving single treatment : " + error.toString()
                );
                return res
                  .status(401)
                  .json({ error: "Error in saving treatment in database" });
              });
          } else {
            var newSingleTreatment = new SingleTreatment({
              single_appointment_id: single_appointment_id,
              prescription: prescription,
              disease: disease,
              special_note: special_note,
              experiments: experiments,
              observation: observation,
            });

            newSingleTreatment
              .save()
              .then((newSingleTreatmentResponse) => {
                var treatments = [];
                treatments.push({
                  appointment_date: appointment.appointment_date,
                  single_appointment_id: appointment.id,
                  single_treatment_id: newSingleTreatmentResponse.id,
                });
                var status_completed_time;
                var status;
                if (req.body.status) status = req.body.status;
                else status = "ONGOING";
                if (req.body.status_completed_time)
                  status_completed_time = getDateUtc(
                    req.body.status_completed_time
                  );
                else status_completed_time = "";
                var newFullTreatment = new FullTreatment({
                  patient_id: appointment.patient_id,
                  doctor_id: appointment.doctor_id,
                  treatments: treatments,
                  status: status,
                  status_completed_time: status_completed_time,
                });

                newFullTreatment
                  .save()
                  .then((newFullTreatmentResponse) => {
                    Appointment.findByIdAndUpdate(
                      single_appointment_id,
                      {
                        $set: {
                          full_treatment_id: newFullTreatmentResponse.id,
                          single_treatment_id: newSingleTreatmentResponse.id,
                        },
                      },
                      { new: true }
                    )
                      .then((newUpdatedAppointment) => {
                        Doctor.findById(newFullTreatmentResponse.doctor_id)
                          .then((doctor) => {
                            doctor.treatment_id.push(
                              newFullTreatmentResponse.id
                            );
                            Doctor.findByIdAndUpdate(
                              newFullTreatmentResponse.doctor_id,
                              {
                                treatment_id: doctor.treatment_id,
                              },
                              { new: true }
                            )
                              .then((newDoctor) => {
                                if (
                                  status.toString().toLowerCase() == "completed"
                                ) {
                                  Patient.findById(
                                    newFullTreatmentResponse.patient_id
                                  )
                                    .then((newPatient) => {
                                      const index = newPatient.ongoing_treatment_id.indexOf(
                                        newFullTreatmentResponse.id
                                      );
                                      if (index > -1) {
                                        newPatient.ongoing_treatment_id.splice(
                                          index,
                                          1
                                        );
                                      }
                                      newPatient.completed_treatment_id.push(
                                        newFullTreatmentResponse.id
                                      );
                                      Patient.findByIdAndUpdate(
                                        newFullTreatmentResponse.patient_id,
                                        {
                                          $set: {
                                            ongoing_treatment_id:
                                              newPatient.ongoing_treatment_id,
                                            completed_treatment_id:
                                              newPatient.completed_treatment_id,
                                          },
                                        },
                                        { new: true }
                                      )
                                        .then((newPatientUpdate) => {
                                          return res.json({
                                            success:
                                              "Treatment saved successfully",
                                          });
                                        })
                                        .catch((error) => {
                                          console.log(
                                            "Error in updating patient : " +
                                              error.toString()
                                          );
                                          return res.status(401).json({
                                            error: "Error in updating patient",
                                          });
                                        });
                                    })
                                    .catch((error) => {
                                      console.log(
                                        "Error in finding patient : " +
                                          error.toString()
                                      );
                                      return res.status(401).json({
                                        error: "Error in updating patient",
                                      });
                                    });
                                } else if (
                                  status.toString().toLowerCase() == "ongoing"
                                ) {
                                  Patient.findById(
                                    newFullTreatmentResponse.patient_id
                                  )
                                    .then((newPatient) => {
                                      newPatient.ongoing_treatment_id.push(
                                        newFullTreatmentResponse.id
                                      );
                                      Patient.findByIdAndUpdate(
                                        newFullTreatmentResponse.patient_id,
                                        {
                                          $set: {
                                            ongoing_treatment_id:
                                              newPatient.ongoing_treatment_id,
                                          },
                                        },
                                        { new: true }
                                      )
                                        .then((newPatientUpdate) => {
                                          return res.json({
                                            success:
                                              "Treatment saved successfully",
                                          });
                                        })
                                        .catch((error) => {
                                          console.log(
                                            "Error in updating patient : " +
                                              error.toString()
                                          );
                                          return res.status(401).json({
                                            error: "Error in updating patient",
                                          });
                                        });
                                    })
                                    .catch((error) => {
                                      console.log(
                                        "Error in finding patient : " +
                                          error.toString()
                                      );
                                      return res.status(401).json({
                                        error: "Error in updating patient",
                                      });
                                    });
                                }
                              })
                              .catch((error) => {
                                return res
                                  .status(401)
                                  .json({ error: "Error in finding doctor" });
                              });
                          })
                          .catch((error) => {
                            return res
                              .status(401)
                              .json({ error: "Error in finding doctor" });
                          });

                        // return res.json({
                        //   success: "Treatment saved successfully",
                        // });
                      })
                      .catch((error) => {
                        console.log(
                          "ERROR in updating appointment : " + error.toString()
                        );
                        return res
                          .status(401)
                          .json({ error: "Error in updating appointment" });
                      });
                  })
                  .catch((error) => {
                    console.log("ERROR : " + error.toString());
                    return res
                      .status(401)
                      .json({ error: "Error in saving Treatment" });
                  });
              })
              .catch((error) => {
                console.log("error : " + error.toString());
                return res
                  .status(401)
                  .json({ error: "Error in saving Treatment" });
              });
          }
        })
        .catch((error) => {
          console.log("ERROR : " + error.toString());
          return res
            .json(401)
            .json({ error: "Error in fetching appointment id" });
        });
    } catch (error) {
      console.log("ERROR IN ADDING TREATMENT OF PATIENT : " + error.toString());
      res.status(401).json({ error: "Error from server." });
    }
  }
);

// Full Treatment

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
