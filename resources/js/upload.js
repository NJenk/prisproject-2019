/**
* @file upload.js
*	@desc This file contains the upload module, which defines all of our file handling logic
* @author Nick Julien
* @author Paul Brackett
*/

/**
* @module Upload
*	@desc Back-end code related to uploading video and image files for processing, as well as the code to process them
*	@author Nick Julien
*	@author Paul Brackett
*/


const pathToPRIS = process.cwd()+'\\resources\\PRIS\\';
const JSONMarker = "Results JSON:";
const ProgressJSON = "Progress JSON:";

var formidable = require('formidable');
var fs = require('fs');
var logs = require('./logManager.js');
var util = require('util');

var process_spawner = require('child_process');

/**
*	Build a function to run PRIS based on input parameters
* @param {boolean} query - Determines if PRIS should be run in query or populate mode
*	@return {module:Upload~PRIS} A callback function that will start a new instance of PRIS and monitor and log its progress
* @author Nick Julien
* @see module:Upload~PRIS
*/
exports.PRIS = function(query){
	/**
	*	Run a new instance of PRIS and log its progress. NOTE: This is an anonymous function which can be built by and exists only as a return object from [PRIS(query)]{@link module:Upload.PRIS}.
	* @function module:Upload~PRIS
	* @param {Object} req - Express HTTP request object of the calling function
	*	@param {Object} req.app.locals.progress - Serverwide database object of PRIS progress information
	*	@param {Object} res - Express HTTP response object of the calling function
	* @param {module:Logs~Logger} logger - Logging object for writing to the daily log file
	* @param {string} fName - The name (without file extension) of the .avi file in the upload_tmp folder to be processed
	* @author Nick Julien
	*	@author Paul Brackett
	* @see module:Upload.PRIS
	*/
	return function(req, res, logger, fName){
		req.app.locals.progress = {};
		var args =  [pathToPRIS+'\\core.py',process.cwd()+"\\resources\\upload_tmp\\"+fName+".avi"];
		if(query){
			args.push(fName);
		}
		else{
			args.push(logger.filename);
			args.push(req.cookies['id']);
		}
		var PRIS = process_spawner.spawn('python', args, {cwd:pathToPRIS});
		var errored = false;
		PRIS.stderr.on('data', (data)=>{
			errored = true;
			logger.warning("Error while processing");
		});
		PRIS.stderr.pipe(process.stderr);
		PRIS.stdout.on('data', (data) => {
			sdata = data.toString();
			if(sdata.startsWith(JSONMarker)){
				var jsonData = JSON.parse(sdata.substring(JSONMarker.length,data.toString().length));
				if(jsonData===null) logger.danger("Person identification not run or no person found");
				else {
					logger.success("Results received");
					errored = false;
				}
				res.set({'Content-Type':'application/json'});
				res.json(jsonData);
				res.end();
			}
			else if(sdata.startsWith(ProgressJSON))
			{
				errored = false;
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
			if(errored){
				logger.danger("Processing FAILED");
			}
			else{
				logger.success("Processing complete");
			}
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

/**
* Build an express middleware for handling uploaded files
*	@param {function(req, res, Logger, string)} process - A callback function to be called as soon as valid uploaded files are converted
* @author Nick Julien
* @see module:Upload~PRIS
* @see module:Upload~uploadAndConvert
*/
exports.uploadAndConvert = function(process){
	/**
	*	Express middleware that converts uploaded videos and images using FFMPEG and sends their location to the function they were built with. NOTE: This is an anonymous function which can be built by and exists only as a return object from [uploadAndConvert(process)]{@link module:Upload.uploadAndConvert}.
	* @function module:Upload~uploadAndConvert
	*	@param {Object} req - Express HTTP request object
	* @param {Object} res - Express HTTP response object
	* @param {function} next - Express callback function to move to the next middleware on the stack
	*	@author Nick Julien
	* @see module:Upload.uploadAndConvert
	*/
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
			var args = [];
			if(type=='video'){
				args = ['-i',file.path,'-filter:v','fps=fps=5', './resources/upload_tmp/'+fName+'.avi'];
			}
			else if(type=='image'){
				args = ['-loop','1','-i',file.path,'-r','1','-t','1','-vcodec','libx264','./resources/upload_tmp/'+fName+'.avi'];
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
				return next();
			}
			var ffmpeg = process_spawner.spawn('resources/ffmpeg', args);
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
		});
		form.on('end', function(){
			next();
		})
		form.parse(req, function(err, fields, files){

		});
	}
}

/**
* An easier to read wrapper around fs.unlink
* @param {string} file - Full path to the file to be deleted
* @param {function()} success - Callback function to be run on a successful file deletion
* @param {function()} failure - Callback function to be run if fs.unlink encounters an error. This function will be run before throwing the error.
* @throws Will throw any error that fs.unlink returns
*	@author Nick Julien
*/
function deleteFile(file, success, failure){
	fs.unlink(file, (err) => {
		if(err){
			failure();
			throw err;
		}
		success();
	})
}
