import express from "express";
import mongoose from "mongoose";
import productModel from "../models/Product";
import Joi from "joi";
import { isSameCompany } from "../utils/userValidation";
import { GetUserAuthInfoRequest } from "types/types";

// import {
//   getOrSetCache,
//   clearCache,
//   clearAllCacheByPattern,
// } from "../utils/caching";

import CategoryModel from "../models/Category";

const router = express.Router();

const productSchema = Joi.object({
  productName: Joi.string().required(),
  productCode: Joi.string().required(),
  sellingPrice: Joi.number().required(),
  buyingPrice: Joi.number().required(),
  description: Joi.string().required(),
  image: Joi.string().required(),
  quantity: Joi.number().required(),
  unit: Joi.string().valid("kg", "litre", "piece", "gm").required(),
  categoryId: Joi.string().required(),
  companyId: Joi.string().required(),
});

const productUpdateSchema = Joi.object({
  productName: Joi.string(),
  productCode: Joi.string(),
  sellingPrice: Joi.number(),
  buyingPrice: Joi.number(),
  description: Joi.string(),
  image: Joi.string(),
  quantity: Joi.number(),
  unit: Joi.string().valid("kg", "litre", "piece", "gm"),
  categoryId: Joi.string(),
  companyId: Joi.string().required(),
});

router
  .post("/add", async (req: GetUserAuthInfoRequest, res: any) => {
    const { value: data, error } = productSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message, success: false });
    }

    if (!mongoose.Types.ObjectId.isValid(data.categoryId)) {
      return res
        .status(400)
        .json({ message: "Invalid category id", success: false });
    }

    if (!mongoose.Types.ObjectId.isValid(data.companyId)) {
      return res
        .status(400)
        .json({ message: "Invalid company id", success: false });
    }

    const isSameCompanyResponse = await isSameCompany(req, data.companyId);

    if (!isSameCompanyResponse) {
      return res.status(401).json({
        message: "You are not authorized to add product for this company",
        success: false,
      });
    }

    // check weather category exists for the company
    const categoryExists = await CategoryModel.findOne({
      _id: data.categoryId,
      company: data.companyId,
    });

    if (!categoryExists) {
      return res.status(400).json({
        message: "Category does not exists for this company",
        success: false,
      });
    }

    try {
      // check if the product already exists with the same product code and same company
      // const product = await productModel.findOne({
      //   productCode: data.productCode,
      //   company: data.companyId,
      // });

      // if (product) {
      //   return res.status(400).json({
      //     message:
      //       "Product already exists with the same product code for the company",
      //     success: false,
      //   });
      // }

      const newProduct = new productModel({
        productName: data.productName,
        productCode: data.productCode,
        sellingPrice: data.sellingPrice,
        buyingPrice: data.buyingPrice,
        description: data.description,
        image: data.image,
        quantity: data.quantity,
        unit: data.unit,
        category: data.categoryId,
        company: data.companyId,
      });

      await newProduct.save();

      // TODO: Caching and clearing cache
      // await Promise.all([
      //   clearCache("products"),
      //   clearCache("categories"),
      //   clearAllCacheByPattern("product-*"),
      //   clearAllCacheByPattern("category-*"),
      // ]);

      // await Promise.all([
      //   newProduct.save(),
      //   getOrSetCache("products", async () => {
      //     const products = await productModel
      //       .find()
      //       .populate("category")
      //       .exec();
      //     return products;
      //   }),
      // ]);

      res.json({
        message: "Product added successfully",
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  })

  // get product by Id
  .get("/:id", async (req: GetUserAuthInfoRequest, res: any) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ message: "Invalid product id", success: false });
      }

      // const product: any = await getOrSetCache(`product-${id}`, async () => {
      //   return productModel.findById(id)
      //     .populate({
      //       path: "category",
      //       select: "categoryName",
      //     })
      //     .populate({
      //       path: "company",
      //       select: "id",
      //     })
      //     .exec();
      // });

      const product: any = await productModel
        .findById(id)
        .populate({
          path: "category",
          select: "categoryName",
        })
        .populate({
          path: "company",
          select: "id",
        })
        .exec();

      const isSameCompanyResponse = await isSameCompany(
        req,
        product?.company._id,
      );

      if (!isSameCompanyResponse) {
        return res.status(401).json({
          message: "You are not authorized to view this product",
          success: false,
        });
      }

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product is not found", success: false });
      }

      res.json({ data: product, success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  });

const populateProducts = (query = {}) => {
  return productModel
    .find(query)
    .populate({
      path: "category",
      select: "categoryName _id",
    })
    .exec();
};

//product querying wth companyId and categoryId
router
  .get("/", async (req, res) => {
    const { companyId, categoryId } = req.query; //? path api/product?companyId=123&categoryId=456 or api/product?companyId=123 or api/products?categoryId=456

    try {
      if (companyId && !mongoose.Types.ObjectId.isValid(companyId as string)) {
        return res
          .status(400)
          .json({ message: "Invalid company id", success: false });
      }

      if (
        categoryId &&
        !mongoose.Types.ObjectId.isValid(categoryId as string)
      ) {
        return res
          .status(400)
          .json({ message: "Invalid category id", success: false });
      }

      let products;

      if (companyId && categoryId) {
        products = await populateProducts({
          company: companyId,
          category: categoryId,
        });
      } else if (companyId) {
        products = await populateProducts({ company: companyId });
      } else if (categoryId) {
        products = await populateProducts({ category: categoryId });
      } else {
        products = await populateProducts({});
      }

      res.json({ data: products, success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  })

  .patch("/update/:id", async (req, res) => {
    const { id } = req.params;
    const { value: data, error } = productUpdateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message, success: false });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid product id", success: false });
    }

    try {
      // check if the product already exists with the new product code and same company
      // if (data.productCode) {
      //   const productWithSameProductCode = await productModel.findOne({
      //     productCode: data.productCode,
      //     company: data.companyId,
      //   });

      //   if (productWithSameProductCode) {
      //     const isSameProduct = productWithSameProductCode._id.equals(id);

      //     if (!isSameProduct) {
      //       return res.status(400).json({
      //         message:
      //           "Product already exists with the same code for the company",
      //         success: false,
      //       });
      //     }
      //   }
      // }

      const product = await productModel.findById(id);

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product is not found", success: false });
      }

      const updatedProduct = await productModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true },
      );

      res.json({ data: updatedProduct, success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  })

  .delete("/delete/:id", async (req: GetUserAuthInfoRequest, res: any) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid product id", success: false });
    }

    const product = await productModel.findById(id).select("company").exec();

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product is not found", success: false });
    }

    const isSameCompanyResponse = await isSameCompany(
      req,
      product.company as string | mongoose.Types.ObjectId,
    );

    if (!isSameCompanyResponse) {
      return res.status(401).json({
        message: "You are not authorized to delete this product",
        success: false,
      });
    }
    

    try {
      await productModel.findByIdAndDelete(id);

      res.json({ message: "Product deleted successfully", success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  });

export default router;
