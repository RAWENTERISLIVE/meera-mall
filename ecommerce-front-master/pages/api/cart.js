import { mongooseConnect } from "../../lib/mongoose";
import { Product } from "../../models/Product";
import { ObjectId } from 'mongodb';

export default async function handle(req, res) {
  await mongooseConnect();
  
  if (req.method === 'POST') {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.json([]);
    }
    
    try {
      const validIds = ids.filter(id => {
        try {
          return ObjectId.isValid(id);
        } catch (e) {
          return false;
        }
      });
      
      const products = await Product.find({
        _id: { $in: validIds.map(id => new ObjectId(id)) }
      });
      
      res.json(products);
    } catch (error) {
      console.error('Cart API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
