import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Analytics } from "@/models/Analytics";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    const { id } = req.query;
    
    if (req.method === 'PUT') {
      const { quantity } = req.body;
      
      // Validate input
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'Invalid quantity value' });
      }

      // Get the current product
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const previousQuantity = product.inventory?.quantity || 0;
      const quantityChange = quantity - previousQuantity;

      // Update product inventory
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          $set: {
            'inventory.quantity': quantity,
            'inventory.lastUpdated': new Date()
          }
        },
        { new: true }
      );

      // Record inventory change in Analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await Analytics.findOneAndUpdate(
        { date: today },
        {
          $push: {
            'inventoryChanges': {
              productId: id,
              previousQuantity,
              newQuantity: quantity,
              change: quantityChange,
              timestamp: new Date(),
              reason: 'manual_update'
            }
          }
        },
        { upsert: true }
      );

      // Check if we need to send low stock alert
      if (quantity <= product.inventory.lowStockThreshold) {
        // In a real application, you might want to:
        // 1. Send email notifications
        // 2. Create system notifications
        // 3. Trigger automatic reorder processes
        console.log(`Low stock alert for product: ${product.title}`);
      }

      res.json({
        success: true,
        product: updatedProduct,
        inventoryStatus: {
          isLowStock: quantity <= product.inventory.lowStockThreshold,
          isOutOfStock: quantity === 0,
          availableQuantity: quantity - (product.inventory.reservedQuantity || 0)
        }
      });
    } else if (req.method === 'GET') {
      const product = await Product.findById(id).populate('category');
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get inventory history from Analytics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const inventoryHistory = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgo },
            'inventoryChanges.productId': product._id
          }
        },
        {
          $unwind: '$inventoryChanges'
        },
        {
          $match: {
            'inventoryChanges.productId': product._id
          }
        },
        {
          $sort: {
            'inventoryChanges.timestamp': -1
          }
        }
      ]);

      res.json({
        product,
        inventoryHistory,
        inventoryStatus: {
          isLowStock: product.inventory.quantity <= product.inventory.lowStockThreshold,
          isOutOfStock: product.inventory.quantity === 0,
          availableQuantity: product.inventory.quantity - (product.inventory.reservedQuantity || 0)
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory Item API Error:', error);
    res.status(500).json({ error: 'Failed to process inventory item request' });
  }
}
