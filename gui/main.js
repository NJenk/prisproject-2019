'use strict';

const express = require('express'),
	app = express(),
	request = require('request'),
	path = require('path')
	//bootstrap = require('bootstrap')
	//jquery = require('jquery');
    
app.use(express.static(path.join(__dirname + '/resources/css')));
app.set(express.static(path.join(__dirname + 'views')));
app.set('view engine', 'ejs');

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

app.get('/', (req, res) => {
	res.render('layout', {root: __dirname + '/views/'});
})
app.get('/Upload', (req, res) => {
	res.render('Upload', {root: __dirname + '/views/'});
})
app.get('/About', (req, res) => {
	res.render('About', {root: __dirname + '/views/'});
})
app.get('/FAQ', (req, res) => {
	res.render('FAQ', {root: __dirname + '/views/'});
})
app.get('/Contact', (req, res) => {
	res.render('Contact', {root: __dirname + '/views/'});
})
app.get('/Popup', (req, res) => {
	res.render('popup', {root: __dirname + '/views/'});
})

const server = app.listen(3000, function() {
	console.log(`Server started on port ${server.address().port}`);
});