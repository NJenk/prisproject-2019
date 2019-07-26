/**
* @module Logs
* @desc Back-end code for handling logging.
* @author Nick Julien
*/

const fs = require("fs");

/**
* Helper function for getting the current date and time
* @return {string} The current date and time in the format log viewer expects.
*/
function getFormattedDate(){
	return new Date().toLocaleString('en-US',{hour12:false,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).replace(',','');
}

/**
* This class provides methods for writing to the daily log file in its expected format.
*	@property {string} filename - Original name of the file that this logger handles
* @param {string} filename - Defines the filename property
*	@author Nick Julien
*/
class Logger{
	constructor(filename){
		this.filename = filename;
		this.logStream = fs.createWriteStream("./resources/logs/log.txt", {flags:'a'});
	}
	/**
	* Closes the filestream. Call this function when no more writing is to be done on this logger.
	*/
	close(){
		this.logStream.end();
	}
	/**
	* Write an informational message to the log file
	* @param {string} message - Information to be written to the log
	*/
	info(message){
		this.logStream.write(getFormattedDate()+" INFO "+this.filename+" "+message+'\n');
	}
	/**
	* Write a success notification to the log file
	* @param {string} message - Description of the successful operation
	*/
	success(message){
		this.logStream.write(getFormattedDate()+" SUCCESS "+this.filename+" "+message+'\n');
	}
	/**
	* Log an occurence that caused execution to stop
	* @param {string} message - Summary of the execution that stopped
	*/
	danger(message){
		this.logStream.write(getFormattedDate()+" DANGER "+this.filename+" "+message+'\n');
	}
	/**
	* Log an unexpected occurence that has not yet caused processing to stop
	* @param {string} message - Summary of the process that has experienced something unexpected
	*/
	warning(message){
		this.logStream.write(getFormattedDate()+" WARNING "+this.filename+" "+message+'\n');
	}
	/**
	* Log any error provided by third party code
	* @deprecated Log viewer does not support intended use
	* @param {string} message - Full third party error data
	*/
	error(message){
		this.logStream.write(getFormattedDate()+" ERROR "+this.filename+" "+message+'\n');
	}
}

exports.Logger = Logger;
