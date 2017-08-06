//mongoose module imported
var mongoose = require('mongoose');

//below model contains all the image posts
module.exports = mongoose.model('Notifications', {
   userIdLiker: String, //references userId who is the liker
   userIdLiked: String, //references userId who got like
   postId: String, //image file link
   isNotified: String,
   likerFname: String
});
