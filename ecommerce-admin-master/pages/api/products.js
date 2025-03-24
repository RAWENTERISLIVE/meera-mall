import {Product} from "@/models/Product";
import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";

export default async function handle(req, res) {
  try {
    const {method} = req;
    
    // Connect to MongoDB
    try {
      await mongooseConnect();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Verify admin authentication
    try {
      await isAdminRequest(req,res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (method === 'GET') {
      try {
        if (req.query?.id) {
          const product = await Product.findOne({_id:req.query.id});
          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }
          return res.json(product);
        } else {
          const products = await Product.find();
          return res.json(products);
        }
      } catch (error) {
        console.error('GET request error:', error);
        return res.status(500).json({ error: 'Failed to fetch products' });
      }
    }

    if (method === 'POST') {
      try {
        const {title,description,price,images,category,properties} = req.body;
        
        if (!title || !price) {
          return res.status(400).json({ error: 'Title and price are required' });
        }

        // Create product data object, only include category if it's not empty
        const productData = {
          title,
          description,
          price,
          images,
          properties
        };
        if (category) {
          productData.category = category;
        }

        const productDoc = await Product.create(productData);
        return res.status(201).json(productDoc);
      } catch (error) {
        console.error('POST request error:', error);
        return res.status(500).json({ error: 'Failed to create product', details: error.message });
      }
    }

    if (method === 'PUT') {
      try {
        const {title,description,price,images,category,properties,_id} = req.body;
        
        if (!_id) {
          return res.status(400).json({ error: 'Product ID is required' });
        }

        // Create update data object, only include category if it's not empty
        const updateData = {
          title,
          description,
          price,
          images,
          properties
        };
        if (category) {
          updateData.category = category;
        }

        const updatedProduct = await Product.updateOne(
          {_id}, 
          updateData
        );

        if (updatedProduct.matchedCount === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }

        return res.json({ success: true });
      } catch (error) {
        console.error('PUT request error:', error);
        return res.status(500).json({ error: 'Failed to update product', details: error.message });
      }
    }

    if (method === 'DELETE') {
      try {
        if (!req.query?.id) {
          return res.status(400).json({ error: 'Product ID is required' });
        }

        const result = await Product.deleteOne({_id:req.query.id});
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }

        return res.json({ success: true });
      } catch (error) {
        console.error('DELETE request error:', error);
        return res.status(500).json({ error: 'Failed to delete product', details: error.message });
      }
    }

    // Handle unsupported methods
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
