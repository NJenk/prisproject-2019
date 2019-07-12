const pathToPRIS = process.cwd()+'\\resources\\PRIS\\';
const JSONMarker = "Results JSON:";

var formidable = require('formidable');
var fs = require('fs');
var logs = require('./logManager.js');
var util = require('util');

var process_spawner = require('child_process');

exports.PRIS = function(query){
	return function(req, res, logger, fName){
		var args =  [pathToPRIS+'\\core.py',process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi"];
		if(query){
			args.push(fName);
		}
		var PRIS = process_spawner.spawn('python', args, {cwd:pathToPRIS});
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
			if(sdata.indexOf("PD:") != -1)
			{
					//updates the global progress var.
					req.app.locals.progress = sdata.substring(sdata.indexOf("PD:")+3, sdata.indexOf("%"));
			}
		});
		PRIS.on('exit', function(e){
			deleteFile("./resources/upload_tmp/"+fName+".avi", ()=>{
					console.log("Video deleted!");
				},
				()=>{
					logger.danger("NOT DELETED");
				}
			);
		});
	}
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

			var type = file.type.substring(0,5);
			if(type=='video'){
				var ffmpeg = process_spawner.spawn('resources/ffmpeg', ['-i',file.path,'-filter:v','fps=fps=5', './resources/upload_tmp/'+fName+'.avi']);
				ffmpeg.on('close',function(e){
					deleteFile(file.path, ()=>{
							logger.success("Conversion successful");
							console.log(file.path+" deleted successfully");
						},
						()=>{
							logger.danger("tmp NOT DELETED");
						}
					);
					process(req, res, logger, fName);
				});
			}
			else if(type=='image'){
				var ffmpeg = process_spawner.spawn('resources/ffmpeg', ['-loop','1','-i',file.path,'-r','1','-t','1','-vcodec','libx264','./resources/upload_tmp/'+fName+'.avi']);
				ffmpeg.on('close',function(e){
					deleteFile(file.path, ()=>{
							logger.success("Conversion successful");
							console.log(file.path+" deleted successfully");
						},
						()=>{
							logger.danger("tmp NOT DELETED");
						}
					);
					process(req, res, logger, fName);
				});
			}
			else{
				deleteFile(file.path, ()=>{
						logger.danger("Unsupported filetype");
						console.log(file.path+" deleted successfully");
					},
					()=>{
						logger.danger("tmp NOT DELETED");
					}
				);
			}
		});
		form.on('end', function(){
			next();
		})
		form.parse(req, function(err, fields, files){

		});
	}
}

function deleteFile(file, success, failure){
	fs.unlink(file, (err) => {
		if(err){
			failure();
			throw err;
		}
		success();
	})
}
