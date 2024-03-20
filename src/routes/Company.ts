import companyModel from "../models/Company";
import userModel from "../models/User";
import express from "express";
import mongoose from "mongoose";
import joi from "joi";

const router = express.Router();

const companySchema = joi.object({
  adminId: joi.string().required(),
  companyName: joi.string().required(),
  email: joi.string().email(),
  address: joi.string(),
  phoneNumber: joi.string(),
  balance: joi.number(),
  logo: joi.string(),
  gstNumber: joi.string(),
  website: joi.string(),
  fssaiNumber: joi.string(),
});

const companyUpdateSchema = joi.object({
  companyName: joi.string(),
  email: joi.string().email(),
  address: joi.string(),
  phoneNumber: joi.string(),
  balance: joi.number(),
  logo: joi.string(),
  gstNumber: joi.string(),
  website: joi.string(),
  fssaiNumber: joi.string(),
});

router
  .post("/create", async (req, res) => {
    try {
      const { value: data, error } = companySchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
          success: false,
        });
      }

      if (!mongoose.Types.ObjectId.isValid(data.adminId)) {
        return res.status(400).json({
          message: "Invalid admin id",
          success: false,
        });
      }

      const admin = await userModel.findById(data.adminId);

      if (!admin) {
        return res.status(404).json({
          message: "Admin not found",
          success: false,
        });
      }

      if (admin.company) {
        return res.status(400).json({
          message: "Admin already has a company cannot create another",
          success: false,
        });
      }

      if (admin.type !== "admin") {
        return res.status(403).json({
          message: "You are not authorized to create a company",
          success: false,
        });
      }

      const company = new companyModel({
        companyName: data.companyName,
        email: data.email,
        address: data.address,
        phoneNumber: data.phoneNumber,
        balance: data.balance,
        logo: data.logo,
        gstNumber: data.gstNumber,
        website: data.website,
        fssaiNumber: data.fssaiNumber,
      });

      await company.save();

      admin.company = company._id;

      await admin.save();

      res.status(200).json({
        message: "Company created successfully and assigned to admin",
        data: company,
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  })

  .get("/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Company id is required",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid company id",
        success: false,
      });
    }

    try {
      const company = await companyModel.findById(id);

      if (!company) {
        return res.status(404).json({
          message: "Company not found",
          success: false,
        });
      }

      res.status(200).json({
        message: "Company fetched successfully",
        data: company,
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  })

  .patch("/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Company id is required",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid company id",
        success: false,
      });
    }

    try {
      const company = await companyModel.findById(id);

      if (!company) {
        return res.status(404).json({
          message: "Company not found",
          success: false,
        });
      }

      const { value: data, error } = companyUpdateSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
          success: false,
        });
      }

      company.companyName = data.companyName || company.companyName;
      company.email = data.email || company.email;
      company.address = data.address || company.address;
      company.phoneNumber = data.phoneNumber || company.phoneNumber;
      company.balance = data.balance || company.balance;
      company.logo = data.logo || company.logo;
      company.gstNumber = data.gstNumber || company.gstNumber;
      company.website = data.website || company.website;
      company.fssaiNumber = data.fssaiNumber || company.fssaiNumber;

      await company.save();

      res.status(200).json({
        message: "Company updated successfully",
        data: company,
        success: true,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message, success: false });
    }
  });

export default router;
