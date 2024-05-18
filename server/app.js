require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

app.use(express.json());
app.use(cors());

// checkout api
app.post('/api/create-checkout-session', async (req, res) => {
  const { products, userId } = req.body;

  const lineItems = products.map((product) => ({
    price_data: {
      currency: 'inr',
      product_data: {
        name: product.dish,
        images: [product.imgdata],
      },
      unit_amount: product.price * 100,
    },
    quantity: product.qnty,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: 'http://localhost:3000/sucess',
    cancel_url: 'http://localhost:3000/cancel',
    metadata: { userId },
  });

  res.json({ id: session.id });
});

app.post(
  '/webhook',
  express.json({ type: 'application/json' }),
  (request, response) => {
    const event = request.body;
    console.log('event', event);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Save session to your database
      const userId = session.metadata.userId;
      const paymentDetails = {
        sessionId: session.id,
        userId: userId,
        amount_total: session.amount_total,
        payment_status: session.payment_status,
        // Add any other necessary details
      };
      // Implement your logic to save paymentDetails to your database
      console.log('Payment successful:', paymentDetails);
    }

    response.json({ received: true });
  }
);

app.get('/', (req, res) => {
  res.send('server is runningsssssss');
});

app.listen(8080, () => {
  console.log('server start');
});
