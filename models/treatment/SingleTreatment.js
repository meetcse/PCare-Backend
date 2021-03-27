const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SingleTreatment = new Schema({
  single_appointment_id: {
    type: Schema.Types.ObjectId,
    ref: "singleAppointment",
    required: true,
  },
  prescription: {
    type: String,
    required: true,
  },
  disease: {
    type: String,
    required: true,
  },
  special_note: {
    type: String,
  },
  experiments: {
    type: String,
  },
  observation: {
    type: String,
  },
  createddate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Person = mongoose.model("singleTreatment", SingleTreatment);
