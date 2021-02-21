// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
var moment = require('moment'); // require
moment().format(); 

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public')); //  this is to serve  images, CSS files, and JavaScript files in a directory named public

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


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

var listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
/*
app.get('/api/timestamp/:date_string',(req,res)=>{
  let dateString = req.params.date_string;
  let dateVal= new Date(dateString);
  if(dateVal)
  res.json({unix : dateVal.valueOf() , utc : dateVal.getUTCDate()});
});

// listen for requests :)
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
*/