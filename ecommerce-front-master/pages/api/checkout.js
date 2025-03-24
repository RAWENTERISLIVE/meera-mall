import { mongooseConnect } from "'lib/mongoose'";
import { Product } from "'models/Product'";
import { Order } from "'models/Order'";
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.json('should be a POST request');
    return;
  }
  
  const {
    name, email, city,
    postalCode, streetAddress, country,
    cartProducts,
  } = req.body;

  await mongooseConnect();
  const productsIds = cartProducts;
  const uniqueIds = [...new Set(productsIds)];
  const productsInfos = await Product.find({ _id: uniqueIds });

  let line_items = [];
  for (const productId of uniqueIds) {
    const productInfo = productsInfos.find(p => p._id.toString() === productId);
    const quantity = productsIds.filter(id => id === productId)?.length || 0;
    if (quantity > 0 && productInfo) {
      line_items.push({
        quantity,
        price: productInfo.price * 100, // Razorpay expects price in paise
      });
    }
  }

  const orderDoc = await Order.create({
    line_items, name, email, city, postalCode,
    streetAddress, country, paid: false,
  });

  const options = {
    amount: line_items.reduce((acc, item) => acc + item.price * item.quantity, 0), // Total amount in paise
    currency: 'INR',
    receipt: orderDoc._id.toString(),
  };

  const order = await razorpay.orders.create(options);

  res.json({
    id: order.id,
  });
}
