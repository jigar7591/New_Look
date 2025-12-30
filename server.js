const express = require('express');
const stripe = require('stripe')('sk_test_51YourStripeSecretKeyHere'); // Replace with your Stripe secret key
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files (HTML, CSS, JS)
app.use('/images', express.static('images')); // Serve images from the 'images' folder

// Sample inventory (replace with database)
const products = [
    { id: 1, name: "A", price: 29.99, image: "/images/tshirt.jpeg" },  // Local image path
    { id: 2, name: "B", price: 49.99, image: "/images/2.jpeg" },
    { id: 3, name: "C", price: 79.99, image: "/images/3.jpeg" },
    { id: 4, name: "D", price: 39.99, image: "/images/4.jpeg" },
    { id: 5, name: "E", price: 39.99, image: "/images/5.jpeg" },
    { id: 6, name: "F", price: 39.99, image: "/images/6.jpeg" },
    { id: 7, name: "G", price: 39.99, image: "/images/7.jpeg" },
    //{ id: 8, name: "Blue Jeans", price: 39.99, image: "/images/8.jpeg" },
    // Add more products here with local paths, e.g., { id: 5, name: "Sneakers", price: 59.99, image: "/images/sneakers.jpg" }
];

// API endpoints
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/checkout', async (req, res) => {
    const { paymentMethodId, amount, cart } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'gbp',
            payment_method: paymentMethodId,
            confirm: true,
        });
        // Here, process order (e.g., save to DB, send email)
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));