const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PersonSchema = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  address: {
    houseno: {
      type: String,
      required: true,
    },
    society: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
  },

  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  age: {
    type: String,
    required: true,
  },
  mobilenumber: {
    type: String,
    required: true,
  },
  profilepic: {
    type: String,
    // default: "https://cdn0.iconfinder.com/data/icons/avatar-78/128/12-512.png",
  },
  usertype: {
    type: String,
    required: true,
  },
  createddate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Person = mongoose.model("myPerson", PersonSchema);
