const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');


require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = process.env.MONGODB_URI

if (!uri) {
    throw new Error('MongoDB URI is not defined in the .env file');
  }
// const uri = process.env.MONGODB_URI;
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
    // Routes
    app.get('/', (req, res) => {      
        res.send(' Products Showcase Server Is Running');
      });

    //   get all products
    app.get('/products', async (req, res) => {
        const products = await productsCollection.find().toArray();
        res.send(products);
      });

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  run().catch(err => console.error('Run function failed:', err.message));
});
