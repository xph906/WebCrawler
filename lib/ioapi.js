const {Cc,Ci,Cu,components} = require("chrome");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");


exports.readFile = function (name){
	var file = Cc["@mozilla.org/file/directory_service;1"].
           getService(Ci.nsIProperties).
           get("ProfD", Ci.nsIFile);
	file.append(name);
	NetUtil.asyncFetch(file, function(inputStream, status) {
  		if (!components.isSuccessCode(status)) {
    		console.log("failed open file "+name);
    		return;
  		}
  		var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
  		console.log("Read Data From "+ name +"["+data+" ]");
  		return data;
	});
}

exports.writeFile = function(name,data,overwrite){
	var file = Cc["@mozilla.org/file/directory_service;1"].
           getService(Ci.nsIProperties).
           get("ProfD", Ci.nsIFile);
	file.append(name);
	if (overwrite) {
        var openFlags = FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
    } else {
        var openFlags = FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_APPEND;
    }

	console.log("Write Data [ "+data +" ]");

	var ostream = FileUtils.openFileOutputStream(file,openFlags);
	var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                createInstance(Ci.nsIScriptableUnicodeConverter);
	converter.charset = "UTF-8";
	var istream = converter.convertToInputStream(data);

	// The last argument (the callback) is optional.
	NetUtil.asyncCopy(istream, ostream, function(status) {
	  	if (!components.isSuccessCode(status)) {
	    	console.log("failed open file "+name);
	    	return;
	  	}
	});
}
