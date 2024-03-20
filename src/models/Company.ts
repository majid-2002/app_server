import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
  logo: {
    type: String,
  },
  gstNumber: {
    type: String,
  },
  website: {
    type: String,
  },
  fssaiNumber: {
    type: String,
  },
});

const Company = mongoose.model("Company", companySchema);

export default Company;
