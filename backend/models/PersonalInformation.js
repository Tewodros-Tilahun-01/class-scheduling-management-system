const mongoose = require("mongoose");

const PersonalInfoSchema = new mongoose.Schema({
  contact_info: {
    type: {
      email: { type: String, required: true, default: "" },
      tel: { type: String, required: true, default: "" },
      address: { type: String, required: true, default: "" },
    },
    required: true,
  },
  personal_info: {
    type: {
      birth_date: { type: String, required: true, default: "" },
      languages: { type: [String], required: true, default: [] },
      bio: { type: String, required: true, default: "" },
    },
    required: true,
  },
  professional_info: {
    type: {
      position: { type: String, required: true, default: "" },
      education: { type: String, required: true, default: "" },
    },
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
module.exports = mongoose.model("PersonalInfo", PersonalInfoSchema);
