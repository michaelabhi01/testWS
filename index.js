const http = require('http');
const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var twilio = require('twilio');
var accountSid = 'ACeb82062d50674c44e16249311a3408d6'; // Your Account SID from www.twilio.com/console
var authToken = 'ba16bf1d03252f6c03e3a72d7837d204';   // Your Auth Token from www.twilio.com/console
var client = new twilio(accountSid, authToken);

const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true,
}));

app.all("/*", function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});

// server.listen(5000, ()=> console.log("server started at port 5000"));
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Listening on port ${port}.....`));

app.use('/contacts',(req,res) => {
    const dataBuffer = fs.readFileSync('contacts-list.json');
    const dataJSON = dataBuffer.toString();
    const contacts = JSON.parse(dataJSON);
    console.log(contacts);
    res.status(200).send(contacts);
});

app.use('/sendOtp', (req,res) => {
    var messageBody = req.body.message;
    var sendTo = req.body.contact;
    
client.messages.create({
    body: messageBody,
    to: sendTo,  // Text this number
    from: '+14013084134' // From a valid Twilio number
})
    .then(message => {
     
         MongoClient.connect(url, function(err, db) {
           if (err) throw err;
           var dbo = db.db("messages");
           dbo.collection("sentMessagesHistory").insert(req.body, function(err, res) {
                if (err) throw err;
               console.log("Inserted " + res.insertedCount + " records.");
               console.log(JSON.stringify(res.ops));
            db.close();
      });
  });
  return "OTP sent successfully!";
});
});


app.use('/sentMessages', (req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("messages");
        dbo.collection("sentMessagesHistory").find({}).sort({"date" : -1}).toArray(function(err, result){
            console.log(result);
            res.send(result);
        });
  });
});
