import Joi from "joi";
import express from "express";
import companyModel from "../models/Company";
import productModel from "../models/Product";
import { GetUserAuthInfoRequest } from "types/types";
import { isSameCompany } from "../utils/userValidation";
import saleOrderModel from "../models/SaleOrder";
import InvoiceModel from "../models/Invoice";
import mongoose from "mongoose";

const router = express.Router();

const saleOrderSchema = Joi.object({
  companyId: Joi.string().required(),
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().required(),
      }),
    )
    .required(),
});

const saleOrderUpdateSchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().required(),
      }),
    )
    .required(),
});

router
  .post("/create", async (req: GetUserAuthInfoRequest, res: any) => {
    const { value: data, error } = saleOrderSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        success: false,
      });
    }

    const { id: userId } = req.user as { id: string };

    const isSameCompanyResult = await isSameCompany(req, data.companyId);

    if (!isSameCompanyResult) {
      return res.status(400).json({
        message: "You are not allowed to create an order for this company",
        success: false,
      });
    }

    try {
      const company = await companyModel.findById(data.companyId);

      if (!company) {
        return res.status(404).json({
          message: "Company not found",
          success: false,
        });
      }

      const orderProducts = [];
      let total = 0;

      for (const productData of data.products) {
        const product: any = await productModel
          .findById(productData.productId)
          .populate({
            path: "company",
            select: "_id",
          });

        if (
          !product ||
          product.company._id.toString() !== data.companyId.toString()
        ) {
          return res.status(400).json({
            message:
              "Invalid product or product does not belong to the company",
            success: false,
          });
        }

        const { sellingPrice, quantity } = product;

        if (quantity < productData.quantity) {
          return res.status(400).json({
            message: `${product.productName} is out of stock`,
            success: false,
          });
        }

        // to avoid race condition
        const productUpdate = await productModel.findOneAndUpdate(
          {
            _id: productData.productId,
            quantity: { $gte: productData.quantity },
          },
          { $inc: { quantity: -productData.quantity } },
          { new: true },
        );

        if (!productUpdate) {
          return res.status(400).json({
            message: "Product is out of stock or not found",
            success: false,
          });
        }

        orderProducts.push({
          product: productData.productId,
          quantity: productData.quantity,
        });

        total += sellingPrice * productData.quantity;
      }

      const order = await saleOrderModel.create({
        user: userId,
        company: data.companyId,
        status: "pending",
        products: orderProducts,
        total,
      });

      return res.status(201).json({
        message: "Order created successfully",
        data: order,
        success: true,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Internal Server Error",
        success: false,
      });
    }
  })

  .put("/place/:id", async (req: GetUserAuthInfoRequest, res: any) => {
    const { id } = req.params;

    try {
      const order: any = await saleOrderModel.findById(id).populate({
        path: "company",
        select: "_id",
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
          success: false,
        });
      }

      const isSameCompanyResult = await isSameCompany(req, order.company._id);

      if (!isSameCompanyResult) {
        return res.status(400).json({
          message: "You are not allowed to place an order for this company",
          success: false,
        });
      }

      if (order.status === "completed") {
        return res.status(400).json({
          message: "Order has already been placed",
          success: false,
        });
      }

      const updatedOrder = await saleOrderModel.findByIdAndUpdate(
        id,
        { status: "completed" },
        { new: true },
      );

      if (!updatedOrder) {
        return res.status(404).json({
          message: "Order not found",
          success: false,
        });
      }

      await InvoiceModel.create({
        saleorder: updatedOrder._id,
      });

      return res.status(200).json({
        message: "Order placed successfully",
        data: updatedOrder,
        success: true,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal Server Error",
        success: false,
      });
    }
  })

  // add more products
  .put("/add/:id", async (req: GetUserAuthInfoRequest, res: any) => {
    try {
      const { id } = req.params;
      const { value: data, error } = saleOrderUpdateSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
          success: false,
        });
      }

      const order: any = await saleOrderModel.findById(id).populate({
        path: "company",
        select: "_id",
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
          success: false,
        });
      }

      const isSameCompanyResult = await isSameCompany(req, order.company._id);

      if (!isSameCompanyResult) {
        return res.status(400).json({
          message: "You are not allowed to update this order",
          success: false,
        });
      }

      if (order.status === "completed") {
        return res.status(400).json({
          message: "Order has already been placed",
          success: false,
        });
      }

      if (order.status === "cancelled") {
        return res.status(400).json({
          message: "Order has been cancelled",
          success: false,
        });
      }

      const orderProducts = order.products;
      let total = 0;

      for (const productData of data.products) {
        const product: any = await productModel
          .findById(productData.productId)
          .populate({
            path: "company",
            select: "_id",
          });

        if (
          !product ||
          product.company._id.toString() !== order.company._id.toString()
        ) {
          return res.status(400).json({
            message:
              "Invalid product or product does not belong to the company",
            success: false,
          });
        }

        const { sellingPrice, quantity } = product;

        if (quantity < productData.quantity) {
          return res.status(400).json({
            message: `${product.productName} is out of stock`,
            success: false,
          });
        }

        const productUpdate = await productModel.findOneAndUpdate(
          {
            _id: productData.productId,
            quantity: { $gte: productData.quantity },
          },
          { $inc: { quantity: -productData.quantity } },
          { new: true },
        );

        if (!productUpdate) {
          return res.status(400).json({
            message: "Product is out of stock or not found",
            success: false,
          });
        }

        orderProducts.push({
          product: productData.productId,
          quantity: productData.quantity,
        });

        total += sellingPrice * productData.quantity;
      }

      const updatedOrder = await saleOrderModel.findByIdAndUpdate(
        id,
        { products: orderProducts, total },
        { new: true },
      );

      if (!updatedOrder) {
        return res.status(404).json({
          message: "Order not found",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Order updated successfully",
        data: updatedOrder,
        success: true,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal Server Error",
        success: false,
      });
    }
  })

  // update quantity of a product in the order
  .put("/update/:id", async (req: GetUserAuthInfoRequest, res: any) => {
    const { id } = req.params;
    const { value: data, error } = saleOrderUpdateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        success: false,
      });
    }
    const order: any = await saleOrderModel.findById(id).populate({
      path: "company",
      select: "_id",
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
      });
    }

    const isSameCompanyResult = await isSameCompany(req, order.company._id);

    if (!isSameCompanyResult) {
      return res.status(400).json({
        message: "You are not allowed to update this order",
        success: false,
      });
    }

    if (order.status === "completed") {
      return res.status(400).json({
        message: "Order has already been placed",
        success: false,
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        message: "Order has already been cancelled",
        success: false,
      });
    }

    // start a session to enable transaction in mongodb to avoid potential race condition when updating the product quantity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderProducts = order.products;
      let total = order.total;

      for (const productData of data.products) {
        for (const orderProduct of orderProducts) {
          if (orderProduct.product.toString() === productData.productId) {
            const product: any = await productModel
              .findById(productData.productId)
              .populate({
                path: "company",
                select: "_id",
              });

            const { sellingPrice } = product;

            // if (orderProduct.quantity === productData.quantity) {
            //   continue;
            // }

            if (
              orderProduct.quantity - productData.quantity >
              product.quantity
            ) {
              return res.status(400).json({
                message: `${product.productName} is out of stock`,
                success: false,
              });
            }

            const productUpdate = await productModel.findOneAndUpdate(
              { _id: productData.productId },
              {
                $inc: {
                  quantity: orderProduct.quantity - productData.quantity,
                },
              },
              { new: true },
            );

            total -=
              sellingPrice * (orderProduct.quantity - productData.quantity);
            orderProduct.quantity = productData.quantity;

            if (!productUpdate) {
              return res.status(400).json({
                message: "Product is out of stock or not found",
                success: false,
              });
            }

            break;
          }
        }
      }

      const updatedOrder = await saleOrderModel.findByIdAndUpdate(
        id,
        { products: orderProducts, total: total },
        { new: true },
      );

      if (!updatedOrder) {
        return res.status(404).json({
          message: "Order not found",
          success: false,
        });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: "Order updated successfully",
        data: updatedOrder,
        success: true,
      });
    } catch (error) {
      session.abortTransaction();
      session.endSession();
      console.error(error);
      return res.status(500).json({
        message: "Internal Server Error",
        success: false,
      });
    }
  });

export default router;
