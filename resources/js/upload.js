const pathToPRIS = process.cwd()+'\\resources\\PRIS\\';
const JSONMarker = "Results JSON:";

var formidable = require('formidable');
var fs = require('fs');
var logs = require('./logManager.js');

var process_spawner = require('child_process');

exports.doPRIS = function(res, req, logger, fName){
	var PRIS = process_spawner.spawn('python', [pathToPRIS+'\\core.py',process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi",fName],{cwd:pathToPRIS});
	PRIS.stderr.on('data', (data)=>{
		//logger.error(data.toString());
		logger.danger("Processing FAILED");
	});
	PRIS.stderr.pipe(process.stderr);
	PRIS.stdout.on('data', (data) => {
		console.log("Data: "+data);
		sdata = data.toString();
		if(sdata.startsWith(JSONMarker)){
			var jsonData = sdata.substring(JSONMarker.length,data.toString().length);
			console.log(jsonData);
		}
		if(sdata.indexOf("PD:") != -1)
		{
				//updates the global progress var.
				req.app.locals.progress = sdata.substring(sdata.indexOf("PD:")+3, sdata.indexOf("%"));
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
					process(res, req, logger, fName);
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
					process(res, req, logger, fName);
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
