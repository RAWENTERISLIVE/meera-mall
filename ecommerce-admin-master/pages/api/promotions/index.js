import { connectToDatabase } from "@/lib/mongodb";
import { Promotion } from "@/models/Promotion";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const promotions = await Promotion.find({});
    return res.status(200).json(promotions);
  }

  if (req.method === "POST") {
    const newPromotion = new Promotion(req.body);
    await newPromotion.save();
    return res.status(201).json(newPromotion);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
