import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
  discountPercentage: {
    type: Number,
    required: true,
  },
  expiry: {
    type: Date,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
});

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
