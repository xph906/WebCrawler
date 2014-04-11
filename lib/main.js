var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var timers = require("sdk/timers");
var files = require("ioapi");
var urlService = require("urlapi");
var windows = require("sdk/windows");
var contentPrefService = require("preferences-service");
const self_data = require("self").data;

const TAB_NUM = 5; 
const MEMORY_URL_MAX = 100;
const PREVENT_DEADLOCK_TIME = 60000; //60s
const LOAD_TIME = 10000;			 //10s
const COLLECTNUMBER = 6;

//====Preference====
contentPrefService.set("javascript.options.strict", false);
contentPrefService.set("dom.disable_open_during_load",false);
//==================

//====URL Set=======
function DataSet(){
	this.init();
};

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
	},

	getNextItem : function(){
		if(this.index >= this.url_list.length)
			return false;
		var item = (this.url_list)[this.index];
		(this.index)++;
		return item;
	}
};
//===================

//var final_url = {};
//var index = 0;
//var seed_urls = [];

//======Prevent Deadlock==========
function DeadLockPreventor(urlSet,parent){
	this.init(urlSet,parent);
};
DeadLockPreventor.prototype = {
	secondRound : false,
	tabListInLastRound : {},
	constTab : null,
	constURL : "http://dod.cs.northwestern.edu/xpan/x.html",
	//urlSet here is used for debugging
	urlSet : null,
	parentObject : null,

	init : function(urlSet, parent){
		if(tabs == null)
			tabs = require("sdk/tabs");
		if(windows == null)
			windows = windows = require("sdk/windows");
		
		this.urlSet = urlSet;
		this.parentObject = parent;
		
	},

	start : function(){
		this.constTab = tabs.open({url : "http://dod.cs.northwestern.edu/xpan/x.html"});
		timers.setInterval(this.checkIdleAndRun.bind(this), PREVENT_DEADLOCK_TIME);
	},

	checkIdleAndRun : function(){
		//For Debugging
		try{
			console.log("checkIdleAndRun: window.length:"+ windows.browserWindows.length);
			console.log("checkIdleAndRun: tabs.length:"+tabs.length);
			for each (var window in windows.browserWindows) {
				for each (var tab in window.tabs){
					console.log("FromWindowReferURL: "+tab.url);
				}
			}
		}catch(e){
			console.log("Error checkIdleAndRun: tabs.length: "+e);
		}

		if(this.secondRound){
			this.secondRound =false;
			console.log("Length of tabsInList "+Object.keys(this.tabListInLastRound).length+" [From checkIdleAndRun]");
			//console.log("BEFORE Exsisting tabs length"+tabs.length);
			for each (var window in windows.browserWindows) {
				for each (var tab in window.tabs){
					if(tab.url in this.tabListInLastRound){
						try{
							console.log('DEBUG secondRounnd tab length: '+ window.tabs.length);
							console.log("DEBUG secondRounnd tab URL: "+ tab.url);
							if(this.constURL != tab.url)
								tab.close();
						}catch(e){
							console.log("ERROR secondRounnd tab length "+e);
						}
					}
				}
			}
			//console.log("AFTER Exsisting tabs length"+tabs.length);
			this.tabListInLastRound = {};
			for each (var window in windows.browserWindows){
				if(window.tabs.length != 0){
					window.activate();
					tabs = window.tabs;
					break;
				}
			}
			for(var i=tabs.length-1; i<TAB_NUM; i++){
				console.log("Index "+this.urlSet.index+" is about to initiate [From checkIdleAndRun]");
				this.parentObject.handleNextLink(tabs,"checkIdleAndRun");
				/*var url = this.urlSet.getNextItem();
				if(url != false){
					tabs.open({
		  				url: url,
		  				onOpen: this.startTimeout,
		  				onReady: this.collectHandler,
		  				inBackground : true
					});
				}
				*/
			}
		}
		else{	 //first Round
			this.secondRound = true;
			for each (var window in windows.browserWindows) {
				for each (var tab in window.tabs){
					try{
						console.log('DEBUG firstRound tab length: '+ window.tabs.length);
						console.log("DEBUG firstRound tab URL: "+ tab.url);
			  			this.tabListInLastRound[tab.url] = true;
			  		}catch(e){
						console.log("Error checkIdleAndRun "+e);
					}
				}	
			}
		}	
	}//function checkIdleAndRun

};


