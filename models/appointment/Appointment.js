const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  patient_id: {
    type: Schema.Types.ObjectId,
    ref: "myPatient",
  },
  doctor_id: {
    type: Schema.Types.ObjectId,
    ref: "myDoctor",
  },
  appointment_time: {
    type: String,
    required: true,
  },
  appointment_date: {
    type: Date,
    required: true,
  },
  full_treatment_id: {
    type: Schema.Types.ObjectId,
    ref: "fullTreatment",
  },

  single_treatment_id: {
    type: Schema.Types.ObjectId,
    ref: "singleTreatment",
  },
  createddate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "Pending",
  },
});

module.exports = Person = mongoose.model(
  "singleAppointment",
  AppointmentSchema
);
