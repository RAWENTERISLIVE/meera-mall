import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    const { id } = req.query;
    
    if (req.method === 'PUT') {
      const { status, orderThreshold } = req.body;
      
      // Get the current product
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Update product status
      if (status) {
        await Product.findByIdAndUpdate(id, {
          $set: {
            status,
            'inventory.lastUpdated': new Date(),
            ...(status === 'in_stock' 
              ? { 'inventory.tracked': true }
              : { 'inventory.tracked': false })
          }
        });
      }

      // Update order threshold
      if (orderThreshold) {
        await Product.findByIdAndUpdate(id, {
          $set: {
            orderThreshold,
            'inventory.tracked': true
          }
        });
      }

      // Get recent orders count
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const recentOrders = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: twentyFourHoursAgo },
            'items.product': product._id
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.product': product._id
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: '$items.quantity' }
          }
        }
      ]);

      // Check if threshold is exceeded
      if (orderThreshold && recentOrders.length > 0) {
        const totalOrders = recentOrders[0].totalOrders;
        if (totalOrders >= orderThreshold) {
          await Product.findByIdAndUpdate(id, {
            $set: {
              status: 'out_of_stock',
              'inventory.tracked': false,
              'inventory.lastUpdated': new Date()
            }
          });
        }
      }

      // Get updated product
      const updatedProduct = await Product.findById(id).populate('category');
      
      res.json({
        success: true,
        product: {
          ...updatedProduct.toObject(),
          recentOrders: recentOrders.length > 0 ? recentOrders[0].totalOrders : 0
        }
      });
    } else if (req.method === 'GET') {
      const product = await Product.findById(id).populate('category');
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get recent orders count
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const recentOrders = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: twentyFourHoursAgo },
            'items.product': product._id
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.product': product._id
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: '$items.quantity' }
          }
        }
      ]);

      res.json({
        ...product.toObject(),
        recentOrders: recentOrders.length > 0 ? recentOrders[0].totalOrders : 0
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory Sync API Error:', error);
    res.status(500).json({ error: 'Failed to process inventory sync request' });
  }
}
