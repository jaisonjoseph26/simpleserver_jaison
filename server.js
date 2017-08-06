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
const fileUpload = require('express-fileupload');
const Guid = require('guid');

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
//add file upload support
app.use(fileUpload());

//models
var Posts = require('./models/Posts.js'); // include the posts model
const User = require('./models/User.js');
const PasswordReset = require('./models/PasswordReset.js');
const Like = require('./models/Like.js');


//added to posts table
// routing setup

/*var post = new Posts({ 
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
});*/


/* route to take user to the posts page,
the 'userAuth.isAuthenticated' parameter is like a middleware to check if the user accessing the post page is logged in or not */
app.get('/index', userAuth.isAuthenticated, function(req, res) {
  res.sendFile(path.join(__dirname + '/client/view/index.html'));
});

// route to take user to the join page

app.get('/join', function(req, res) {
      if (req.user) {
    res.redirect('/index');
  }
  else {
  res.sendFile(path.join(__dirname + '/client/view/join.html'));

  }
});


//tell the router how to handle a post request to the join page
app.post('/join', function(req, res, next) {

  passport.authenticate('signup', function(err, user, info) {
    if (err) {
      res.json({ isValid: false, message: 'internal error' });
    }
    else if (!user) {
      res.json({ isValid: false, message: 'try again' });
    }
    else {
      //log this user in since they've just joined
      req.logIn(user, function(err) {
        if (!err) {
          console.log("jaison_insidepassportwelcome");
          user.fname = req.body.fname;
          user.lname = req.body.lname;
          console.log(user.fname);
          console.log(user.lname);
          user.save();
          //send a message to the client to say so
          res.json({ isValid: true, message: 'welcome ' + user.email });
        }
      });
    }
  })(req, res, next);
});


//Route to take user to the signin page
app.get('/', function(req, res) {

  if (req.user) {
    res.redirect('/index');

  }
  else {

    //res.redirect('/');

    console.log('client requests signin');
    res.sendFile(path.join(__dirname + '/client/view/signin.html'));
  }

  //res.redirect('/');
});

//tell the router how to handle a post request from the signin page
app.post('/signin', function(req, res, next) {
  //tell passport to attempt to authenticate the login
  passport.authenticate('login', function(err, user, info) {
    //callback returns here
    if (err) {
      //if error, say error
      res.json({ isValid: false, message: 'internal error' });
    }
    else if (!user) {
      //if no user, say invalid login
      res.json({ isValid: false, message: 'try again' });
    }
    else {
      //log this user in
      req.logIn(user, function(err) {
        if (!err) { // console.log("inside_login_server.js");
          //send a message to the client to say so
          res.json({ isValid: true, message: 'welcome ' + user.email });
        }
      });
    }
  })(req, res, next);
});

//tell the router how to handle a post request to /posts
/*app.post('/posts', function(req, res){
  console.log('client requests posts list');
  
  //get all posts
  Posts.find({})
  .then(function(paths){
    //posts send to the index.html for disolaying the posts
    res.json(paths);
  });
});*/

app.post('/posts', userAuth.isAuthenticated, function(req, res) {
  console.log('client requests posts list');

  var thesePosts;
  //go find all the posts in the database
  Posts.find().sort([
      ['_id', 'descending']
    ])
    .then(function(posts) {
      thesePosts = posts;
      var promises = [];
      thesePosts.forEach(function(post) {
        promises.push(
          Promise.resolve()
          .then(function() {
            return Like.findOne({ userId: req.user.id, postId: post.id })
          })
          .then(function(like) {
            post._doc.isLiked = like ? true : false;
          }));


        promises.push(
          Promise.resolve()
          .then(function() {


            console.log(post._doc);

            return User.findOne({ '_id': post._doc.userId })
          })
          .then(function(user) {

            post._doc.userFname = user.fname;
            post._doc.userLname = user.lname;
            console.log(user);
            console.log(post._doc.userFname);


          }));



      });



      return Promise.all(promises);
    })
    .then(function() {
      //send them to the client in JSON format
      res.json(thesePosts);
    })
});

// get user data to display on the welcome salutation

app.post('/getUserData', userAuth.isAuthenticated, function(req, res) {
  res.json({ user: req.user });


});

//
app.post('/checkNewPost', userAuth.isAuthenticated, function(req, res) {
    var thesePosts;


  Posts.find({"_id": {"$gt": req.body.lastPostId}}).sort([
      ['_id', 'descending']
    ])
    .then(function(posts) {
      thesePosts = posts;
      var promises = [];
      thesePosts.forEach(function(post) {
        promises.push(
          Promise.resolve()
          .then(function() {
            return Like.findOne({ userId: req.user.id, postId: post.id })
          })
          .then(function(like) {
            post._doc.isLiked = like ? true : false;
          }));


        promises.push(
          Promise.resolve()
          .then(function() {


            console.log(post._doc);

            return User.findOne({ '_id': post._doc.userId })
          })
          .then(function(user) {

            post._doc.userFname = user.fname;
            post._doc.userLname = user.lname;
            console.log(user);
            console.log(post._doc.userFname);


          }));



      });



      return Promise.all(promises);
    })
    .then(function() {
      //send them to the client in JSON format
      res.json(thesePosts);
    })


});

