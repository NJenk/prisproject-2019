const pathToPRIS = process.cwd()+'\\resources\\PRIS\\';
const JSONMarker = "Results JSON:";
const ProgressJSON = "Progress JSON:";

var formidable = require('formidable');
var fs = require('fs');
var logs = require('./logManager.js');
var util = require('util');

var process_spawner = require('child_process');

exports.PRISQuery = function(req, res, logger, fName){
	var PRIS = process_spawner.spawn('python', [pathToPRIS+'\\core.py',process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi",fName, req.cookies['id']],{cwd:pathToPRIS});
	PRIS.stderr.on('data', (data)=>{
		//logger.error(data.toString());
		logger.danger("Processing FAILED");
	});
	PRIS.stderr.pipe(process.stderr);
	PRIS.stdout.on('data', (data) => {
		//console.log("Data: "+data);
		sdata = data.toString();
		if(sdata.startsWith(JSONMarker)){
			logger.success("Results received");
			var jsonData = JSON.parse(sdata.substring(JSONMarker.length,data.toString().length));
			res.set({'Content-Type':'application/json'});
			res.json(jsonData);
			res.end();
		}
		if(sdata.startsWith(ProgressJSON))
		{
				//Remove this if we don't need it before the end of the project.
				//Don't think we need a progress bar for query yet, since its only images. 
				//req.app.locals.progress.push(JSON.parse(sdata.substring(ProgressJSON.length,data.toString().length)));
		}
	});
	PRIS.on('exit', function(e){
		fs.unlink("./resources/upload_tmp/"+fName+".avi", (err) =>{
			if(err){
				//logger.error(err);
				logger.danger("NOT DELETED");
				throw err;
			}
			console.log('Video deleted!');
		})
	});
}

exports.PRISUpload = function(req, res, logger, fName){
	req.app.locals.progress = {};

	var PRIS = process_spawner.spawn('python', [pathToPRIS+'\\core.py',process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi", "", req.cookies['id']],{cwd:pathToPRIS});
	PRIS.stderr.on('data', (data)=>{
		//logger.error(data.toString());
		logger.danger("Processing FAILED");
	});
	PRIS.stderr.pipe(process.stderr);
	PRIS.stdout.on('data', (data) => {
		//console.log("Data: "+data);
		sdata = data.toString();
		if(sdata.startsWith(ProgressJSON))
		{
			//updates the global progress var. 
			var prog_obj = JSON.parse(sdata.substring(ProgressJSON.length,data.toString().length))
			var user_id = Object.keys(prog_obj)[0];

			//determines if we need to add to the progress structure or not.
			if(!(user_id in req.app.locals.progress))
			{
				//The key doesn't exist, so we have to add it and then add the value.
				req.app.locals.progress[user_id] = [prog_obj[user_id]];
			}
			else
			{
				
				//Check to see if this temp already exists. If it does, update current only. Otherwise add it.
				if(req.app.locals.progress[user_id].some(el => el.temp_name === prog_obj[user_id].temp_name))
				{
					//Gets the index of this particular temp ID so we can update it.
					const index = req.app.locals.progress[user_id].findIndex(item => item.temp_name === prog_obj[user_id].temp_name);
					
					//update the progress.
					req.app.locals.progress[user_id][index] = prog_obj[user_id];
				}
				else
				{
					//The temp_name isn't in this users progress, so we need to add this.
					req.app.locals.progress[user_id].push(prog_obj[user_id])
				}
			}
		}
	});
	PRIS.on('exit', function(e){
		fs.unlink("./resources/upload_tmp/"+fName+".avi", (err) =>{
			if(err){
				//logger.error(err);
				logger.danger("NOT DELETED");
				throw err;
			}
			console.log('Video deleted!');
		})
	});
}

//TODO(Nick): Finish using process function
exports.uploadAndConvert = function(process){
	return function(req, res, next){
		var form = new formidable.IncomingForm();
		form.multiples=true;
		form.on('file',function(name, file){

			var logger = new logs.Logger(file.name);
			logger.info("Upload started");

			var fName = "", len = Math.random()*6+8;
			for(var i = 0; i < len; i++){
				fName+=Math.round(Math.random()*9);
			}

			//need the original name to go through as well for progress tracking.
			fName = fName+'.'+file.name;

			var type = file.type.substring(0,5);
			if(type=='video'){
				var ffmpeg = process_spawner.spawn('resources/ffmpeg', ['-i',file.path,'-filter:v','fps=fps=5', './resources/upload_tmp/'+fName+'.avi']);
				ffmpeg.on('close',function(e){
					fs.unlink(file.path, (err) => {
						if (err){
							//logger.error(err);
							logger.danger("NOT DELETED");
							throw err;
						}

						logger.success("Conversion successful");

						console.log(file.path+" deleted successfully");
					});
					process(req, res, logger, fName);
				});
			}
			else if(type=='image'){
				var ffmpeg = process_spawner.spawn('resources/ffmpeg', ['-loop','1','-i',file.path,'-r','1','-t','1','-vcodec','libx264','./resources/upload_tmp/'+fName+'.avi']);
				ffmpeg.on('close',function(e){
					fs.unlink(file.path, (err) => {
						if (err){
							//logger.error(err);
							logger.danger("NOT DELETED");
							throw err;
						}

						logger.success("Conversion successful");

						console.log(file.path+" deleted successfully");
					});
					process(req, res, logger, fName);
				});
			}
			else{
				//pull this out to a function maybe?
				fs.unlink(file.path, (err) => {
					if (err){
						//logger.error(err);
						logger.danger("NOT DELETED");
						throw err;
					}

					logger.danger("Unsupported filetype");

					console.log(file.path+" deleted successfully");
				});
			}
		});
		form.on('end', function(){
			next();
		})
		form.parse(req, function(err, fields, files){

		});
	}
}
