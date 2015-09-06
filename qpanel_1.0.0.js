/*
#################################################
CLASS QPANEL
#################################################
*/

var QPanel = function()
{
	/*	========
		Privates
		======== */
		
	var me = this;
	var my = {
		trailstring 	: true,
		cache_template 	: [],
		reg_script		: [],
		reg_container 	: [],
		reg_panel 		: [],
		rootPanel		: new QPanel.Panel(this,'_rootPanel'),
		
		countLoad		: 0,
		hideOnLoad		: false,
		
		//hideOnLoadCounters	: [],
	}
	
	this.my = my;
	
	/*  ==========
		PROPERTIES
		========== */
	
	//.rootPanel
	this.__defineGetter__('rootPanel', function()
	{
		return my.rootPanel;
	});

	/*	==============
		Active Methods
		============== */

	this.newTemplatePath = function(path, ns)
	{
		return new QPanel.TemplatePath(me, path, ns); 
	}

	this.getPanel = function(panelID)
	{
		return my.reg_panel[panelID];
	}

	this.alwaysFresh = function(bTrailstring)
	{
		if(typeof bTrailstring != 'undefined'){
			my.trailstring = bTrailstring;
		}
		
		return my.trailstring;
	}

	this.unsetTemplate = function(templateName)
	{
		my.cache_template = QPanel.arrayRemoveByKey(templateName, my.cache_template);
	}

	this.registerContainer = function(container)
	{
		my.reg_container[container.id] = container;
	}
	
	this.unregContainer = function(container)
	{
		my.reg_container = QPanel.arrayRemoveByKey(container.id, my.reg_container);
		
		for(var i in container.panels){
			me.unregPanel(container.panels[i]);
		}
	}

	this.unregPanel	= function(panel)
	{
		my.reg_panel = QPanel.arrayRemoveByKey(panel.id, my.reg_panel);
		
		for(var i in panel.containers){
			my.unregContainer(panel.containers[i]);
		}
	}

	this.getController= function(panelID)
	{
		return me.getPanel(panelID).controller;
	}

	this.getContainer = function(containerID)
	{
		return my.reg_container[containerID];
	}
	
	this.loadScript = function(templatePath, templateName, onLoad)
	{
		var controllerName = templatePath.getControllerName(templateName);
		
		if(my.reg_script[controllerName] == null){
		
			// JQuery getScript() with cache setting
			$.ajax({
				url: templatePath.getScriptPath(templateName),
				dataType: "script",
				cache: !my.trailstring,
				success: function(){
					my.reg_script[controllerName] = true;
					
					if(onLoad != null) onLoad();
				}
			}).fail(function(){
				my.reg_script[controllerName] = false;
				
				if(arguments[0].status == 200){
					throw('QPanel - Controller error: '+controllerName+'\n'+arguments[2]);
				} else {
					//console.log('Controller file not found: '+controllerName);
				}
				
				if(onLoad != null) onLoad(true);
			});
		}
		else if(my.reg_script[controllerName] == false){
			if(onLoad != null) onLoad(true);
		}
		else{
			if(onLoad != null) onLoad();
		}
	}
	
	this.setupPanel = function(templatePath, container, templateName, onNext)
	{		
		console.log('Setup Panel: '+templateName);
	
		// create panel div
		var id = '_panel_' + templateName + '_' + QPanel.GetTimeString();
		var controllerName = templatePath.getControllerName(templateName);
		
		var el = document.createElement('div');
		el.setAttribute('id', id);
		el.setAttribute('class', 'qpanel');
		QPanel.GetElement(container.id).appendChild(el);
		
		var handler = $("#"+id);
		handler.hide();
		
		var panel = new QPanel.Panel(me, container, id, templateName);
		my.reg_panel[id] = panel;
		
		// check template cache
		if(my.cache_template[controllerName] == null){
			var url = me.alwaysFresh()
				? templatePath.getHTMLPath(templateName) + '?_=' + QPanel.GetTimeString()
				: templatePath.getHTMLPath(templateName);
			
			//console.log('Loading template: '+url+' (async)');
			
			handler.load(url, function(responseText){			
				my.cache_template[controllerName] = responseText;
				
				if(onNext != null) onNext(panel);
			});
		}
		else
		{
			handler.html(my.cache_template[controllerName]);
			
			if(onNext != null) onNext(panel);
		}
	}
	
	this.useTemplate = function(templatePath, templateName)
	{
		var controllerName = templatePath.getControllerName(templateName);
		
		if(my.cache_template[controllerName] == null){
			var url = me.alwaysFresh()
				? templatePath.getHTMLPath(templateName) + '?_=' + QPanel.GetTimeString()
				: templatePath.getHTMLPath(templateName);
			
			console.log('Loading template: '+url+' (sync)');
			
			$.ajax({async:false});
			$.get(url, function(responseText){
				my.cache_template[controllerName] = responseText;
				
				me.loadScript(templatePath, templateName, function(isFailed){
					if(!isFailed){
						templatePath.evalScript(templateName);
					}
				});
			});
			$.ajax({async:true});
		}
	}

	/*
		Obsolete Methods
		================
	*/
}

