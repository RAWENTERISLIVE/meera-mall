import { mongooseConnect } from "../../lib/mongoose";
import { Product } from "../../models/Product";
import multiparty from 'multiparty';
import fs from 'fs';
import path from 'path';

export default async function handle(req, res) {
  await mongooseConnect();

  try {
    if (req.method === 'POST') {
      const form = new multiparty.Form();
      
      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      });

      // If files are present, it's an image upload
      if (files?.file) {
        const links = [];
        for (const file of files.file) {
          const ext = path.extname(file.originalFilename);
          const newFilename = Date.now() + ext;
          const publicPath = path.join(process.cwd(), 'public', 'uploads');
          
          // Create uploads directory if it doesn't exist
          if (!fs.existsSync(publicPath)) {
            fs.mkdirSync(publicPath, { recursive: true });
          }
          
          const destinationPath = path.join(publicPath, newFilename);
          fs.copyFileSync(file.path, destinationPath);
          links.push(`/uploads/${newFilename}`);
        }
        res.json({ links });
        return;
      }

      // If no files, it's a product creation
      if (fields) {
        const productData = {};
        for (const [key, value] of Object.entries(fields)) {
          productData[key] = Array.isArray(value) ? value[0] : value;
        }

        if (productData.price) {
          productData.price = parseFloat(productData.price);
        }
        if (productData.discount) {
          productData.discount = parseFloat(productData.discount);
        }
        if (productData.images) {
          productData.images = JSON.parse(productData.images);
        }

        const productDoc = await Product.create(productData);
        res.json(productDoc);
        return;
      }
    }

    if (req.method === 'GET') {
      const products = await Product.find().sort({ createdAt: -1 });
      res.json(products);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
