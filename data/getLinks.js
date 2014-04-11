
var __crawer_list__ = document.getElementsByTagName('a');
var host = window.location.host;
//alert(getDomain(host));
var i = 0, count=0;
while(i < __crawer_list__.length){
	/*var tmp_host = __crawer_list__[i++].href.split('/');
	alert(getDomain(tmp_host));
	if(tmp_host[2] == host){
		self.port.emit("urlNotice", __crawer_list__[i].href);
		count++;
	}
	else{
		alert(tmp_host[2]);
	}
	if(count>=10)
		break;
	*/
	self.port.emit("urlNotice", __crawer_list__[i++].href);
}
//return __crawer_list__;