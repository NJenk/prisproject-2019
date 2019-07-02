'use strict';

const express = require('express'),
	app = express(),
	request = require('request'),
	path = require('path'),
	upload = require('./resources/js/upload.js'),
	formidable = require('formidable'),
	fs = require('fs');
	
    
app.use('/public', express.static(path.join(__dirname + '/resources/css')));
app.use('/public', express.static(path.join(__dirname + '/resources/js')));
app.set(express.static(path.join(__dirname + './views')));

app.set('view engine', 'ejs');
var process_spawner = require('child_process');

//this works as a global var for progress bar.
app.locals.progress = "0";

app.use(express.static(path.join(__dirname + '/resources/css')));
app.set(express.static(path.join(__dirname + 'views')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.render('layout', {root: __dirname + '/views/'});
})
app.get('/Upload', (req, res) => {
	res.render('Upload', {root: __dirname + '/views/'});
})
app.get('/About', (req, res) => {
	res.render('About', {root: __dirname + '/views/'})
})
app.get('/FAQ', (req, res) => {
	res.render('FAQ', {root: __dirname + '/views/'});
})
app.get('/Contact', (req, res) => {
	res.render('Contact', {root: __dirname + '/views/'});
})
app.get('/Popup', (req, res) => {
	res.render('popup', {root: __dirname + '/views/'});
});

//Checking result view
app.post('/Results', (req, res) => {
	res.render('Results', {root: __dirname + '/views/'});
});

app.use(upload.uploadAndConvert);
app.post('/submit-form', (req, res) => {
	res.render('Upload', {root: __dirname + '/views/'});
});

//pulls back the global var with ajax.
app.get('/getprogress', (req, res) => {
	res.json({prog: req.app.locals.progress})
});



const server = app.listen(3000, function() {
	console.log(`Server started on port ${server.address().port}`);
});