const pathToPRIS = process.cwd()+'\\resources\\PRIS\\';

var http = require('http');
var formidable = require('formidable');
var fs = require('fs');

var process_spawner = require('child_process');

var doPRIS = function(fName, req){
	var PRIS = process_spawner.spawn('python', [pathToPRIS+'\\core.py',process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi"],{cwd:pathToPRIS});
	PRIS.stderr.pipe(process.stderr);
	PRIS.stdout.on('data', (data) => {
		if(data.toString().indexOf("PD:") != -1)
		{
				//updates the global progress var.
				req.app.locals.progress = data.toString().substring(data.toString().indexOf("PD:")+3, data.toString().indexOf("%"));
		}
	});
	PRIS.on('exit', function(e){
		fs.unlink("./resources/upload_tmp/"+fName+".avi", (err) =>{
			if(err) throw err;
			console.log('Video deleted!');
		})
	});
}

exports.uploadAndConvert = function(req, res, next){
	var form = new formidable.IncomingForm();
	form.multiples=true;
	form.on('file',function(name, file){
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
				doPRIS(fName, req);
			});
		}
		else if(type=='image'){
			var ffmpeg = process_spawner.spawn('resources/ffmpeg', ['-loop','1','-i',file.path,'-r','1','-t','1','-vcodec','libx264','./resources/upload_tmp/'+fName+'.avi']);
			ffmpeg.on('close',function(e){
				fs.unlink(file.path, (err) => {
					if (err) throw err;
					console.log(file.path+" deleted successfully");
				});
				doPRIS(fName, req);
			});
		}
		else{
			//pull this out to a function maybe?
			fs.unlink(file.path, (err) => {
				if (err) throw err;
				console.log(file.path+" deleted successfully");
			});
		}

		//res.write('File uploaded!\n');
	});
	form.on('end', function(){
		next();
	})
	form.parse(req, function(err, fields, files){

	});
}

// http.createServer(function (req, res){
// 	if (req.url == '/fileupload'){
// 		var form = new formidable.IncomingForm();
// 		form.multiples=true;
// 		form.on('file',function(name, file){
// 			var fName = "", len = Math.random()*6+8;
// 			for(var i = 0; i < len; i++){
// 				fName+=Math.round(Math.random()*9);
// 			}
// 			var type = file.type.substring(0,5);
// 			if(type=='video'){
// 				var ffmpeg = process_spawner.spawn('ffmpeg', ['-i',file.path,'-filter:v','fps=fps=5', './upload_tmp/'+fName+'.avi']);
// 				ffmpeg.on('close',function(e){
// 					fs.unlink(file.path, (err) => {
// 						if (err) throw err;
// 						console.log(file.path+" deleted successfully");
// 					});
// 					doPRIS(fName);
// 				});
// 			}
// 			else if(type=='image'){
// 				var ffmpeg = process_spawner.spawn('ffmpeg', ['-loop','1','-i',file.path,'-r','1','-t','1','-vcodec','libx264','./upload_tmp/'+fName+'.avi']);
// 				ffmpeg.on('close',function(e){
// 					fs.unlink(file.path, (err) => {
// 						if (err) throw err;
// 						console.log(file.path+" deleted successfully");
// 					});
// 					doPRIS(fName);
// 				});
// 			}
// 			else{
// 				//pull this out to a function maybe?
// 				fs.unlink(file.path, (err) => {
// 					if (err) throw err;
// 					console.log(file.path+" deleted successfully");
// 				});
// 			}
//
// 			res.write('File uploaded!\n');
// 		});
// 		form.on('end', function(){
// 			return res.end();
// 		})
// 		form.parse(req, function(err, fields, files){
//
// 		});
// 	}
// 	else{
// 		res.writeHead(200, {'Content-type': 'text/html'});
// 		res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
// 		res.write('<input type="file" name="input" multiple="multiple"><br>');
// 		res.write('<input type="submit">');
// 		res.write('</form>');
// 		return res.end();
// 	}
// }).listen(8000);