function LinkCollector(){
	this.init();
};

//init function needs refined
LinkCollector.prototype = {
	dataSet : null,
	lockPreventor : null,
	finalURLList : {},

	init : function(){
		var contents = self_data.load("seed_url_list");
		var seed_urls = contents.split("\n");
		console.log("[collectLinks] length of seeds: "+seed_urls.length);
		this.dataSet = new DataSet();
		this.dataSet.constructList(seed_urls);
		this.lockPreventor = new DeadLockPreventor(this.dataSet,this);
		this.finalURLList = {};
		//this.startCollectLinks();
	},

	handleNextLink : function(t,tag){
		tabs = t;
		var url = this.dataSet.getNextItem();
		//console.log("HandleNextLink from ["+tag+"] "+this.dataSet.index+" "+url);

		var that = this;
		var collectMethod = function(tab){
			that.collectHandler(tab);
		}
		var startTimeoutMethod = function(tab){
			that.startTimeout(tab);
		}

		if(url != false){
			tabs.open({
  				url: url,
  				onOpen: startTimeoutMethod,
  				onReady: collectMethod,
  				inBackground : true
			});
		}
	},

	startCollectLinks : function(){
		//console.log("startCollectLinks "+this+" "+ (typeof this));
		this.lockPreventor.start();
		for(var i=0; i<TAB_NUM; i++){
			this.handleNextLink(tabs,"startCollectLinks");
		}
	},

/*	isUsefulUrl : function(url){
		try{
			if(url.split(":")[0] == "https")
				return true;
			return false;
		}catch(e){
			console.log("Error in isUsefulUrl: "+url+" "+e);
		}
		return false;
	},
*/
	isUsefulUrl : function(url,domain){
		try{
			var d = urlService.getDomain(url);
			if(d == domain)
				return true;
			return false;
		}catch(e){
			console.log("Error in isUsefulUrl: "+url+" "+e);
			return false;
		}
	},

 	startTimeout : function(tab){
 		var that = this;
 		var t = tab;
 		//console.log("startTimeout: "+that+" "+this);
 		var closeTabAndOpenNewTabMethod = function(){
 			t.close();
 			//console.log("closeTabAndOpenNewTabMethod: "+that+" "+this);
 			that.handleNextLink(tabs,"closeTabAndOpenNewTab");
 		};
		timers.setTimeout(closeTabAndOpenNewTabMethod,LOAD_TIME);
	},

/*	closeTabAndOpenNewTab : function(tab){
		return function() {
			tab.close();
			this.handleNextLink(tabs,"closeTabAndOpenNewTab");
		}
	},
*/
	collectHandler : function(tab){
		tab.attach({
			contentScriptFile : self.data.url("noOnBeforeUnload.js")
		});
		worker = tab.attach({
			contentScriptFile: self.data.url("getLinks.js") 
		});
		
		var that = this;
		var parent_domain = urlService.getDomain(tab.url);
		var parent_url = tab.url;
		var finishCollecting = false;
		//console.log("1THAT: "+thatt+" "+this);
		var collect = function(url_elem){
			try{
				if(finishCollecting)
					return;
				//For extracting HTTPS urls
				/*if(that.isUsefulUrl(url_elem,parent_domain)){
					that.finalURLList[url_elem] = true;
					if(Object.keys(that.finalURLList).length > MEMORY_URL_MAX){
						var data = "";
						for(url in that.finalURLList){
							data += url;
							data += "\n";
						}
						files.writeFile("finalURL",data,false);
						that.finalURLList = {};
					}
					console.log(Object.keys(that.finalURLList).length+" Domain Of "+ url_elem );
				}*/
				if(that.isUsefulUrl(url_elem,parent_domain)){
					if(parent_domain in that.finalURLList){
						(that.finalURLList[parent_domain])[url_elem] = true;
					}
					else{
						that.finalURLList[parent_domain] = {};
						(that.finalURLList[parent_domain])[url_elem] = true;
					}
					if(Object.keys(that.finalURLList[parent_domain]).length > COLLECTNUMBER){
						finishCollecting = true;
						var data = "";
						for(url in that.finalURLList[parent_domain]){
							data += url;
							data += "\n";
						}
						files.writeFile("finalURL",data,false);
						that.finalURLList[parent_domain] = {};
					}
					console.log(Object.keys(that.finalURLList[parent_domain]).length+" Domain Of "+ parent_domain );
				}
				
			}catch(e){
				console.log("collectHandler ERROR: "+e );
			}	
		}
		worker.port.on("urlNotice", collect);
	}	
};

