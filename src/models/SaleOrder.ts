import mongoose from "mongoose";

const saleOrderSchema = new mongoose.Schema(
  {
    saleOrderNumber: {
      type: String,
      unique: true,
    },
    tokenNo: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      required: true,
    },
    products: [
      {
        _id: false,
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
    total: {
      type: Number,
      required: true,
      default: 0,
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

const orderNumberCounterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

const OrderNumberCounter = mongoose.model(
  "OrderNumberCounter",
  orderNumberCounterSchema,
);
const TokenNumberCounter = mongoose.model(
  "TokenNumberCounter",
  orderNumberCounterSchema,
);

saleOrderSchema.pre("save", async function (next) {
  try {
    if (!this.saleOrderNumber) {
      const saleOrderCounter = await OrderNumberCounter.findOneAndUpdate(
        { name: "sale_order" },
        { $inc: { value: 1 } },
        { new: true, upsert: true },
      );

      this.saleOrderNumber = `SALEORD${saleOrderCounter.value}`;
    }

    if (!this.tokenNo) {
      const currentDate = new Date();
      const startOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
      );

      const tokenCounter = await TokenNumberCounter.findOneAndUpdate(
        { name: "token_no", createdAt: { $gte: startOfDay } }, 
        { $inc: { value: 1 } },
        { new: true, upsert: true },
      );

      this.tokenNo = `${tokenCounter.value}`;
    }

    next();
  } catch (error: any) {
    console.error(error);
    next(error);
  }
});

const saleOrder = mongoose.model("Saleorder", saleOrderSchema);

export default saleOrder;
