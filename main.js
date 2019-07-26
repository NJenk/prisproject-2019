/**
* @namespace Server
* @desc All code related to server routing. This namespace includes primarily inline anonymous functions which exist as Express.js middleware. The authors attributed here wrote either middleware or the linking code that runs the server and route through said middleware.
* @author Rei Radford
* @author Nicole Jenkins
* @author Nicholas Julien
* @author Paul Brackett
*/

//Authors: Rei Radford and Nicole Jenkins
'use strict';

const express = require('express'),
	app = express(),
	path = require('path'),
	upload = require('./resources/js/upload.js'),
	formidable = require('formidable'),
	fs = require('fs'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	schedule = require('node-schedule');

app.use('/public', express.static(path.join(__dirname + '/resources/css')));
app.use('/public', express.static(path.join(__dirname + '/resources/js')));
app.use('/public', express.static(path.join(__dirname + '/resources/images')));
app.use('/public', express.static(path.join(__dirname + '/resources/images/query_data')));
app.use('/public', express.static(path.join(__dirname + '/resources/images/profile_pics')));


app.use(cookieParser());
app.set(express.static(path.join(__dirname + './views')));
app.use(express.static(path.join(__dirname + '/resources/css')));

app.set('view engine', 'ejs');
var process_spawner = require('child_process');

//Global variable for progress bar
app.locals.progress = [];


//Template routes
app.get('/', (req, res) => {
	res.render('layout', {root: __dirname + '/views/'});
})
app.get('/Upload', (req, res) => {
	res.render('Upload', {root: __dirname + '/views/'});
})
app.get('/Query', (req, res) => {
	res.render('Query', {root: __dirname + '/views/', results: undefined});
})
app.get('/Logs',
	/**
	* Express middleware to parse log files into data usable by the front-end. NOTE: This is an anonymous function.
	* @function parseLogs
	* @memberof Server
	* @param {object} req - Express HTTP request object
	* @param {object} res - Express HTTP response object
	* @author Paul Brackett
	*/
	(req, res) => {
	var logData = [];
    var lineData = {};
    var lineReader = require('readline').createInterface({
		//Path to log file
        input: require('fs').createReadStream('resources\\logs\\log.txt')
        });


        lineReader.on('line', function (line) {
            var logline = line.split(' ');
            var message = "";
            //Get the message into one single block
            for(var i = 3; i < logline.length; i++) {
                message = message + logline[i] + " ";
            }
            lineData = {"date": logline[0],
            "time": logline[1],
            "code": logline[2],
            "message": message};
            logData.push(lineData);
          });

        lineReader.on('close', function() {
            res.render('Logs', {root: __dirname + '/views/', data: logData});
		});
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
app.get('/License', (req, res) => {
	res.render('License', {root: __dirname + '/views/'});
})

//Forms
app.post('/submit-form', upload.uploadAndConvert(upload.PRIS(false)), (req, res) => {
	res.render('Upload', {root: __dirname + '/views/'});
});

//Results page
app.post('/submit-query', upload.uploadAndConvert(upload.PRIS(true)), (req, res, next) => {
});

 //Start: Paul Brackett
app.post('/submit_similar',
	/**
	* Express middleware to send user selected profile linking information to the database. NOTE: This is an anonymous function.
	* @function submitSimilar
	* @memberof Server
	* @param {object} req - Express HTTP request object
	* @param {object} res - Express HTTP response object
	* @author Paul Brackett
	*/
	(req, res) => {
	var form = new formidable.IncomingForm();
	var similar_profs = []

 	form.parse(req, function(err, fields, files){

		//We need a way to add the 'original' (original in the sense that it either returned an exact match or it created a new profile)
		//If these fields got passed back (form only sends boxes if they're checked.), add them to the array.
		if(fields.similar_0){
			similar_profs.push(fields.similar_0);
		}

		if(fields.similar_1){
			similar_profs.push(fields.similar_1);
		}

		if(fields.similar_2){
			similar_profs.push(fields.similar_2);
		}

		var data = process_spawner.spawn('python', [process.cwd()+'\\resources\\data.py', similar_profs]);

		data.stderr.pipe(process.stderr);

		data.on('exit', function(e){
			res.render('Query', {root: __dirname + '/views/'});
		});

	});
});

app.get('/getprogress', (req, res) => {
	res.json({prog: req.app.locals.progress});
});

app.use(bodyParser.json())
app.post('/removeupload', (req, res) => {
	//Gets index of the 'x' item.
	var index = req.app.locals.progress[req.body.user_id].findIndex(item => item.temp_name === req.body.temp_name);
	req.app.locals.progress[req.body.user_id].splice(index, 1);
	res.send();
});
//End: Paul Brackett

//Scheduled server tasks go here
/**
* @namespace Scheduled
* @desc Tasks that get run on a schedule based on date and/or time of day
*/

/**
* Rename the global log file daily at midnight
* @memberof Scheduled
* @author Nick Julien
*/
var dailyLogRename = schedule.scheduleJob('0 0 0 * * *', ()=>{
	var today = new Date();
	fs.rename('./resources/logs/log.txt',	'./resources/logs/'+(today.getDate()-1)+"-"+(today.getMonth()+1)+"-"+today.getFullYear()+".txt", (err)=>{
		if(err){
			throw err;
		}
	});
});

const server = app.listen(3000, function() {
	console.log(`Server started on port ${server.address().port}`);
});