/*
################################################# 
CLASS TEMPLATEPATH
#################################################
*/

QPanel.TemplatePath = function(qpanel, path, ns)
{	
	/*	========
		Privates
		======== */
	
	var me = this;
	var my 	= {
		qpanel 	: qpanel,
		path 	: path,
		ns 		: ns,
		
		disabledControllers	: false,
		controllerOff		: [],
	}
	
	/*
		Active Methods
		==============
	*/
	
	this.getControllerName = function(name)
	{
		return (my.ns != null) ? my.ns+'.'+name : name;
	}
	
	this.getHTMLPath = function(name)
	{
		return my.path+name+'.htm';
	}
	
	this.getScriptPath = function(name)
	{
		return my.path+name+'.js';
	}
	
	this.createPanel = function(container, templateName, opt, onNext)
	{	
		if(typeof opt == 'function')
		{
			onNext = opt;
			opt = null;
		}
		
		var countLoadID = templateName+'_'+QPanel.GetTimeString();
		container.countLoadAdd(countLoadID);
		
		my.qpanel.setupPanel(me, container, templateName, function(panel){
			
			if(!me.isControllerOff(templateName) && !my.disabledControllers){
			
				// load controller
				my.qpanel.loadScript(me, templateName, function(isFailed){

					if(!isFailed){
						//{{{ begin create controller
						
						var controllerName = me.getControllerName(templateName);
						
						var sEval = "";
						
						if(my.ns != null){
							sEval = "QPanel.ns." + my.ns + " = {};\n";
						}
						
						sEval += "QPanel.ns."+controllerName+" = "+templateName+";\n"
								+ "var newController = new QPanel.ns."+controllerName+"()";
						
						eval(sEval);
						
						newController = QPanel.InjectController(my.qpanel, panel.id, newController)
						panel.controller = newController;
						newController.init(opt);
						
						// done create controller }}}
					}
					
					if(typeof onNext === 'function') onNext(panel);
					
					container.countLoadDone(countLoadID);
					
				});
			}
			else{
				
				if(typeof onNext === 'function') onNext(panel);
				
				container.countLoadDone(countLoadID);
			}
		});
	}
	
	this.setAllControllerOff = function()
	{
		my.disabledControllers = true;
	}
	
	this.setControllerOff = function(arrTemplateName)
	{
		var arrTemp = [];
		var setOff = false;
		
		for(var i=0; i<arrTemplateName.length; i++){
			for(var j=0; j<my.controllerOff.length; j++){
				if(arrTemplateName[i] == my.controllerOff[j]){
					setOff = true;
					break;
				}
			}
			
			if(!setOff){
				my.controllerOff.push(arrTemplateName[i]);
			}
			
			setOff = false;
		}
	}
	
	this.isControllerOff = function(templateName)
	{
		var res = false;
		
		for(var i=0; i<my.controllerOff.length; i++){
			if(templateName == my.controllerOff[i]){
				res = true;
				break;
			}
		}
		
		return res;
	}
	
	this.evalScript = function(templateName)
	{			
		//{{{ begin create controller
		
		var controllerName = me.getControllerName(templateName);
		
		// create namespace
		var sEval = "";
		
		if(my.ns != null){
			sEval = "QPanel.ns." + my.ns + " = {};\n";
		}
		
		sEval += "QPanel.ns."+controllerName+" = "+templateName+";\n";
		
		eval(sEval);
		
		// done create controller }}}
	}
}

