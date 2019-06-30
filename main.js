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

app.post('/submit-form', (req, res) => {
	res.render('Upload', {root: __dirname + '/views/'});
	var form = new formidable.IncomingForm();

	form.multiples=true;
	form.parse(req);

	form.on('file',function(name, file)
	{
		var fName = "", len = Math.random()*6+8;

		for(var i = 0; i < len; i++){
			fName+=Math.round(Math.random()*9);
		}

		var type = file.type.substring(0,5);
		if(type=='video'){
			var ffmpeg = process_spawner.spawn('resources/ffmpeg', ['-i',file.path,'-filter:v','fps=fps=5', './resources/upload_tmp/'+fName+'.avi']);
			ffmpeg.on('close',function(e){
				
				fs.unlink(file.path, (err) => {
					if (err) throw err;
					console.log(file.path+" deleted successfully");
				});

				var PRIS = process_spawner.spawn('python', ['resources\\PRIS\\core.py', process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi"]);
				//Captures output for as long as the python file is running, and updates the global var.
				PRIS.stdout.on('data', (data) => {
					//if it's a frameDone message.
					console.log(data.toString());

					if(data.toString().indexOf("PD:") != -1)
					{
						//updates the global progress var.
						req.app.locals.progress = data.toString().substring(data.toString().indexOf("PD:")+3, data.toString().indexOf("%"));
					}
				});
		});
	}
	else if(type=='image'){
		var ffmpeg = process_spawner.spawn('resources/ffmpeg', ['-loop','1','-i',file.path,'-r','1','-t','1','-vcodec','libx264','./resources/upload_tmp/'+fName+'.avi']);
		ffmpeg.on('close',function(e){
			fs.unlink(file.path, (err) => {
				if (err) throw err;
				console.log(file.path+" deleted successfully");
			});
			var PRIS = process_spawner.spawn('python', ['resources\\PRIS\\core.py', process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi"]);

				//Captures output for as long as the python file is running, and updates the global var.
				PRIS.stdout.on('data', (data) => {
					//if it's a frameDone message.
					console.log(data.toString());

					if(data.toString().indexOf("PD:") != -1)
					{
						//updates the global progress var.
						req.app.locals.progress = data.toString().substring(data.toString().indexOf("PD:")+3, data.toString().indexOf("%"));
					}
				});
		});
	}
	else{
		//pull this out to a function maybe?
		fs.unlink(file.path, (err) => {
			if (err) throw err;
			console.log(file.path+" deleted successfully");
		});
	} 
});
});

//pulls back the global var with ajax.
app.get('/getprogress', (req, res) => {
	res.json({prog: req.app.locals.progress})
});

const server = app.listen(3000, function() {
	console.log(`Server started on port ${server.address().port}`);
});