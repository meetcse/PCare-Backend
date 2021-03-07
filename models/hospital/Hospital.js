const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HospitalSchema = new Schema({
  hospital_name: {
    type: String,
    required: true,
  },
  hospital_address: {
    type: String,
    required: true,
  },
});

module.exports = Person = mongoose.model("hospital", HospitalSchema);
