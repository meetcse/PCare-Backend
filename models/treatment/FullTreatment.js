const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FullTreatment = new Schema({
  patient_id: {
    type: Schema.Types.ObjectId,
    ref: "myPatient",
    required: true,
  },
  doctor_id: {
    type: Schema.Types.ObjectId,
    ref: "myDoctor",
    required: true,
  },

  treatments: [
    {
      appointment_date: {
        type: Date,
      },
      single_appointment_id: {
        type: Schema.Types.ObjectId,
        ref: "singleAppointment",
        required: true,
      },
      single_treatment_id: {
        type: Schema.Types.ObjectId,
        ref: "singleTreatment",
        required: true,
      },
    },
  ],
  status: {
    type: String,
    required: true,
  },
  status_starting_date_time: {
    type: Date,
    default: Date.now,
  },
  status_completed_time: {
    type: Date,
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
  end_date: {
    type: Date,
  },
});

module.exports = Person = mongoose.model("fullTreatment", FullTreatment);
