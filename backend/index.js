var pathToPRIS = 'B:\\School\\CSC\\450\\PRIS\\PRIS\\src\\lib';

var http = require('http');
var formidable = require('formidable');
var fs = require('fs');

var process_spawner = require('child_process');

function doPRIS(fName){
	var PRIS = process_spawner.spawn('python', [pathToPRIS+'\\core.py'],{cwd:pathToPRIS});
	PRIS.stdin.setEncoding('utf-8');
	PRIS.stderr.pipe(process.stderr);
	PRIS.stdout.on('data', (data) => {
		console.log("Recieved data: "+data);
		if(data=="Please enter file path: "){
			console.log("Hit");
			PRIS.stdin.write(process.cwd()+"\\upload_tmp\\"+fName+".avi\n");
		}
		else if(data.includes("Press enter to identify the person")){
			PRIS.stdin.write("\n");
		}
		else if(data.includes("Video processing successful")){
			console.log("We did it!");
		}
	})
}

http.createServer(function (req, res){
	if (req.url == '/fileupload'){
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files){
			var type = files.input.type.substring(0,5);
			if(type=='video'){
				var ffmpeg = process_spawner.spawn('ffmpeg', ['-i',files.input.path,'-filter:v','fps=fps=5', './upload_tmp/test.avi']);
				ffmpeg.on('close',function(e){
					fs.unlink(files.input.path, (err) => {
						if (err) throw err;
						console.log(files.input.path+" deleted successfully");
					});
					doPRIS("test");
				});
			}
			else if(type=='image'){
				var ffmpeg = process_spawner.spawn('ffmpeg', ['-loop','1','-i',files.input.path,'-r','1','-t','1','-vcodec','libx264','./upload_tmp/test.avi']);
				ffmpeg.on('close',function(e){
					fs.unlink(files.input.path, (err) => {
						if (err) throw err;
						console.log(files.input.path+" deleted successfully");
					});
					doPRIS("test");
				});
			}
			else{
				//pull this out to a function maybe?
				fs.unlink(files.input.path, (err) => {
					if (err) throw err;
					console.log(files.input.path+" deleted successfully");
				});
			}

			res.write('File uploaded');
			res.end();
		})
	}
	else{
		res.writeHead(200, {'Content-type': 'text/html'});
		res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
		res.write('<input type="file" name="input"><br>');
		res.write('<input type="submit">');
		res.write('</form>');
		return res.end();
	}
}).listen(8000);
