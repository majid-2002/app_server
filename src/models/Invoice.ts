import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    saleorder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Saleorder",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
