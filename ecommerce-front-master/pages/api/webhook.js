import { mongooseConnect } from "'lib/mongoose'";
import { Order } from "'models/Order'";
import crypto from 'crypto';

export default async function handler(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify the webhook signature
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(400).send('Invalid signature');
  }

  await mongooseConnect();

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const { order_id, payment_id } = payload;
    await Order.updateOne(
      { razorpay_order_id: order_id },
      { razorpay_payment_id: payment_id, paid: true }
    );
  }

  res.status(200).send('OK');
}