/* 
#################################################
CLASS PANEL
################################################# 
*/

QPanel.Panel = function(qpanel, container, panelID, templateName)
{
	/*	========
		Privates
		======== */
		
	var me = this;
	var my = {
		displayed 		:true,
		qpanel 			:qpanel,
		id				:panelID,
		templateName	:templateName,
		controller		:null,
		parentContainer	:container,
		selfContainer	:container,
		containers		:[],
		html			:null,
		handler			:$('#'+panelID),
		displayStyle	:'',
	};
	
	/*  ==========
		PROPERTIES
		========== */
	
	//.id
	this.__defineGetter__("id", function(){return my.id;});
	
	//.handler
	this.__defineGetter__("handler", function(){return me == my.qpanel.rootPanel ? $('body') : my.handler;});
	
	//.selfContainer
	this.__defineGetter__("selfContainer", function(){return my.selfContainer;});
	
	// .controller
	this.__defineGetter__('controller', function(){return my.controller;});
	this.__defineSetter__('controller', function(val){my.controller = val;});
	
	//.displayed
	this.__defineGetter__('displayed', function(){return my.displayed;});
	this.__defineSetter__('displayed', function(val){my.displayed = val;});
	
	/*	==============
		Active methods
		============== */
	
	this.close = function()
	{
		me.selfContainer.removePanel(self);
	}
	
	this.containerList = function()
	{
		return my.containers;
	}
	
	//this.controller = function(val)
	//{
	//	if(typeof val != 'undefined')
	//	{
	//		my.controller = val;
	//	}
	//	
	//	return my.controller;
	//}
	
	//this.displayed = function(bDisplayed)
	//{
	//	if(bDisplayed === true || bDisplayed === false){
	//		my.displayed = bDisplayed;
	//	}
	//	
	//	return my.displayed;
	//}
	
	this.getContainer = function(id)
	{
		var container = null;
		
		if(my.containers[id] == null){
			var div = QPanel.GetElement(id);
			
			//if(div == null) console.log("Cannot get container with id '"+id+"'");
			
			container = new QPanel.Container(my.qpanel, id);
			container.parentPanel = me;
			my.containers[id] = container;
			my.qpanel.registerContainer(container);
		}
		else{ 
			container = my.containers[id];
		}
		
		return container;
	}
	
	this.addPanelTo = function(containerID, oPath, panel, opt, onNext)
	{
		/* not just a shortcut to get container and add panel */
		
		me.getContainer(containerID).addPanel(oPath, panel, opt, onNext);
		
		return me;
	}
	
	this.hide = function()
	{
		my.displayStyle = me.handler.css('display');
		me.handler.hide();
	}
	
	this.show = function()
	{
		me.handler.css('display',my.displayStyle);
	}
	
	this.up = function()
	{
		my.selfContainer.up(me);
	}
	
	this.down = function()
	{
		my.selfContainer.down(me);
	}
	
	/*
		Obsolete methods
	*/
	
	
	
	/*
		Beta methods
	*/
	
	this.save = function(){
		my.html = $('#'+my.id).html();
		return me;
	}
	
	this.reload = function(){
		$('#'+my.id).html(my.html);
	}
}

/* 
#################################################
CLASS CONTROLLERBASE
################################################# 
*/

QPanel.ControllerBase = function(qpanel, id)
{
	/*
		Privates
		========
	*/
	
	var me = this;
	
	this.base 	= 123;
	this.qpanel = qpanel;
	this.id 	= id;
	
	this.init = function(opt)
	{
		// to be overriden
	}
	
	this.getPanel = function(){return me.qpanel.getPanel(this.id);}
	
	/* 	========
		OBSOLETE
		======== */
	this.parentPanelController = function()
	{
		var parentContainer = me.panel().parentContainer;
		
		if(parentContainer != null){
			var parentPanel = parentContainer.parentPanel;
			
			if(parentPanel != null){
				return parentPanel.controller;
			}
		}
		
		return null;
	}
}

/*
#################################################
CLASS CONTAINER
#################################################
*/

