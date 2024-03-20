import mongoose from "mongoose";

const bundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  price: {
    type: Number,
    required: true,
  },
});

const Bundle = mongoose.model("Bundle", bundleSchema);

export default Bundle;
