const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PatientSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "myPerson",
  },

  appointment_id: [
    {
      appointment: {
        type: Schema.Types.ObjectId,
        ref: "singleAppointment",
      },
    },
  ],
  ongoing_treatment_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "fullTreatment",
    },
  ],

  completed_treatment_id: [
    {
      type: Schema.Types.ObjectId,
      ref: "fullTreatment",
    },
  ],
});

module.exports = Person = mongoose.model("myPatient", PatientSchema);
