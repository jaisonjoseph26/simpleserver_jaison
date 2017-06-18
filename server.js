
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


var mongoose = require('mongoose');

mongoose.connect('mongodb://admin_insta:admin123@ds019038.mlab.com:19038/insta_mongodb');
mongoose.Promise = require('bluebird');
var Posts = require('./models/posts.js'); // include the posts model

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
  postImage: './img/glyphicons-halflings-white.png',
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


//tell the router (ie. express) where to find static files
app.use(express.static(path.resolve(__dirname, 'client')));
//tell the router to parse JSON data for us and put it into req.body
var bodyParser = require('body-parser')


app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.get('/',function(req, res){
  res.sendFile(path.join(__dirname+'/client/view/index.html'));
});

//tell the router how to handle a post request to /posts
app.post('/posts', function(req, res){
  console.log('client requests posts list');
  
  //go find all the posts in the database
  Posts.find({})
  .then(function(paths){
    //send them to the client in JSON format
    res.json(paths);
  })
  
  //this code just creates some posts directly without going to the database
  res.json([
   {postImage: 'img/testing.jpg', postComment: 'test message 1'},
    {postImage: 'img/testing.jpg', postComment: 'test message 2'}
  ]);
});


var server = app.listen(process.env.PORT || 3000, function(){
    console.log("Server is listening...")
})
