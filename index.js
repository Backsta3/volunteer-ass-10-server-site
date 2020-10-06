const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express()
const port = 4200
require("dotenv").config();
const ObjectId = require('mongodb').ObjectId;


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hdbqd.mongodb.net/${process.env.DB_USER}?retryWrites=true&w=majority`;
app.use(bodyParser.json());
app.use(cors());
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const productsCollection = client.db("volunteerSite").collection("homeEvents");
    const userEventCollection = client.db("volunteerSite").collection("userEvents");

    app.post("/addEvent", (req, res) => {
        const products = req.body;
        productsCollection.insertOne(products)
            .then(result => {
                res.send(result.insertedCount);
            })
    })

    app.get('/events', (req, res) => {
        productsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.post("/addUserEvent", (req, res) => {
        const userEvent = req.body;
        userEventCollection.insertOne(userEvent)
            .then(result => {
                res.send(result.insertedCount);
            })
    })

    app.get('/userEventsAll', (req, res) => {
        userEventCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.delete("/delete/:id", (req, res) => {
        userEventCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                // console.log(result);
                res.send(result.deletedCount > 0)
            })
    })

    const admin = require('firebase-admin');
    var serviceAccount = require("./fardin-travel-guru-firebase-adminsdk-7adg9-ca6fdb5eed.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIRE_DB
    });

    app.get("/userEvents", (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {

            const idToken = bearer.split(' ')[1];

            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;

                    // verify
                    if (tokenEmail == queryEmail) {
                        userEventCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send("Unauthorized access!!")
                    }
                }).catch(function (error) {
                    res.status(401).send("Unauthorized access!!")
                });
        }

        else {
            res.status(401).send("Unauthorized access!!")
        }
    })
});


app.get('/', (req, res) => {
    res.send('I am Fardin man!')
})

app.listen(process.env.PORT || port)