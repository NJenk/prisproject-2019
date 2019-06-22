'use strict';

const express = require('express'),
	app = express(),
	request = require('request')
	//bootstrap = require('bootstrap'),
	//jquery = require('jquery');
    
app.use(express.static('resources'));

app.set('view engine', 'pug');
app.set('views', 'views');

app.get('/', function(req, res) {
	request(
		{
			url: 'http://www.colourlovers.com/api/colors/random?format=json',
			json: true
		},
		function(err, response, body) {
			res.render('layout',); //{title: body[0].title, hex: body[0].hex, dateCreated: body[0].dateCreated}
		},

	);
});

const server = app.listen(3000, function() {
	console.log(`Server started on port ${server.address().port}`);
});