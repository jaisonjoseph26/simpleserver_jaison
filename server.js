
/*PROG8165 - Web Design and Development Princ
Instructor: R Kozak

Group members: 

1) Jaison Joseph - Student no: 7714660
2) Sailesh Valiveti - Student No 7832116

*/
 
var http = require('http');
var path = require('path');
var express = require('express');
var app = express();
var fs = require('fs');

const passport = require('passport');
const dbUrl = 'mongodb://admin_insta:admin123@ds019038.mlab.com:19038/insta_mongodb';
const session = require('express-session');  
const mongoSession = require('connect-mongodb-session')(session);

const userAuth = require('./userAuth.js');
const hash = require('./utils/hash.js');
var mongoose = require('mongoose');



//mongoose.connect('mongodb://admin_insta:admin123@ds019038.mlab.com:19038/insta_mongodb');
//tell the router (ie. express) where to find static files

//establish connection to our mongodb instance
//use your own mongodb instance here
mongoose.connect(dbUrl);
//create a sessions collection as well
var mongoSessionStore = new mongoSession({
    uri: dbUrl,
    collection: 'sessions'
});


app.use(express.static(__dirname + '/client/public'));
//tell the router to parse JSON data for us and put it into req.body
var bodyParser = require('body-parser');
mongoose.Promise = require('bluebird');


app.use(bodyParser.urlencoded({ extended: false }));

// one of the parsers to parse in json
app.use(bodyParser.json());

//add session support
app.use(session({
  secret: process.env.SESSION_SECRET || 'mySecretKey', 
  store: mongoSessionStore,
  resave: true,
  saveUninitialized: false
}));
//add passport for authentication support
app.use(passport.initialize());
app.use(passport.session());
userAuth.init(passport);
//models
var Posts = require('./models/posts.js'); // include the posts model
const User = require('./models/user.js');

//var cat = mongoose.model('cat', { name: string });

/*/var kitty = new cat({ name: 'zildjian' });
kitty.save(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('meow');
  }
});*/


//added to posts table
// routing setup

var post = new Posts({ 
  postImage: './img/glyphicons-halflings-white.jpg',
  postComment: 'cool glphicon',
  postLikeCount: 0,
  postFeedbackCount: 0
});
//and then saves it to the mongodb instance we connected to above
post.save(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('posted');
  }
});






app.get('/index',function(req, res){
  res.sendFile(path.join(__dirname+'/client/view/index.html'));
});

app.get('/',function(req, res){
  res.sendFile(path.join(__dirname+'/client/view/join.html'));
});

//tell the router how to handle a post request to the join page
app.post('/join', function(req, res, next) {
  passport.authenticate('signup', function(err, user, info) {
    if (err){
      res.json({isValid: false, message: 'internal error'});    
    } else if (!user) {
      res.json({isValid: false, message: 'try again'});
    } else {
      //log this user in since they've just joined
      req.logIn(user, function(err){
        if (!err)
          //send a message to the client to say so
          res.json({isValid: true, message: 'welcome ' + user.email});
      });
    }
  })(req, res, next);
});


//Route to take user to the signin page
app.get('/signin', function(req, res){
  console.log('client requests signin');
  res.redirect('/');
});



//tell the router how to handle a post request to /posts
app.post('/posts', function(req, res){
  console.log('client requests posts list');
  
  //get all posts
  Posts.find({})
  .then(function(paths){
    //posts send to the index.html for disolaying the posts
    res.json(paths);
  })
  

});


var server = app.listen(process.env.PORT || 3000, function(){
    console.log("Server is listening...");
})
