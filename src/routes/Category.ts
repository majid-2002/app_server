import categoryModel from "../models/Category";
import express from "express";
import Joi from "joi";
import mongoose from "mongoose";
import { GetUserAuthInfoRequest } from "types/types";
import { isSameCompany } from "../utils/userValidation";

const catgorySchema = Joi.object({
  categoryName: Joi.string().required(),
  companyId: Joi.string().required(),
});

const router = express.Router();

router
  .post("/add", async (req: GetUserAuthInfoRequest, res: any) => {
    const { value: data, error } = catgorySchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message, success: false });
    }

    const isSameCompanyResponse = await isSameCompany(req, data.companyId);

    if (!isSameCompanyResponse) {
      return res.status(401).json({
        message: "You are not authorized to add category for this company",
        success: false,
      });
    }

    try {
      const categoryExists = await categoryModel.findOne({
        categoryName: data.categoryName,
        company: data.companyId,
      });

      if (categoryExists) {
        return res.status(400).json({
          message: "Category already exists for this company",
          success: false,
        });
      }

      const category = new categoryModel({
        categoryName: data.categoryName,
        company: data.companyId,
      });

      await category.save();
      return res
        .status(201)
        .json({ message: "Category added successfully", success: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message, success: false });
    }
  })

  .get("/", async (req: GetUserAuthInfoRequest, res: any) => {
    try {
      const { companyId } = req.query;

      if (!companyId) {
        return res
          .status(400)
          .json({ message: "Company id is required to retrieve categories" });
      }

      const isSameCompanyResponse = await isSameCompany(
        req,
        companyId as string,
      );

      if (!isSameCompanyResponse) {
        return res.status(401).json({
          message: "You are not authorized to add category for this company",
          success: false,
        });
      }

      if (companyId && !mongoose.Types.ObjectId.isValid(companyId as string)) {
        return res.status(400).json({ message: "Invalid company id" });
      }

      const categories = await categoryModel.find({ company: companyId });

      if (!categories) {
        return res
          .status(404)
          .json({ message: "No categories found", success: false });
      }

      return res.status(200).json({
        message: "all categories retrieved for company",
        data: categories,
        success: true,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message, success: false });
    }
  })

  .get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const category = await categoryModel.findById(id);

      if (!category) {
        return res
          .status(404)
          .json({ message: "Category not found", success: false });
      }

      return res.status(200).json({
        message: "Category retrieved",
        data: category,
        success: true,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message, success: false });
    }
  })

  .put("/:id", async (req: GetUserAuthInfoRequest, res: any) => {
    const { id } = req.params;
    const { value: data, error } = catgorySchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message, success: false });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid category id", success: false });
    }

    const isSameCompanyResponse = await isSameCompany(req, data.companyId);

    if (!isSameCompanyResponse) {
      return res.status(401).json({
        message: "You are not authorized to update category for this company",
        success: false,
      });
    }

    try {
      const category = await categoryModel.findById(id);

      if (!category) {
        return res
          .status(404)
          .json({ message: "Category not found", success: false });
      }

      const categoryExists = await categoryModel.findOne({
        categoryName: data.categoryName,
        company: data.companyId,
      });

      if (categoryExists) {
        return res.status(400).json({
          message: "Category already exists for this company with this name",
          success: false,
        });
      }

      category.categoryName = data.categoryName;
      await category.save();

      return res.status(200).json({
        message: "Category updated successfully",
        success: true,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message, success: false });
    }
  });

export default router;
