const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('MongoDB URI is not defined in the .env file');
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const productsCollection = client.db("ProductsShowcase").collection("Products");

        // Root Route
        app.get('/', (req, res) => {
            res.send('Products Showcase Server Is Running');
        });

        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = 6;  // Set limit to 6 products per page
            const skip = (page - 1) * limit;
        
            const searchQuery = req.query.search || '';
            const brand = req.query.brand || '';
            const category = req.query.category || '';
            const minPrice = parseFloat(req.query.minPrice) || 0;
            const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
            const sort = req.query.sort || 'date_desc';  // Default sort by newest first
        
            const query = {
                name: { $regex: searchQuery, $options: 'i' },  // Case-insensitive search
                ...(brand && { brand: brand }),
                ...(category && { category: category }),
                price: { $gte: minPrice, $lte: maxPrice }
            };
        
            const sortOptions = {
                price_asc: { price: 1 },
                price_desc: { price: -1 },
                date_asc: { createdAt: 1 },
                date_desc: { createdAt: -1 },
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
        

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
