// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
var moment = require('moment'); // require
moment().format(); 

app.use(bodyParser.json())
app.set('json spaces', 4)

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public')); //  this is to serve  images, CSS files, and JavaScript files in a directory named public

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (req, res) =>{
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/timestamp',(req,res)=>{
  res.sendFile(__dirname + '/views/timestamp.html');
})

app.get('/requestHeaderParser',(req,res)=>{
  res.sendFile(__dirname + '/views/requestHeaderParser.html');
})

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/timestamp',(req,res)=>{
  var currentTime = new Date();
  res.json({'unix':currentTime.getTime(),'utc': currentTime.toUTCString()});
});

app.get('/api/timestamp/:date_string', (req, res, next) => {
  var dateString = req.params.date_string;
  var dateVal = moment(dateString);
  if(dateVal.isValid()){
    res.json({ unix: dateVal.valueOf(), utc: new Date(dateString).toUTCString()});
  }else{
    if(isNaN(Number(dateString))){
      res.json({ 'error': 'Invalid Date' });
    }
    else{
      var adjustedDate = moment(Number(dateString));
      if(adjustedDate.isValid()){
        res.json({ unix: adjustedDate.valueOf(), utc: new Date(Number(dateString)).toUTCString() });
      }
      else{
        res.json({ 'error': 'Invalid Date' });
      }
    }
  }
});

app.get('/api/whoami',(req,res)=>{
  res.json({
    ipaddress: req.socket.remoteAddress,
    language: req.headers['accept-language'],
    reqHeaders: req.headers['user-agent']
  });
});

var listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});