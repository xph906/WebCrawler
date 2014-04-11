var files = require("ioapi");
const data = require("self").data;
var tld = {};

function init(){
	console.log("Init TLD!");

	var tlds = data.load("tld_min.dat");
	tlds = tlds.split('\n');
	console.log(tlds.length);
	for(var i=0; i<tlds.length; i++)
		tld[tlds[i]] = true;

}

exports.getDomain = function (url){
	if(Object.keys(tld).length==0){
		init();
	}
	components = url.split('/');
	if(components.length < 3)
		return "";
	var host = components[2];
	//console.log("Host: "+host);
	var parts = host.split('.');
	var suffix = "";
	var i;
	for(i=parts.length-1; i>=0; i--){
		tmp = parts[i];
		if(i != parts.length-1){
			tmp += '.';
			tmp += suffix;
		}
		if(tmp in tld){
			suffix = tmp;
		}	
		else
			break;
	}
	if(i<0 || i==(parts.length-1))
		return "";
	return parts[i]+"."+suffix;
}

