const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qe4grrt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const toyCollection = client.db("toyStacks").collection('all_toys');


        // Creating index on two fields
        const indexKeys = { toyName: 1, description: 1 }; // Replace field1 and field2 with your actual field names
        const indexOptions = { name: "toyNameDescription" }; // Replace index_name with the desired index name
        const result = toyCollection.createIndex(indexKeys, indexOptions);

        app.get("/getToysByName/:text", async (req, res) => {
            const searchText = req.params.text;
            const result = await toyCollection
                .find({
                    $or: [
                        { toyName: { $regex: searchText, $options: "i" } },
                        //   { description: { $regex: searchText, $options: "i" } },
                    ],
                })
                .toArray();
            res.send(result);
        });


        // insert a toy to db 
        app.post('/upload-toy', async (req, res) => {
            const data = req.body;
            const result = await toyCollection.insertOne(data);
            res.send(result);
        })

        // read from db
        app.get('/all-toys', async (req, res) => {
            const toys = toyCollection.find().limit(20);
            const result = await toys.toArray();
            res.send(result);
        })

        // find a specific data from all data 
        app.get('/all-toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toyCollection.findOne(query);
            res.send(result);
        })

        // read from db by sub category
        app.get('/toys_by_category/:sub_category', async (req, res) => {
            console.log(req.params.sub_category);
            if (req.params.sub_category == 'Architecture' || req.params.sub_category == 'Technic' || req.params.sub_category == 'Minifigures') {
                const toys = await toyCollection.find({ subCategory: req.params.sub_category }).limit(2).toArray();
                return res.send(toys);
            }
            const toys = await toyCollection.find({}).limit(2).toArray();
            return res.send(toys);
        })

        // query by email 
        app.get('/toys-by-email', async (req, res) => {
            // console.log(req.query.sellerEmail);
            let query = {};
            if (req.query?.sellerEmail) {
                query = { sellerEmail: req.query.sellerEmail }
            }
            const result = await toyCollection.find(query).toArray();
            res.send(result);
        })

        // query by email & sort desc
        app.get('/toys-by-email-desc', async (req, res) => {
            // console.log(req.query.sellerEmail);
            let query = {};
            if (req.query?.sellerEmail) {
                query = { sellerEmail: req.query.sellerEmail }
            }
            const result = await toyCollection.aggregate([
                { $match: query },
                { $addFields: { price: { $toDouble: '$price' } } },
                { $sort: { price: -1 } }
              ]).toArray();
            
              res.send(result);
        })

        // query by email & sort asc
        app.get('/toys-by-email-asc', async (req, res) => {
            // console.log(req.query.sellerEmail);
            let query = {};
            if (req.query?.sellerEmail) {
                query = { sellerEmail: req.query.sellerEmail }
            }
            const result = await toyCollection.aggregate([
                { $match: query },
                { $addFields: { price: { $toDouble: '$price' } } },
                { $sort: { price: 1 } }
              ]).toArray();
            
              res.send(result);
        })


        // update data in db
        app.patch('/update-toy/:id', async (req, res) => {
            const id = req.params.id;
            const updatedToyData = req.body;
            const filter = { _id: new ObjectId(id) };
            // console.log(updatedToyData);

            const updatedDoc = {
                $set: {
                    photo: updatedToyData.photo,
                    toyName: updatedToyData.toyName,
                    sellerName: updatedToyData.sellerName,
                    sellerEmail: updatedToyData.sellerEmail,
                    subCategory: updatedToyData.subCategory,
                    price: updatedToyData.price,
                    rating: updatedToyData.rating,
                    quantity: updatedToyData.quantity,
                    description: updatedToyData.description,

                }
            }
            const result = await toyCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // delete data in db 
        app.delete('/delete-toy/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const result = await toyCollection.deleteOne(filter);
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Toy server is running');
})

app.listen(port, () => {
    console.log(`Toy server is running on port ${port}`);
})