const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DoctorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "myPerson",
  },
  mci_id: {
    type: String,
    required: true,
  },
  specialist: {
    type: Boolean,
    required: true,
  },
  specialist_in: {
    type: String,
    required: true,
  },
  doctor_type: {
    type: String,
    required: true,
  },
  hospital_id: {
    type: Schema.Types.ObjectId,
    ref: "hospital",
  },
  working_days: [
    {
      type: String,
    },
  ],
  working_hours: [
    {
      type: String,
    },
  ],
  approx_appoint_per_slot: {
    type: Schema.Types.Number,
    required: true,
  },
  treatment_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "fullTreatment",
    },
  ],
  receptionist_id: {
    type: String,
  },
});

module.exports = Person = mongoose.model("myDoctor", DoctorSchema);
