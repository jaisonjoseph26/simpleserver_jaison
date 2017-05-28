//
// # SimplestServer
//
var http = require('http');
/*var path = require('path');
var express = require('express');

var app=express();


app.use(express.static(__dirname + '/client'));



//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express.Router();
var server = http.createServer(router);

// router.use(express.static(path.resolve(__dirname, 'client/view')));

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

app.get('/', function(req, res) {

res.sendFile('/view/index.html', {
	root: __dirname
});

});*/

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
