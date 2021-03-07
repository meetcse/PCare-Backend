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
  working_days: [String],
  working_hours: [String],
  approx_appoint_per_slot: {
    type: Schema.Types.Number,
  },
  treatment_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "fullTreatment",
    },
  ],
  receptionist_id: {
    type: Schema.Types.ObjectId,
    ref: "myReceptionist",
  },
});

module.exports = Person = mongoose.model("myDoctor", DoctorSchema);
