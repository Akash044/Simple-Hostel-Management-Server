const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const app = express();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ieei5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('boarders'));
app.use(fileUpload());

app.get('/', (req, res) => {
   res.send("server working");
})

client.connect(err => {
   const boarderCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL1);
   const adminCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL2);
   const rentCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL3);
   const mealCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL4);
   const roomCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL5);


   //  ALL BOOKS SECTION START HERE
   // read all boarders
   app.get('/boarders', (req, res) => {
      boarderCollection.find({})
         .toArray((err, documents) => {
            res.send(documents);
         })
   })
   // read bosrder by email
   app.get('/boarder/:email', (req, res) => {
      const userEmail = req.params.email;
      boarderCollection.find({ email: userEmail})
         .toArray((err, documents) => {
            res.send(documents[0]);
         })
   })
   app.post('/AddBoarder', (req, res) => {
      const borderInfo = req.body;
      boarderCollection.insertOne(borderInfo)
      .then(result => {
         res.send(result.insertedCount > 0)
      })
   })

   // insert new boarder
   // app.post('/addABoarder', (req, res) => {

   //    const boarderImg = req.files.file;
   //    // console.log(boarderImg);
   //    const newImg = boarderImg.data;
   //    const encodeImg = newImg.toString('base64');

   //    const image = {
   //       contentType: boarderImg.mimetype,
   //       size: boarderImg.size,
   //       img: Buffer.from(encodeImg, 'base64')
   //    };
   //    boarderCollection.insertOne(image)
   //       .then(result => {
   //          console.log("data added successfully");
   //          res.send(result.insertedCount > 0);
   //       })
   // })

   // app.patch('/update/:id', (req, res) => {
   //    collection.updateOne({ _id: ObjectId(req.params.id) },
   //       {
   //          $set: { name: req.body.name, age: req.body.age, studyAt: req.body.studyAt }
   //       })
   //       .then(res => console.log(res))
   // })

   // //  delete a book
   // app.delete('/deleteBook/:id', (req, res) => {
   //    collection.deleteOne({ _id: ObjectId(req.params.id) })
   //       .then(result => 
   //          {
   //             res.send(result.deletedCount > 0);
   //          })
   // })
   // ALL BOOKS SECTION END HERE

   // //ORDER SECTION START HERE
   // // add order
   // app.post('/addOrder', (req, res) => {
   //    const orderInfo = req.body;
   //    ordersCollection.insertOne(orderInfo)
   //       .then(result => {
   //          console.log("data added successfully");
   //          res.send(result);
   //       })
   // })

   // // read orders
   // app.get('/allOrder/:email', (req, res) => {
   //    ordersCollection.find({email: req.params.email })
   //       .toArray((err, documents) => {
   //          res.send(documents);
   //       })
   // })
   // // ORDER SECTION END HERE

   app.get('/admin', (req, res) => {
      adminCollection.find({email: req.query.email })
         .toArray((err, documents) => {
            console.log(documents.length)
            res.send(documents.length > 0);
         })
   })
   app.post('/addAdmin', (req, res) => {
      console.log(req.body);
      adminCollection.insertOne(req.body)
      .then(result => {
         res.send(result.insertedCount > 0)
      })
   })


   app.post('/addMeal', (req, res) => {
      console.log(req.body);
      mealCollection.insertOne(req.body)
      .then(result => {
         res.send(result.insertedCount > 0)
      })
   })
   app.post('/addRent', (req, res) => {
      console.log(req.body);
      rentCollection.insertOne(req.body)
      .then(result => {
         res.send(result.insertedCount > 0)
      })
   })
   app.get('/paidRents/:email', (req, res) => {
      rentCollection.find({email: req.params.email })
         .toArray((err, documents) => {
            console.log(documents)
            res.send(documents);
         })
   })


// room section
   app.post('/addRoom', (req, res) => {
      console.log(req.body);
      roomCollection.insertOne(req.body)
      .then(result => {
         res.send(result.insertedCount > 0)
      })
   })
   app.get('/allRooms', (req, res) => {
      roomCollection.find({})
         .toArray((err, documents) => {
            console.log(documents)
            res.send(documents);
         })
   })
});
app.listen(process.env.PORT || 8080);