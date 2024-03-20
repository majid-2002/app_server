import express, { Request, Response } from "express";
import userModel from "../models/User";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import Joi from "joi";
import { isAdmin } from "../utils/userValidation";
import { GetUserAuthInfoRequest } from "types/types";
import { Types } from "mongoose";
import {} from // clearAllCacheByPattern,
"../utils/caching";

const router = express.Router();

const signupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const passwordUpdateSchema = Joi.object({
  email: Joi.string().email().required(),
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
});

router
  .post("/signup", async (req, res) => {
    const { value: data, error } = signupSchema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    try {
      const existingUser = await userModel.findOne({ email: data.email });

      if (existingUser) {
        return res.status(400).json({
          message: existingUser.type + " is already registered",
          success: false,
        });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = new userModel({
        name: data.name,
        email: data.email,
        type: "admin",
        password: hashedPassword,
      });

      await user.save();

      return res.json({
        message: user.type + " registered successfully",
        success: true,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Internal Server Error", success: false });
    }
  })

  .post(
    "/createUser",
    isAdmin as any,
    async (req: GetUserAuthInfoRequest, res: any) => {
      const { value: data, error } = signupSchema.validate(req.body);

      const { companyId: companyIdofAdmin } = req.user as {
        companyId: Types.ObjectId;
      };

      if (!companyIdofAdmin) {
        return res
          .status(400)
          .json({ message: "Create a company first", success: false });
      }

      if (error) {
        return res
          .status(400)
          .json({ message: error.details[0].message, success: false });
      }

      try {
        const existingUser = await userModel.findOne({ email: data.email });

        if (existingUser) {
          return res.status(400).json({
            message: "user is already created",
            success: false,
          });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = new userModel({
          name: data.name,
          email: data.email,
          type: "user",
          password: hashedPassword,
          company: companyIdofAdmin,
        });

        await user.save();

        return res.json({
          message: user.type + " created successfully",
          success: true,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Internal Server Error", success: false });
      }
    },
  )

  .post("/login", async (req, res) => {
    const { value: data, error } = loginSchema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    try {
      const user = await userModel
        .findOne({ email: data.email })
        .select("+password");

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid email or password", success: false });
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password,
      );

      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "Invalid email or password", success: false });
      }

      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
      } as JwtPayload;

      const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });

      res.json({ message: "Logged in successfully", token, success: true });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal Server Error", success: false });
    }
  })

  .patch("/updatepassword", async (req, res) => {
    const { value: data, error } = passwordUpdateSchema.validate(req.body);

    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    try {
      const user = await userModel
        .findOne({ email: data.email })
        .select("+password");

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid email or password", success: false });
      }

      const isPasswordValid = await bcrypt.compare(
        data.oldPassword,
        user.password,
      );

      if (!isPasswordValid) {
        return res
          .status(400)
          .json({ message: "Invalid email or password", success: false });
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      user.password = hashedPassword;

      await user.save();

      // await clearAllCacheByPattern(`user_${user._id}*`);

      res.json({ message: "Password updated successfully", success: true });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal Server Error", success: false });
    }
  })

  .get("/verify", async (req: Request, res: Response) => {
    // pass the token in the header like this
    //
    // fetch(apiUrl, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    // })

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    try {
      const decoded = (await jwt.verify(
        token,
        process.env.JWT_SECRET!,
      )) as JwtPayload;

      const userId = decoded.id;

      const user = await userModel.findById(userId);

      if (!user) {
        return res
          .status(401)
          .json({ message: "Unauthorized", success: false });
      }

      res.json({ message: "Authorized", data: user, success: true });
    } catch (error) {
      res.status(401).json({ message: "Unauthorized", success: false });
    }
  });

export default router;
