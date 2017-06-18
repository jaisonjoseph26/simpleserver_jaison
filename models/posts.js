//since we'll be creating a mongoose model for our post, we need to include the mongoose module
var mongoose = require('mongoose');

//below model contains all the image posts
module.exports = mongoose.model('Posts', {
   userId: String, //references userId from user table
   postImage: String, //image file link
   postComment: String, //pcomment on the post
   postLikeCount: Number, //total post likea
   postFeedbackCount: Number //total post reply count
});
