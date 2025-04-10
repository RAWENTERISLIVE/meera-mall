import { connectToDatabase } from "@/lib/mongodb";
import { Promotion } from "@/models/Promotion";

export default async function handler(req, res) {
  await connectToDatabase();

  const { id } = req.query;

  if (req.method === "GET") {
    const promotion = await Promotion.findById(id);
    if (!promotion) return res.status(404).json({ message: "Promotion not found" });
    return res.status(200).json(promotion);
  }

  if (req.method === "PUT") {
    const updatedPromotion = await Promotion.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPromotion) return res.status(404).json({ message: "Promotion not found" });
    return res.status(200).json(updatedPromotion);
  }

  if (req.method === "DELETE") {
    await Promotion.findByIdAndDelete(id);
    return res.status(204).end();
  }

  return res.status(405).json({ message: "Method not allowed" });
}
