import { GetUserAuthInfoRequest } from "../types/types";
import { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import userModel from "../models/User";
import { Types } from "mongoose";
// import { getOrSetCache } from "./caching";

export const isAdmin = async (
  req: GetUserAuthInfoRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized", success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const adminId = decoded.id;

    const user = await userModel.findById(adminId);

    if (user?.type !== "admin") {
      return res
        .status(401)
        .json({ message: "You have no admin rights", success: false });
    }

    req.user = {
      id: user.id,
      email: user.email,
      companyId: user.company,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", success: false });
  }
};

export const userValidate = async (
  req: GetUserAuthInfoRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ message: "Access Denied", success: false });
  }

  const tokenRegex = /^Bearer (.+)$/;

  const tokenMatch = token.match(tokenRegex);

  if (!tokenMatch) {
    return res.status(401).send({ message: "Invalid Token", success: false });
  }

  try {
    const verified = await jwt.verify(
      tokenMatch[1],
      process.env.JWT_SECRET! as string,
    );

    req.user = verified as string;

    next();
  } catch (err) {
    console.log("Error verifying token", err);
    res.status(400).send({ message: "Invalid Token", success: false });
  }
};

export const isSameCompany = async (
  req: GetUserAuthInfoRequest,
  companyId: Types.ObjectId | string,
) => {
  const { id: userId } = req.user as { id: string };
  if (userId) {
    const user = await userModel.findById(userId);
    // const user = await getOrSetCache(`user_${userId}`, async () => {
    //   return await UserModel.findById(userId);
    // });

    if (user && user.company) {
      if (user.company.toString() !== companyId.toString()) {
        return false;
      }
    }
  }

  return true;
};
