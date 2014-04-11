function DataSet(){
	this.init();
}

DataSet.prototype = {
	url_list : [],
	index : 0,

	init : function(){
		this.index = 0;
		this.url_list = [];
	},

	increase : function(){
		(this.index)++;
	},

	constructList : function(list){
		for(var i=0; i<list.length; i++)
			(this.url_list)[i] = list[i];
	}
}


var list = ["abc","edf","mmm"];
function Outer(){
	this.init();
}

Outer.prototype = {
	data : null,
	inner : null,
	init : function(){

	}
}

function Inner(){
	this.init();
}
Inner.prototype = {
	data : null,
	init : function(){

	}
}
var data = new DataSet();
data.constructList(list);
data.url_list[3]="jmjmj";
data.increase();
var out = new Outer();
out.data = data;
out.inner = new Inner();
out.inner.data = data;
out.inner.data.increase();








