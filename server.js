require('dotenv').config();
// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const mongo = require('mongodb'); // for url shortener practice
const mongoose = require('mongoose'); //for url shortener practice
const { Schema } = mongoose;
var moment = require('moment'); // require
var { nanoid } = require('nanoid');
const validUrl = require('valid-url');
var dns = require('dns')
const dateformat = require('dateformat');
moment().format();


mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Defining models that use schemas
var ShortURL = mongoose.model('ShortURL', new Schema({
  short_url: String,
  original_url: String
}));
var User = mongoose.model('User', new Schema({
  username: { type: String, required: true },
  _id: String
}));
var Exercise = mongoose.model('Exercise', new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}));

app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.set('json spaces', 4);


// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const { json } = require('body-parser');
const { Console } = require('console');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public')); //  this is to serve  images, CSS files, and JavaScript files in a directory named public

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
  (mongoose.connection.readyState === 1) ? status = "MongoDB online" : status = "MongoDB offline"
  console.log(status)
});

//Links
app.get('/timestamp', (req, res) => {
  res.sendFile(__dirname + '/views/timestamp.html');
})

app.get('/requestHeaderParser', (req, res) => {
  res.sendFile(__dirname + '/views/requestHeaderParser.html');
})

app.get('/urlShortener', (req, res) => {
  res.sendFile(__dirname + '/views/urlShortener.html');
})

app.get('/exerciseTracker', (req, res) => {
  res.sendFile(__dirname + '/views/exerciseTracker.html');
})
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/timestamp', (req, res) => {
  var currentTime = new Date();
  res.json({ 'unix': currentTime.getTime(), 'utc': currentTime.toUTCString() });
});

app.get('/api/timestamp/:date_string', (req, res, next) => {
  var dateString = req.params.date_string;
  var dateVal = moment(dateString);
  if (dateVal.isValid()) {
    res.json({ unix: dateVal.valueOf(), utc: new Date(dateString).toUTCString() });
  } else {
    if (isNaN(Number(dateString))) {
      res.json({ 'error': 'Invalid Date' });
    }
    else {
      var adjustedDate = moment(Number(dateString));
      if (adjustedDate.isValid()) {
        res.json({ unix: adjustedDate.valueOf(), utc: new Date(Number(dateString)).toUTCString() });
      }
      else {
        res.json({ 'error': 'Invalid Date' });
      }
    }
  }
});

app.get('/api/whoami', (req, res) => {
  res.json({
    ipaddress: req.socket.remoteAddress,
    language: req.headers['accept-language'],
    software: req.headers['user-agent']
  });
});



app.post('/api/shorturl/new', (req, res) => {
  //check whether the original_url is within the DB
  let original_url = req.body.url;
  ShortURL.find({ original_url: req.body.url }, (err, docs) => {
    if (err) console.error(err);
    if (docs.length > 0) {
      res.json({
        original_url: docs[0].original_url,
        short_url: docs[0].short_url
      });
    }
    else {
      //creating a document from model (to be saved into DB later on)
      let postedURL = req.body.url;
      if (!/^https?:\/\//i.test(postedURL)) {
        res.json({
          error: 'invalid url'
        });
      }
      else {
        const urlObject = new URL(postedURL);
        console.log(urlObject);
        dns.lookup(urlObject.hostname, (err, address, family) => {
          if (err) {
            res.json({ error: 'invalid url' });
          }
          else {
            let suffix = nanoid(6);
            let newURL = new ShortURL({
              original_url: postedURL,
              short_url: suffix
            });
            //to save the document to DB
            newURL.save((err, doc) => {
              if (err) return console.error(err);
              res.json({
                saved: true,
                short_url: newURL.short_url,
                original_url: newURL.original_url,
              })
            });
          }
        });
      }
    }
  });
});

app.get('/api/shorturl/:suffix', (req, res) => {
  let userGeneratedSuffix = req.params.suffix;
  ShortURL.find({ short_url: userGeneratedSuffix }, (err, docs) => {
    if (err) return console.error(err);
  }).then((foundURLs) => {
    let urlForRedirect = foundURLs[0];
    res.redirect(urlForRedirect.original_url);
  });
})

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

app.post('/api/exercise/new-user', (req, res) => {
  let postedUser = req.body.username;
  if (isBlank(postedUser)) { return console.error('No username has been provided'); }
  else {
    postedUser = postedUser.replace(/^\s+|\s+$|\s+(?=\s)/g, ""); // removing unnecessary whitespaces from the posted user name
    User.find({ username: postedUser }, (err, users) => {
      if (users.length > 0) {
        res.json({
          saved: false,
          username: users[0].username,
          _id: users[0].get('_id')
        })
      }
      else {
        let newUser = new User({
          username: postedUser,
          _id: nanoid(5)
        })
        newUser.save((err, doc) => {
          if (err) return console.error(err);
          res.json({
            saved: true,
            username: newUser.username,
            _id: newUser._id,
          })
        });
      }
    });
  }
})

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, users) => {
    res.json(users);
  })
})

app.post('/api/exercise/add', (req, res) => {
  let user = User.findById(req.body.userId,
    (err, user) => {
      if (err) { return console.error(err, ' <= No user with the id found'); }
      var date = isBlank(req.body.date) ? new Date().toISOString().substring(0, 10) : new Date(req.body.date).toISOString().substring(0.10);
      const newExercise = new Exercise({
        userId: req.body.userId,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: date
      });

      newExercise.save((err, doc) => {
        if (err) return console.error(err);
        let rObj = {
          _id: user._id,
          username: user.username,
          description: newExercise.description,
          duration: newExercise.duration,
          date: new Date(newExercise.date).toDateString()
        };
        res.json(rObj);
      });
    });
});

app.get('/api/exercise/log', (req, res) => {
  let userID = req.query.userId;
  User.findById(userID, (err, user) => {
    if (err) { return console.error(err); }
    let userObj = {
      _id: userID,
      username: user.username
    };
    console.log(userObj,' <= userObj');
    Exercise.find({ userId: userID }, (err, exercises) => {
      if (err) { return console.error(err); }
      console.log(userObj, ' <= userObj')
      console.log(exercises, ' <= exercises');
      let exerciseObj = {log: exercises};
      let mergedObj = Object.assign(userObj, exerciseObj);
      console.log(mergedObj, ' <= mergedObj');
      res.json(mergedObj);
    });
  })
});

var listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});