QPanel.Container = function(qpanel, containerID)
{
	/*	========
		PRIVATES
		======== */
	var me = this;
	var my = {
		parentPanel	:null,
		qpanel		:qpanel,
		id			:containerID,
		handler		:$('#'+containerID),
		panels		:[],
		mode		:QPanel.Container.BLOCK,
		displayStye	: '',
		
		countLoadEnable		:false,
		countLoadStarted	:false,
		CountLoadAction		:null,
		countLoad			:[],
	};
	
	/*	==========
		PROPERTIES
		========== */
		
	//.id
	this.__defineGetter__("id", function()
	{
		return my.id;
	});
	
	//.parentPanel
	this.__defineGetter__("parentPanel", function()
	{
		return my.parentPanel;
	});
	
	this.__defineSetter__("parentPanel", function(val)
	{
		my.parentPanel = val;
	});
	
	//.handler
	this.__defineGetter__("handler", function()
	{
		return my.handler;
	});
	
	/*	=======
		METHODS
		======= */
	
	//this.id = function()
	//{
	//	return my.id;
	//}
	
	this.mode = function(val)
	{
		if(typeof val != 'undefined'){
			switch(val){
			case QPanel.Container.DECK:
				my.mode = QPanel.Container.DECK;
				break;
			case QPanel.Container.BLOCK:
				my.mode = QPanel.Container.BLOCK;
				break;
			}
			
			me.refresh();
		}
		
		return my.mode;
	}
	
	//this.parentPanel = function(val)
	//{
	//	if(typeof val != 'undefined'){
	//		my.parentPanel = val;
	//	}
	//	
	//	return my.parentPanel;
	//}
	
	this.registerPanelFromTop	= function(oPanel)
	{
		var newArr = [];	
		newArr.push(oPanel);
		
		for(var i=0; i<my.panels.length; i++){
			newArr.push(my.panels[i]);
		}
		
		my.panels = newArr;
	}
	
	this.addPanel = function(oPath, panel, opt, onNext)
	{
		if(oPath == null) throw('QPanel - the TemplatePath object is null when attempting to create "'+panel+'" panel (you maybe forgot to define the path)');
		
		if(typeof opt == 'function'){
			onNext = opt;
			opt = null;
		}
		
		if(typeof panel == 'string'){ // panel is template name
			oPath.createPanel(me, panel, opt, function(panel){
				me.registerPanelFromTop(panel);
				me.refresh();
				
				if(onNext != null) onNext(panel);
			});
		}
		else{
			panel.container = me;
			
			// check if not already in this container
			if(my.panels.indexOf(panel) < 0){
				me.registerPanelFromTop(panel);
				me.refresh();
			}
			
			if(onNext != null) onNext(panel);
		}
		
		return me;
	}
	
	this.showOnlyPanel = function(panel)
	{
		for(var i in my.panels){
			my.panels[i] != panel
				? my.panels[i].hide()
				: my.panels[i].show();
		}
	}
	
	this.closeAll = function()
	{
		while(my.panels.length > 0){
			this.removePanel(my.panels[0]);
		}
	}
	
	this.panelList = function()
	{
		return my.panels;
	}
	
	this.removePanel = function(panel)
	{
		my.qpanel.unregPanel(panel); // remove from QPanel
		my.panels = QPanel.arrayRemoveByValue(panel, my.panels); // remove from container
		panel.handler.remove(); // remove from DOM
		
		//alert(panel.id+' removed');
		me.refresh();
	}
	
	this.refresh = function()
	{
		for(var i=0; i<my.panels.length; i++){
			switch(my.mode){
			case QPanel.Container.DECK:
				(i == 0)
					? my.panels[i].show()
					: my.panels[i].hide();
				break;
			default:
				my.panels[i].show();
				break;
			}
			
			my.handler.append(my.panels[i].handler);
		}
	}
	
	this.up = function(panel)
	{
		var temp = null;
		var search = 0;
		
		for(var search=0; search<my.panels.length; search++){
			if(my.panels[search] == panel) break;
		}
		
		if(search > 0){
			temp = my.panels[search - 1];
			my.panels[search - 1] = panel;
			my.panels[search] = temp;
			
			me.refresh();	
		}
	}
	
	this.down = function(panel)
	{
		var temp = null;
		var search = 0;
		
		for(var search=0; search<my.panels.length; search++){
			if(my.panels[search] == panel) break;
		}
		
		if(search < my.panels.length - 1){
			temp = my.panels[search + 1];
			my.panels[search + 1] = panel;
			my.panels[search] = temp;
			
			me.refresh();	
		}
	}
	
	this.hide = function()
	{
		my.displayStyle = me.handler.css('display');
		me.handler.hide();
	}
	
	this.show = function()
	{
		me.handler.css('display',my.displayStyle);
	}
	
	this.isCountingLoad = function()
	{
		return my.countLoadMode;
	}
	
	this.beginCountLoad = function(fn)
	{
		my.countLoadEnabled = true;
		my.countLoadAction = fn;
		
		my.countLoadAction.loadStart();
	}
	
	// this function control if the countAction started after this
	this.startCountLoad = function()
	{
		my.countLoadStarted = true;
		console.log('[startCountLoad] my.countLoad='+my.countLoad);
		
		if(my.countLoadEnabled && my.countLoad.length == 0){
			my.countLoadEnabled = false;
			my.countLoadStarted = false;
			my.countLoadAction.loadEnd();
		}
	}
	
	this.countLoadAdd = function(countLoadID)
	{
		if(my.countLoadEnabled){
			my.countLoad.push(countLoadID);
			console.log('CountLoadAdd = '+my.countLoad+' on '+me.id+' ('+countLoadID+')');
		}
		
		if(my.parentPanel != my.qpanel.rootPanel){
			my.parentPanel.selfContainer.countLoadAdd(countLoadID);
		}
	}
	
	this.countLoadDone = function(countLoadID)
	{
		if(my.countLoadEnabled){
			my.countLoad = QPanel.ArrayRemoveByValue(countLoadID, my.countLoad);
			
			console.log('CountLoadDone = '+my.countLoad+' ('+my.countLoadStarted+') on '+me.id+' ('+countLoadID+')');
			
			if(my.countLoadStarted && my.countLoad.length == 0){
				my.countLoadEnabled = false;
				my.countLoadStarted = false;
				my.countLoadAction.loadEnd();
			}
		}
		
		if(my.parentPanel != my.qpanel.rootPanel){
			my.parentPanel.selfContainer.countLoadDone(countLoadID);
		}
	}
	
	/* 	========
		OBSOLETE
		======== */
	
	this.clear = function()
	{
		me.closeAll();
	}
	
	this.setMode = function(mode)
	{
		return me.mode(mode);
	}
}

