const fs = require("fs");

function getFormattedDate(){
	return new Date().toLocaleString('en-US',{hour12:false,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).replace(',','');
}

class Logger{
	constructor(filename){
		this.filename = filename;
		this.logStream = fs.createWriteStream("./resources/logs/log.txt", {flags:'a'});
	}
	close(){
		this.logStream.end();
	}
	info(message){
		this.logStream.write(getFormattedDate()+" INFO "+this.filename+" "+message+'\n');
	}
	success(message){
		this.logStream.write(getFormattedDate()+" SUCCESS "+this.filename+" "+message+'\n');
	}
	danger(message){
		this.logStream.write(getFormattedDate()+" DANGER "+this.filename+" "+message+'\n');
	}
	warning(message){
		this.logStream.write(getFormattedDate()+" WARNING "+this.filename+" "+message+'\n');
	}
	error(message){
		this.logStream.write(getFormattedDate()+" ERROR "+this.filename+" "+message+'\n');
	}
}

exports.Logger = Logger;
