import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import userRoutes from "./routes/User";
import companyRoutes from "./routes/Company";
import categoryRoutes from "./routes/Category";
import productRoutes from "./routes/Product";
import { userValidate } from "./utils/userValidation";
import { createClient } from "redis";
import redisRoutes from "./routes/Redisquery";
import saleOrderRoutes from "./routes/SaleOrder";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

export const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT as string),
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));
client.connect().then(() => console.log("Connected to Redis"));

mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Invoice App!");
});

app.use("/api/user", userRoutes);
app.use("/api/company", userValidate as any, companyRoutes);
app.use("/api/category", userValidate as any, categoryRoutes);
app.use("/api/product", userValidate as any, productRoutes);
app.use("/api/redis", redisRoutes);
app.use("/api/saleorder", userValidate as any, saleOrderRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
