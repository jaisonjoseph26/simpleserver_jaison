
/*PROG8165 - Web Design and Development Princ
Instructor: R Kozak

Group members: 

1) Jaison Joseph - Student no: 7714660
2) Sailesh Valiveti - Student No 7832116

*/
 
var http = require('http');


var express = require('express');
var app = express();
var fs = require('fs')
var path = require('path');


app.use(express.static(__dirname + '/client/public'));

app.get('/',function(req, res){
  res.sendFile(path.join(__dirname+'/client/view/index.html'));
});

var server = app.listen(process.env.PORT || 3000, function(){
    console.log("Server is listening...")
})
