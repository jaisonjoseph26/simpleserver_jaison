
/*PROG8165 - Web Design and Development Princ
Instructor: R Kozak

Group members: 

1) Jaison Joseph - Student no: 7714660
2) Sailesh Valiveti - Student No 7832116

*/
 // http request statements: requests http module and path to execute the http requests and path is used to define the folders for static contents like images etc
var http = require('http');
var path = require('path');
var fs = require('fs');

// related to express module
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

//modules neede to maintain session and perform authentication (passport) related tasks)

const userAuth = require('./userAuth.js');
const hash = require('./utils/hash.js');
const email = require('./utils/sendmail.js');
const passport = require('passport');



// database related
var mongoose = require('mongoose');
const dbUrl = 'mongodb://admin_insta:admin123@ds019038.mlab.com:19038/insta_mongodb';
mongoose.connect(dbUrl);
mongoose.Promise = require('bluebird');


//create a database sessions collection as well
const session = require('express-session');  
const mongoSession = require('connect-mongodb-session')(session);
var mongoSessionStore = new mongoSession({
    uri: dbUrl,
    collection: 'sessions'
});

// this helps to see your mongoose raw queries, useful for debugging
mongoose.set('debug', true);

app.use(express.static(__dirname + '/client/public'));


//tell the router to parse JSON data for us and put it into req.body
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
const PasswordReset = require('./models/PasswordReset.js');

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

app.get('/join',function(req, res){
  res.sendFile(path.join(__dirname+'/client/view/join.html'));
});

//tell the router how to handle a post request to the join page
app.post('/join', function(req, res, next) {
  passport.authenticate('signup', function(err, user, info) {
    console.log("jaison_insidepassportwelcometop");
    if (err){
      res.json({isValid: false, message: 'internal error'});    
    } else if (!user) {
      res.json({isValid: false, message: 'try again'});
    } else {
      //log this user in since they've just joined
      req.logIn(user, function(err){
        if (!err){console.log("jaison_insidepassportwelcome");
          //send a message to the client to say so
          res.json({isValid: true, message: 'welcome ' + user.email});
        }
      });
    }
  })(req, res, next);
});


//Route to take user to the signin page
app.get('/', function(req, res){
  console.log('client requests signin');
    res.sendFile(path.join(__dirname+'/client/view/signin.html'));

  //res.redirect('/');
});

//tell the router how to handle a post request from the signin page
app.post('/signin', function(req, res, next) {
  //tell passport to attempt to authenticate the login
  passport.authenticate('login', function(err, user, info) {
    //callback returns here
    if (err){
      //if error, say error
      res.json({isValid: false, message: 'internal error'});
    } else if (!user) {
      //if no user, say invalid login
      res.json({isValid: false, message: 'try again'});
    } else {
      //log this user in
      req.logIn(user, function(err){
        if (!err)
        {// console.log("inside_login_server.js");
          //send a message to the client to say so
          res.json({isValid: true, message: 'welcome ' + user.email});
        }
      });
    }
  })(req, res, next);
});

app.get('/passwordreset', (req, res) => {
 // console.log('client requests passwordreset');
  res.sendFile(path.join(__dirname, 'client/view', 'passwordreset.html'));
});

app.post('/passwordreset', (req, res) => {
    Promise.resolve()
    .then(function(){
        //see if there's a user with this email
        return User.findOne({'email' : req.body.email});
    })
    .then(function(user){
      if (user){
        var pr = new PasswordReset();
        pr.userId = user.id;
        pr.password = hash.createHash(req.body.password);
        pr.expires = new Date((new Date()).getTime() + (20 * 60 * 1000));
        pr.save()
        .then(function(pr){
          if (pr){
            email.send(req.body.email, 'password reset', 'https://node-app-jaisonjoseph26.c9users.io/verifypassword?id=' + pr.id);
          res.json("mail_sent");
            
          }
        });
      }
    })
});

app.get('/verifypassword', function(req, res){
    var password;
    Promise.resolve()
    .then(function(){
           

      return PasswordReset.findOne({_id: req.query.id});
    })
    .then(function(pr){
      if (pr){
        if (pr.expires > new Date()){
          password = pr.password;
          //see if there's a user with this email
          return User.findOne({_id : pr.userId});
        }
      }
    })
    .then(function(user){
      if (user){
        user.password = password;
         user.save();
         var msg="reset_success"
          res.redirect('/?msg=' + msg);


      }
    })
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
