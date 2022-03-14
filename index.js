const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
// const fs = require('fs-extra');
const nodemailer = require('nodemailer');
const saltRounds = 10;

require('dotenv').config();
const app = express();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ieei5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
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
   const mealRateCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL6);
   const guestCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL7);


   app.post('/addGuest', (req, res) => {
      // console.log(req.body)
      const guestImg = req.body.base64;
      const imgSize = req.body.fileSize;
      const type = req.body.type;
      const name = req.body.guestName;
      const mobile = req.body.mobile;
      const address = req.body.address;
      const date = req.body.today;
      const relativeEmail = req.body.relativeEmail;

      // console.log(roomNo);s
      // const newImg = boarderImg.data;
      // const newImg = boarderImg; 
      // const encodeImg = newImg.toString('base64');

      const image = {
         contentType: type,
         size: imgSize,
         img: Buffer.from(guestImg, 'base64')
         // img:newImg 
      };
      const guestInfo = { name: name, mobile: mobile, address: address, date: date, relativeEmail: relativeEmail, ...image }

      guestCollection.insertOne(guestInfo)
         .then(result => { 
            res.send(result.insertedCount > 0)
         })
   })

   app.post('/addMealRate', (req, res) => {
      const mealRateInfo = req.body;
      mealRateCollection.insertOne(mealRateInfo)
         .then(result => {
            res.send(result.insertedCount > 0)
         })
   })
   app.get("/allMealRate", (req, res) => {
      mealRateCollection.find({})
         .toArray((err, documents) => {
            res.send(documents);
         })
   })


   //  ALL BOOKS SECTION START HERE
   // read all boarders
   app.get('/boarders', (req, res) => {
      // console.log('hi')
      boarderCollection.find({})
         .toArray((err, documents) => {
            res.send(documents);
         })
   })
   // read boarder by email
   app.get('/boarder/:email', (req, res) => {
      const userEmail = req.params.email;
      boarderCollection.find({ email: userEmail })
         .toArray((err, documents) => {
            res.send(documents[0]);
         })
   })

   app.patch('/boarder/:email', (req, res) => {
      boarderCollection.updateOne({ email: req.params.email },
         {
            $set: {
               name: req.body.name,
               dept: req.body.dept,
               sec: req.body.sec,
               roll: req.body.roll,
               address: req.body.address,
               mobile: req.body.mobile,
               bp: req.body.bp,
            }
         })
         .then((result) => {
            res.send(result.modifiedCount > 0)
         });
   })

   app.get('/isUser', (req, res) => {
      boarderCollection.find({ email: req.query.email })
         .toArray((err, documents) => {
            res.send(documents.length > 0);
         })
   })
   app.post('/addBoarder', (req, res) => {
      const borderInfo = req.body;
      const password = req.body.password;

      bcrypt.genSalt(saltRounds, (err, salt) => {
         bcrypt.hash(password, salt, (err, hash) => {

            // console.log(hash);
            // Now we can store the password hash in db.
            boarderCollection.insertOne({ ...borderInfo, password: hash })
               .then(result => {
                  res.send(result.insertedCount > 0)
               })
         });
      });

   })

   // insert new boarder
   app.post('/uploadRoomImg', (req, res) => {
      // console.log(); 

      const boarderImg = req.body.base64;
      const imgSize = req.body.fileSize;
      const type = req.body.type;
      // console.log(boarderImg);
      // const newImg = boarderImg.data;
      // const newImg = boarderImg; 
      // const encodeImg = newImg.toString('base64');

      const image = {
         contentType: type,
         size: imgSize,
         img: Buffer.from(boarderImg, 'base64')
         // img:newImg
      };
      boarderCollection.insertOne(image)
         .then(result => {
            // console.log("data added successfully");
            res.send(result.insertedCount > 0);
         })
   })

   app.patch('/paidRents/:id', (req, res) => {




         console.log(req.body)
      



      let message = '';
      let mailResponse = false;
      if (req.body.status == "pending") {
         message = `Your payment (TrxID: ${req.body.trxID}) is being processed. Please wait for it to be processed.
                 Thank you`
      } else if (req.body.status == "paid") {
         message = `Your payment (TrxID: ${req.body.trxID}) is completed.
                 Thank you`
      } else {
         message = `Your payment (TrxID: ${req.body.trxID}) is unsuccessful. Please check the number and try again. If anything done wrong from you, I don't have any way to resolve this. Otherwise contact with me asap.
         Thank you`
      }


      rentCollection.updateOne({ trxId: req.params.id },
         {
            $set: { status: req.body.status }
         })
         .then((result) => {

            let transporter = nodemailer.createTransport({
               service: 'gmail',
               auth: {
                  user: process.env.GMAIL,
                  pass: process.env.PASS
               }
            });
            let mailOptions = {
               from: process.env.GMAIL,
               to: req.body.email,
               subject: 'Rent Status',
               text: message
            };
            transporter.sendMail(mailOptions, (err, resp) => {
               if (err) {
                  console.log(err);
                  mailResponse = false
                  result.modifiedCount > 0 && res.send({ updateInfo: true, mailResponse })

               }
               else {
                  console.log(resp);
                  mailResponse = true;
                  result.modifiedCount > 0 && res.send({ updateInfo: true, mailResponse })
               }

               // if (result.modifiedCount > 0) {
               //    res.send({ updateInfo: true, mailResponse })
               // } else {
               //    res.send({ updateInfo: true, mailResponse })
               // }

               // res.send(result.modifiedCount > 0)
            });

   }) 
})

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

      app.get('/isAdmin', (req, res) => {
         adminCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
               // console.log(documents.length)
               res.send(documents.length > 0);
            })
      })
      app.post('/addAdmin', (req, res) => {
         // console.log(req.body);
         adminCollection.insertOne(req.body)
            .then(result => {
               res.send(result.insertedCount > 0)
            })
      })


      app.post('/addMeal', (req, res) => {
         // console.log(req.body);
         mealCollection.insertOne(req.body)
            .then(result => {
               res.send(result.insertedCount > 0)
            })
      })

      app.get('/boarderMeal/:email', (req, res) => {
         mealCollection.find({ email: req.params.email })
            .toArray((err, documents) => {
               // console.log(documents)
               res.send(documents);
            })
      })

      app.post('/addRent', (req, res) => {
         // console.log(req.body);
         rentCollection.insertOne(req.body)
            .then(result => {
               // res.send(result.insertedCount > 0)


               if (result.insertedCount > 0) {

                  let mailResponse = false;

                  let transporter = nodemailer.createTransport({
                     service: 'gmail',
                     auth: {
                        user: process.env.GMAIL,
                        pass: process.env.PASS
                     }
                  });
                  let mailOptions = {
                     from: process.env.GMAIL,
                     to: req.body.email,
                     subject: 'Rent Status',
                     text: `Your payment (TrxID: ${req.body.trxId}) is being processed. Please wait for it to be processed.
               Thank you`
                  };
                  transporter.sendMail(mailOptions, (err, resp) => {
                     if (err) {
                        console.log(err); 
                        mailResponse = false;
                     }
                     else {
                        mailResponse = true;
                     }
                  });
                  res.send({ updateInfo: true, mailResponse })

               } else {
                  res.send({ updateInfo: true, mailResponse })
               }

              
            })
      })
      app.get('/paidRents/:email', (req, res) => {
         rentCollection.find({ email: req.params.email })
            .toArray((err, documents) => {
               // console.log(documents)
               res.send(documents);
            })
      })
      app.get('/paidRents', (req, res) => {
         rentCollection.find({})
            .toArray((err, documents) => {
               // console.log(documents)
               res.send(documents);
            })
      })


      // room section
      app.post('/addRoom', (req, res) => {
         // console.log(req.body.fileSize);

         const boarderImg = req.body.base64;
         const imgSize = req.body.fileSize;
         const type = req.body.type;
         const roomNo = req.body.roomNo;
         const seat = req.body.seat;
         const description = req.body.description;
         const vacantStatus = req.body.vacantStatus;

         // console.log(roomNo);s
         // const newImg = boarderImg.data;
         // const newImg = boarderImg; 
         // const encodeImg = newImg.toString('base64');

         const image = {
            contentType: type,
            size: imgSize,
            img: Buffer.from(boarderImg, 'base64')
            // img:newImg
         };
         const roomInfo = { roomNo: roomNo, seat: seat, description: description, vacantStatus: vacantStatus, ...image }

         roomCollection.insertOne(roomInfo)
            .then(result => {
               res.send(result.insertedCount > 0)
            })
      })
      app.get('/allRooms', (req, res) => {
         // console.log("asche")
         roomCollection.find({})
            .toArray((err, documents) => {
               // console.log(documents)
               res.send(documents);
            })
      })
      app.delete('/deleteRoom/:id', (req, res) => {
         roomCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
               res.send(result.deletedCount > 0);
            })
      })
      app.patch('/updateRoomInfo/:id', (req, res) => {
         console.log(req.body)
         roomCollection.updateOne({ _id: ObjectId(req.params.id) },
            {
               $set: {
                  roomNo: req.body.roomNo,
                  seat: req.body.seat,
                  description: req.body.description 
               } 
            }) 
            .then((result) => {
               res.send(result.modifiedCount > 0)
            });
      })

      app.get('/allMeals', (req, res) => {
         console.log("asche")
         mealCollection.find({})
            .toArray((err, documents) => {
               // console.log(documents)
               res.send(documents);  
            })
      })

      app.patch('/bookedRoom', (req, res) => {
         // console.log("okey  ", req.body)
         roomCollection.updateOne({ _id: ObjectId(req.body.id) },
            {
               $set: { vacantStatus: req.body.status }
            })
            .then((result) => {
               res.send(result.modifiedCount > 0)
            });
      })
      //room section end



      app.post('/login', (req, res) => {
         //  console.log("here ",req.body);
         const myPassword = req.body.password;

         adminCollection.find({ email: req.body.email })
            .toArray((err, documents) => {
               const info = { ...documents[0] };
               if (documents.length) {
                  bcrypt.compare(myPassword, info.password, function (err, response) {
                     if (response) {
                        res.json({ ...info, isAdmin: true, isUser: false, message: "" });
                     }
                     else {
                        res.json({ message: "Email or password is incorrect" });
                     }
                  });
               } else {
                  boarderCollection.find({ email: req.body.email })
                     .toArray((err, documents) => {
                        const info = { ...documents[0] };
                        if (documents.length) {
                           bcrypt.compare(myPassword, info.password, function (err, response) {
                              if (response) {
                                 res.json({ ...info, isAdmin: false, isUser: true, message: "" });
                              }
                              else {
                                 res.json({ message: "Email or password is incorrect" });
                              }
                           });
                        } else {
                           res.json({ message: "Email or password is incorrect" });
                        }
                     })
               }
            })


      })



   });

app.listen(process.env.PORT || 8085);