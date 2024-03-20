import { Request } from "express";
import { Types } from "mongoose";
export interface GetUserAuthInfoRequest extends Request {
  user:
    | string
    | object
    | {
        id: Types.ObjectId;
        email: string;
        companyId: Types.ObjectId;
      };
}