/***********Crawler***************
*/
function PageCrawler(){
	this.init();
};

//init function needs refined
PageCrawler.prototype = {
	dataSet : null,
	lockPreventor : null,
	finalURLList : {},

	init : function(){
		var contents = self_data.load("url_list");
		var url_list = contents.split("\n");
		console.log("PageCrawler "+url_list.length);
		this.dataSet = new DataSet();
		this.dataSet.constructList(url_list);
		this.lockPreventor = new DeadLockPreventor(this.dataSet,this);
		this.finalURLList = {};
		//this.startCollectLinks();
	},

	handleNextLink : function(t,tag){
		tabs = t;
		var url = this.dataSet.getNextItem();
		//console.log("HandleNextLink from ["+tag+"] "+this.dataSet.index+" "+url);

		var that = this;
		var crawlMethod = function(tab){
			that.crawlHandler(tab);
		}
		var startTimeoutMethod = function(tab){
			that.startTimeout(tab);
		}

		if(url != false){
			tabs.open({
  				url: url,
  				onOpen: startTimeoutMethod,
  				onReady: crawlMethod,
  				inBackground : true
			});
		}
	},

	startCrawlPages : function(){
		//console.log("startCollectLinks "+this+" "+ (typeof this));
		this.lockPreventor.start();
		for(var i=0; i<TAB_NUM; i++){
			this.handleNextLink(tabs,"startCrawlPages");
		}
	},

	isUsefulUrl : function(url,domain){
		try{
			var d = urlService.getDomain(url);
			if(d == domain)
				return true;
			return false;
		}catch(e){
			console.log("Error in isUsefulUrl: "+url+" "+e);
			return false;
		}
	},

 	startTimeout : function(tab){
 		var that = this;
 		var t = tab;
 		//console.log("startTimeout: "+that+" "+this);
 		var closeTabAndOpenNewTabMethod = function(){
 			t.close();
 			//console.log("closeTabAndOpenNewTabMethod: "+that+" "+this);
 			that.handleNextLink(tabs,"closeTabAndOpenNewTab");
 		};
		timers.setTimeout(closeTabAndOpenNewTabMethod,LOAD_TIME);
	},

	crawlHandler : function(tab){
		tab.attach({
			contentScriptFile : self.data.url("noOnBeforeUnload.js")
		});
	}	
};





var collector = new LinkCollector();
var crawler = new PageCrawler();

var widget1 = widgets.Widget({
  id: "crawlpages",
  label: "Crawl Pages",
  contentURL: "http://www.mozilla.org/favicon.ico",
  onClick: crawlMethod
});
var widget2 = widgets.Widget({
  id: "collectlinks",
  label: "Collect Links",
  contentURL: "http://www.mozilla.org/favicon.ico",
  onClick: collectMethod
});


function collectMethod(){
	collector.startCollectLinks();
};
function crawlMethod(){
	crawler.startCrawlPages();
};