/* Controller Namespace Container */
QPanel.ns = {}

/*
#################################################
ENUM
#################################################
*/

QPanel.Container.BLOCK 	= 'BLOCK'
QPanel.Container.DECK 	= 'DECK'

/* 
#################################################
STATICS
#################################################
*/

QPanel.GetTimeString = function(){return new Date().getTime(); }
QPanel.GetElement = function(id){return document.getElementById(id);}

QPanel.InjectController = function(qpanel, id, child){
	var c = new QPanel.ControllerBase(qpanel, id);
	
	child.qpanel 				= c.qpanel;
	child.id 					= c.id;
	child.panel 				= c.getPanel();
	
	//child.parentPanelController	= c.parentPanelController;
	//child.getPanel 				= c.getPanel;
	//child.getParentController 	= c.getParentController;
	
	if(!child.init){ child.init = c.init; }
	
	return child;
}

QPanel.ArrayRemoveByKey = function(k, a)
{
	var i = 0;
	var r = [];
	for(i in a){ if(i != k) r[i]=a[i]; }
	return r;
}
QPanel.arrayRemoveByKey = function(k, a){return QPanel.ArrayRemoveByKey(k,a);}

QPanel.ArrayRemoveByValue = function (v, a)
{
	var i = 0;
	var x = 0;
	var r = [];
	for(i in a){ if(a[i] != v) {r[x++]=a[i];} }
	return r;
}
QPanel.arrayRemoveByValue = function (v, a){return QPanel.ArrayRemoveByValue(v,a);}

QPanel.ReplaceID = function(id)
{
	var newID = id + '_' + QPanel.GetTimeString();
	$('#'+id).attr('id',newID);
	return newID;
}