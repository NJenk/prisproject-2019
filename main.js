'use strict';

const express = require('express'),
	app = express(),
	request = require('request'),
	path = require('path'),
	upload = require('./resources/js/upload.js'),
	formidable = require('formidable'),
	fs = require('fs'),
	async = require("async");


app.use('/public', express.static(path.join(__dirname + '/resources/css')));
app.use('/public', express.static(path.join(__dirname + '/resources/js')));
app.use('/public', express.static(path.join(__dirname + '/resources/images')));
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
app.get('/Query', (req, res) => {
	res.render('Query', {root: __dirname + '/views/', results: undefined});
})
app.get('/Logs', (req, res) => {
	var logData = [];
    var lineData = {};
    var lineReader = require('readline').createInterface({
		// The path to the log file needs updated when we know it.
        input: require('fs').createReadStream('resources\\logs\\log.txt')
        });


        lineReader.on('line', function (line) {
            var logline = line.split(' ');
            var message = "";
            //Get the message into one single block.
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

app.get('Results'), (req, res) => {
	res.render('Results', {root: __dirname + '/views/'});
}

app.get('/Popup', (req, res) => {
	res.render('popup', {root: __dirname + '/views/'});
});

//Forms
app.post('/submit-form', upload.uploadAndConvert(upload.PRIS(false)), (req, res) => {
	res.render('Upload', {root: __dirname + '/views/'});
});

app.post('/submit-query', upload.uploadAndConvert(upload.PRIS(true)), (req, res, next) => {
	//DEAD CODE
	//When we get results, revisit this and uncomment/clean up.
	/* 	var profs = req.body.profile;

		//This will need to be set based on the results page form. need a way to pass in the uploaded profile.
		//var curr_prof = req.body.current;
		var curr_prof = 'SuT-eKa8qty';
		profs.push(curr_prof)
		let max = "";
		let results = "";

		//Calls the data.py script that populates the table.
		var data = process_spawner.spawn('python', [process.cwd()+'\\resources\\data.py', profs]);

		data.stderr.pipe(process.stderr);

		data.on('exit', function(e){
			console.log('poi table has been updated. Carry on.');
			res.render('Results', {root: __dirname + '/views/'});
		});	 */

		//const item = await upload.PRISQuery;
		//console.log(item);
	 //let result_images = [];
	//res.render('Results', {root: __dirname + '/views/', results: result_images});
});

//pulls back the global var with ajax.
app.get('/getprogress', (req, res) => {
	res.json({prog: req.app.locals.progress})
});



const server = app.listen(3000, function() {
	console.log(`Server started on port ${server.address().port}`);
});
