const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DoctorSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "myPerson",
      },
      mci_id : {
          type: String,
          required : true,
      },
      specialist : {
          type : Boolean,
          required : true,
      },
      specialist_in : {
          type: String,
          required : true,
      },
      hospital_name : {
        type: Schema.Types.ObjectId,
        ref: "hospitals",
      },
      
});




module.exports = Person = mongoose.model("myDoctor", DoctorSchema);