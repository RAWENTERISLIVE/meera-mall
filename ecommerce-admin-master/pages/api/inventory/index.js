import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    if (req.method === 'GET') {
      // Get all products with inventory information
      const products = await Product.find()
        .populate('category')
        .sort({ 'inventory.quantity': 1 }); // Sort by quantity ascending to show low stock first

      // Add additional inventory status information
      const productsWithStatus = products.map(product => {
        const doc = product.toObject();
        
        // Ensure inventory object exists
        if (!doc.inventory) {
          doc.inventory = {
            quantity: 0,
            lowStockThreshold: 10,
            tracked: true
          };
        }

        // Calculate inventory status
        doc.inventoryStatus = {
          isLowStock: doc.inventory.tracked && 
                      doc.inventory.quantity <= doc.inventory.lowStockThreshold,
          isOutOfStock: doc.inventory.quantity === 0,
          availableQuantity: doc.inventory.quantity - (doc.inventory.reservedQuantity || 0)
        };

        return doc;
      });

      // Calculate inventory statistics
      const stats = {
        totalProducts: productsWithStatus.length,
        lowStockProducts: productsWithStatus.filter(p => p.inventoryStatus.isLowStock).length,
        outOfStockProducts: productsWithStatus.filter(p => p.inventoryStatus.isOutOfStock).length,
        totalInventoryValue: productsWithStatus.reduce((sum, p) => 
          sum + (p.inventory.quantity * (p.costPrice || 0)), 0
        )
      };

      res.json({
        products: productsWithStatus,
        stats
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory API Error:', error);
    res.status(500).json({ error: 'Failed to process inventory request' });
  }
}
