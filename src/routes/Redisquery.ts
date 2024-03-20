import express from "express";
import { client } from "../app";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ message: "Invalid key", success: false });
    }

    const data = await client.get(key as string);
    if (!data) {
      return res
        .status(404)
        .json({ message: "Data is not found", success: false });
    }

    res.json({ data: JSON.parse(data as string), success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// async function printFromattedJSON(key: string) {
//   try {
//     const jsonString = await client.get(key);
//     const data = JSON.parse(jsonString as string);

//   } catch (error) {}
// }

export default router;
