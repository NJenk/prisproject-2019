'use strict';

const express = require('express'),
	app = express(),
	request = require('request'),
	path = require('path')
	//bootstrap = require('bootstrap'),
	//jquery = require('jquery');
    
app.use(express.static(path.join(__dirname + '/resources/css')));
app.set(express.static(path.join(__dirname + 'views')));
app.set('view engine', 'html');
//app.set('views', 'views');

// app.get('/', function(req, res) {
// 	request(
// 		{
// 			url: 'http://www.colourlovers.com/api/colors/random?format=json',
// 			json: true
// 		},
// 		function(err, response, body) {
// 			res.sendFile('layout.html', {root: __dirname + '/views/'}); //{title: body[0].title, hex: body[0].hex, dateCreated: body[0].dateCreated}
// 		},

// 	);
// });

app.get('/', function(req, res) {
	res.sendFile('layout.html', {root: __dirname + '/views/'});
})

const server = app.listen(3000, function() {
	console.log(`Server started on port ${server.address().port}`);
});