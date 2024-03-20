  import mongoose from "mongoose";

const productWithDiscountSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  discount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discount",
  },
});

const ProductWithDiscount = mongoose.model(
  "ProductWithDiscount",
  productWithDiscountSchema,
);

export default ProductWithDiscount;
