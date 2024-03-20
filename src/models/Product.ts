import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
    },
    productCode: {
      type: String,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    buyingPrice: {
      type: Number,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ["kg", "ltr", "piece", "gm"], // gm = gram | ltr = liter | kg = kilogram | piece = piece
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
