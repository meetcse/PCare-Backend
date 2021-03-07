const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReceptionistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "myPerson",
  },
  hospital_id: {
    type: Schema.Types.ObjectId,
    ref: "hospital",
  },
  doctor_id: [
    {
      type: String,
    },
  ],
});

module.exports = Person = mongoose.model("myReceptionist", ReceptionistSchema);