//tell the router how to handle a post request to /incrLike
app.post('/incrLike', userAuth.isAuthenticated, function(req, res) {
  console.log('increment like for ' + req.body.id + ' by user ' + req.user.email);

  Like.findOne({ userId: req.user.id, postId: req.body.id })
    .then(function(like) {
      console.log(like + "sdfsdfsdsdf");
      if (!like) {
        console.log("not like");
        //go get the post record
        Posts.findById(req.body.id)
          .then(function(post) {
            //increment the like count
            post.postLikeCount++;
            //save the record back to the database
            return post.save(post);
          })
          .then(function(post) {
            var like = new Like();
            like.userId = req.user.id;
            like.postId = req.body.id;
            like.save();

            //a successful save returns back the updated object
            res.json({ id: req.body.id, count: post.postLikeCount });
          })
      }
      else {
        console.log("jaison like");

        res.json({ id: req.body.id, count: -1 });
      }
    })
    .catch(function(err) {
      console.log(err);
    })
});

app.get('/passwordreset', (req, res) => {
  // console.log('client requests passwordreset');
  res.sendFile(path.join(__dirname, 'client/view', 'passwordreset.html'));
});

app.post('/passwordreset', (req, res) => {
  Promise.resolve()
    .then(function() {
      //see if there's a user with this email
      return User.findOne({ 'email': req.body.email });
    })
    .then(function(user) {
      if (user) {
        var pr = new PasswordReset();
        pr.userId = user.id;
        pr.password = hash.createHash(req.body.password);
        pr.expires = new Date((new Date()).getTime() + (20 * 60 * 1000));
        pr.save()
          .then(function(pr) {
            if (pr) {
              //below line sends the email and we have passed the to address, subject and body as parameters
              email.send(req.body.email, 'password reset', 'https://node-app-jaisonjoseph26.c9users.io/verifypassword?id=' + pr.id);
              res.json("mail_sent");

            }
          });
      }
    });
});

app.get('/verifypassword', function(req, res) {
  var password;
  Promise.resolve()
    .then(function() {
      //Find a user using the id you got in the url query string
      return PasswordReset.findOne({ _id: req.query.id });
    })
    .then(function(pr) {
      if (pr) {
        //check for expiry date
        if (pr.expires > new Date()) {
          password = pr.password;
          //see if there's a user with this email
          return User.findOne({ '_id': pr.userId });
        }
      }
    })
    .then(function(user) {
      if (user) {
        user.password = password;
        user.save();
        // once user credentials is updated in the users collection, redirect user to the signin page with a success message
        var msg = "reset_success";
        res.redirect('/?msg=' + msg);


      }
    });
});

//tell the router how to handle a post request to upload a file
app.post('/upload', userAuth.isAuthenticated, function(req, res) {
  var response = { success: false, message: '' };
  console.log("in here");
  console.log(req.files);

  if (req.files) {
    console.log(req.files + "jasdasadasdadasdasdasd");
    // The name of the input field is used to retrieve the uploaded file 
    var userPhoto = req.files.userPhoto;
    //invent a unique file name so no conflicts with any other files
    var guid = Guid.create();
    //figure out what extension to apply to the file
    var extension = '';
    switch (userPhoto.mimetype) {
      case 'image/jpeg':
        extension = '.jpg';
        break;
      case 'image/png':
        extension = '.png';
        break;
      case 'image/bmp':
        extension = '.bmp';
        break;
      case 'image/gif':
        extension = '.gif';
        break;
    }

    //if we have an extension, it is a file type we will accept
    if (extension) {
      console.log("in here3");

      //construct the file name
      var filename = guid + extension;
      // Use the mv() method to place the file somewhere on your server 
      userPhoto.mv('./client/public/img/' + filename, function(err) {
        //if no error
        if (!err) {
          console.log("in here5");

          //create a post for this image
          var post = new Posts();
          post.userId = req.user.id;
          post.postImage = './img/' + filename;
          post.postLikeCount = 0;
          post.postComment = '';
          post.postFeedbackCount = 0;
          //save it
          post.save()
            .then(function() {
              res.json({ success: true, message: 'all good' });
            })
        }
        else {
          response.message = 'internal error';
          res.json(response);
        }
      });
    }
    else {
      console.log("in here6");

      response.message = 'unsupported file type';
      res.json(response);
    }
  }
  else {
    console.log("in here7");

    response.message = 'no files';
    res.json(response);
  }
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});



var server = app.listen(process.env.PORT || 3000, function() {
  console.log("Server is listening...");
});
