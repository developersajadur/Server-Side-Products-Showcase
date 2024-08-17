const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'https://productsshowcase-991cd.web.app',
        'http://localhost:5173',
        'https://your-deployment-url.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MongoDB URI is not defined in the .env file');
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const productsCollection = client.db("ProductsShowcase").collection("Products");

        app.get('/', (req, res) => {
            res.send('Products Showcase Server Is Running');
        });

        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = 6;
            const skip = (page - 1) * limit;
            const searchQuery = req.query.search || '';
            const brand = req.query.brand || '';
            const category = req.query.category || '';
            const minPrice = parseFloat(req.query.minPrice) || 0;
            const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
            const sort = req.query.sort || 'date_desc';

            const query = {
                name: { $regex: searchQuery, $options: 'i' },
                ...(brand && { brand }),
                ...(category && { category }),
                price: { $gte: minPrice, $lte: maxPrice }
            };

            const sortOptions = {
                price_asc: { price: 1 },
                price_desc: { price: -1 },
                date_asc: { creationDate: 1 },
                date_desc: { creationDate: -1 },
            };

            try {
                const products = await productsCollection
                    .find(query)
                    .sort(sortOptions[sort])
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                const totalProducts = await productsCollection.countDocuments(query);
                const totalPages = Math.ceil(totalProducts / limit);

                res.send({ products, totalPages });
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.get('/categories', async (req, res) => {
            try {
                const categories = await productsCollection.distinct('category');
                res.send(categories);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        app.get('/brands', async (req, res) => {
            try {
                const brands = await productsCollection.distinct('brand');
                res.send(brands);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Do not close the connection
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
