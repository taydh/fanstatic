/*
#################################################
CLASS QPANEL
version 1.2.0

Principles:
- QPanel is a DOM manipulation & script injection library approach for Front End development
- Server side scripting treated as CGI/resources/web services - not HTML preprocessing

Container Mode:
- Stack
- Dock

Container replacement: container can be replaced by 

Version 1.2.0 remove dependency from jquery and change container Dock behaviour
Dock container is filled directly by the template content, and become the corresponding panel
QPanel will only have minimum class

#################################################
*/

var QPanel = function()
{
	/* =====
	Privates
	===== */
		
	var me = this;
	var my = {
		trailstring 			: true,
		reg_template_content 	: [],
		reg_template_script	 	: [],
		reg_container 			: [],	
		reg_panel 				: [],		
		rootPanel				: null,
		countLoad				: 0,
		hideOnLoad				: false,
		
		//hideOnLoadCounters	: [],
	}
	this.my = my;
	
	/* =======
	PROPERTIES
	======= */
	
	/* rootPanel */
	this.__defineGetter__('rootPanel', function()
		{
			if(my.rootPanel == null){
				my.rootPanel = me.createPanelStruct('_rootPanel');
			}
			
			return my.rootPanel;
		});
	
	/* ===========
	Active Methods
	=========== */
	this.addPanel
		= function(parentPanel, containerId, templateResolver, panel, option, onNext)
		{
			var container = me.getContainer(parentPanel, containerId);
				
			if(templateResolver == null) throw('QPanel - the TemplatePath object is null when attempting to create "'+panel+'" panel (you maybe forgot to define the path)');
		
			if(typeof option == 'function'){
				onNext = option;
				option = null;
			}
		
			if(typeof panel == 'string'){ // panel is template name
				me.createPanel(templateResolver, container, panel, option, function(panel){

					container.panels.push(panel);
					me.refreshContainer(container);
				
					if(onNext != null) onNext(panel);
				});
			}
			else{ // panel is object
				panel.container = container;
			
				// check if not already in this container
				if(container.panels.indexOf(panel) < 0){
					//me.registerPanelFromTop(panel);
					container.panels.push(panel);
					me.refreshContainer(container);
				}
			
				if(onNext != null) onNext(panel);
			}
		
			//return container;
		}		
	
	this.createTemplateResolver
		= function(path)
		{
			return QPanel.CreateStruct.TemplateResolver(me, path);
		}

	this.createContainer
		= function(parentPanel, containerId)
		{
			return QPanel.CreateStruct.Container(me, parentPanel, containerId);
		}
		
	this.createPanelStruct
		= function(panelId)
		{
			return QPanel.CreateStruct.Panel(me, panelId);
		}
	
	this.registerPanel
		= function(container, panel)
		{
			var newArr = [];	
			newArr.push(panel);
		
			for(var i=0; i<container.panels.length; i++){
				newArr.push(container.panels[i]);
			}
		
			container.panels = newArr;
		}
	
	this.getControllerFullName
		= function(templateResolver, templateName)
		{
			return (templateResolver.ns.length > 0) ? templateResolver.ns+'.'+templateName : templateName;
		}
		
	this.getContainer
		= function(parentPanel, containerId)
		{
			if(my.reg_container[containerId] === undefined){
				my.reg_container[containerId] = me.createContainer(parentPanel, containerId);
			}
			
			return my.reg_container[containerId];
		}
	
	this.registerController
		= function (templateResolver, templateName)
		{
			//{{{ begin create controller
		
			var controllerName = me.getControllerFullName(templateResolver, templateName);
		
			// create namespace
			var sEval = "";
		
			if(templateResolver.ns.length > 0){
				sEval = "QPanel.ns." + templateResolver.ns + " = {};\n";
			}
		
			sEval += "QPanel.ns."+controllerName+" = "+templateName+";\n";
		
			try{
				console.log('QPanel: TemplatePath.evalScript: evaluating ' + templateName + '.js')
				eval(sEval);
			} catch(e){
				console.log(sEval);
				console.log('QPanel: Error registering controller ' + templateName + ': ' + e.message)
			}
		
			// done create controller }}}
		}
		
	this.setControllerOff
		= function(templateResolver, templateName)
		{
			var arrTemp = [];
			var setOff = false;
		
			for(var i=0; i<arrTemplateName.length; i++){
				for(var j=0; j<templateResolver.controllerOff.length; j++){
					if(arrTemplateName[i] == templateResolver.controllerOff[j]){
						setOff = true;
						break;
					}
				}
			
				if(!setOff){
					templateResolver.controllerOff.push(arrTemplateName[i]);
				}
			
				setOff = false;
			}
		}
		
	this.isControllerOff
		= function(templateResolver, templateName)
		{
			var res = false;
		
			for(var i=0; i<templateResolver.controllerOff.length; i++){
				if(templateName == templateResolver.controllerOff[i]){
					res = true;
					break;
				}
			}
		
			return res;
		}
	
	this.getTemplateContentPath
		= function(templateResolver, templateName)
		{
			return templateResolver.path + templateName + '.htm';
		}
	
	this.getTemplateScriptPath
		= function(templateResolver, templateName)
		{
			return templateResolver.path + templateName + '.js';
		}
		
	this.createPanel
		= function(templateResolver, container, templateName, option, onNext)
		{
			// switch arguments
			if(typeof option == 'function')
			{
				onNext = option;
				option = null;
			}
		
			var countloadId = templateName+'_'+QPanel.Common.GetTimeString();
			me.countload_add(container, countloadId);
		
			me.setupPanelDOM(templateResolver, container, templateName, function(panel){
			
				if(!me.isControllerOff(templateResolver, templateName) && !templateResolver.disabledControllers){
			
					// load controller
					me.loadScript(me, templateName, function(isFailed){

						if(!isFailed){
							//{{{ begin create controller
						
							var controllerName = me.getControllerFullName(templateName);
						
							var sEval = "";
						
							if(my.ns != null){
								sEval = "QPanel.ns." + my.ns + " = {};\n";
							}
						
							sEval += "QPanel.ns."+controllerName+" = "+templateName+";\n"
									+ "var newController = new QPanel.ns."+controllerName+"()";
						
							try{
								console.log('QPanel: TemplatePath.createPanel: Evaluating script ' + templateName)
								eval(sEval);
							} catch(e)
							{
								console.log('QPanel: evaluating ' + templateName + ' failed: ' + e.message);
							}
						
							newController = QPanel.InjectController(me, null, newController)
							panel.controller = newController;
							newController.init(option);
						
							// done create controller }}}
						}
					
						if(typeof onNext === 'function') onNext(panel);
					
						me.countload_done(container, countloadId);
					
					});
				}
				else{
				
					if(typeof onNext === 'function') onNext(panel);
				
					me.countload_done(container, countloadId);
				}
			});
		}
		
	this.setupPanelDOM
		= function(templateResolver, container, templateName, onNext)
		{		
			console.log('Qpanel.setupPanel: start '+templateName);
	
			// create panel div

			var controllerName = me.getControllerFullName(templateResolver, templateName);
		
			if(container.mode == QPanel.Container.STACK){		
				var id = '_qpanel_' + templateName + '_' + QPanel.Common.GetTimeString();
				var el = document.createElement('div');
				el.setAttribute('id', id);
				document.getElementById(container.id).appendChild(el);
			}
			else{
				var id = container.id;
				var el = document.getElementById(container.id);
			}
		
			/* >>> JQUERY >>> */
			var handler = $("#"+id);
			handler.hide();
			/* <<< JQUERY <<< */
		
			var panel = me.createPanelStruct(id);
			panel.selfContainer = container;
			panel.templateResolver = templateResolver;
			panel.templateName = templateName;
			
			my.reg_panel[id] = panel;
		
			// check template cache
			if(my.reg_template_content[controllerName] == null){
				var url = me.alwaysFresh()
					? me.getTemplateContentPath(templateResolver, templateName) + '?_=' + QPanel.Common.GetTimeString()
					: me.getTemplateContentPath(templateResolver, templateName);
			
				//console.log('Loading template: '+url+' (async)');
			
				/* >>> JQUERY >>> */
				handler.load(url, function(responseText){
					my.reg_template_content.push(controllerName);					
					my.reg_template_content[controllerName] = responseText;
				
					if(onNext != null) onNext(panel);
				});
				/* <<< JQUERY <<< */
				
				// .fail(function(){
					// throw('QPanel - Template file not found: '+controllerName);
				// });
			}
			else
			{
				handler.html(my.reg_template_content[controllerName]);
			
				if(onNext != null) onNext(panel);
			}
		
			console.log('QPanel.setupPanel: done')
		}
	
	this.checkContainerMode
		= function(container, mode)
		{
			if(typeof mode != 'undefined'){
				switch(val){
				case QPanel.Container.STACK:
					container.mode = QPanel.Container.STACK;
					break;
				case QPanel.Container.DOCK:
					container.mode = QPanel.Container.DOCK;
					break;
				}
			
				me.refreshContainer(container);
			}
		
			return container.mode;
		}
	
	
		
	this.removePanel
		= function(container, panel)
		{
			// 1/3 remove from this container registration
			container.panels = QPanel.Common.arrayRemoveByValue(panel, container.panels); 
		
			// 2/3 remove from QPanel registration
			me.unregPanel(panel); 
		
			// 3/3 remove from DOM, goodbye!
			panel.handler.remove(); 
		
			//alert(panel.id+' removed');
			me.refreshContainer(container);
		}
		
	this.movePanelUp
		= function(panel)
		{
			var temp = null;
			var search = 0;
			var container = panel.selfContainer;
		
			for(var search=0; search<container.panels.length; search++){
				if(container.panels[search] == panel) break;
			}
		
			if(search > 0){
				temp = container.panels[search - 1];
				container.panels[search - 1] = panel;
				container.panels[search] = temp;
			
				me.refreshContainer(container);	
			}
		}
		
	this.movePanelDown 
		= function(panel)
		{
			var temp = null;
			var search = 0;
			var container = panel.container;
		
			for(var search=0; search<container.panels.length; search++){
				if(container.panels[search] == panel) break;
			}
		
			if(search < container.panels.length - 1){
				temp = container.panels[search + 1];
				container.panels[search + 1] = panel;
				container.panels[search] = temp;
			
				me.refreshContainer(container);	
			}
		}

	this.closeAllContainerPanels
		= function(container)
		{
			while(container.panels.length > 0){
				me.removePanel(container.panels[0]);
			}
		}
		
	this.refreshContainer
		= function(container)
		{
			for(var i=0; i<container.panels.length; i++){
				switch(container.mode){
				case QPanel.Container.DECK:
					(i == container.panels.length - 1)
						? me.showPanel(container.panels[i])
						: me.hidePanel(container.panels[i]);
					break;
				default:
					me.showPanel(container.panels[i]);
					break;
				}
			
				container.handler.append(container.panels[i].handler);
			}

		}
	
	this.hideContainer
		= function(containerId)
		{
		}

	this.showContainer
		= function(containerId)
		{
			container.handler.css('display',container.displayStyle);
		}
		
	this.countload_begin
		= function(container, countloadAction)
		{
			container.countLoadEnabled = true;
			container.countLoadAction = countloadAction;
		
			container.countLoadAction.loadStart();
		}
		
	this.countload_start
		= function(container)
		{
			container.countLoadStarted = true;
			console.log('[startCountLoad] my.countLoad=' + container.countLoad);
		
			if(container.countLoadEnabled && container.countLoad.length == 0){
				container.countLoadEnabled = false;
				container.countLoadStarted = false;
				container.countLoadAction.loadEnd();
			}
		}
	
	this.countload_add
		= function(container, countloadId)
		{
			if(container.countLoadEnabled){
				container.countLoad.push(countloadId);
				console.log('CountLoadAdd = '+container.countLoad+' on '+container.id+' ('+countloadId+')');
			}
		
			if(container.parentPanel != me.rootPanel){
				me.countLoad_add(my.parentPanel.selfContainer, countloadId);
			}
		}
	
	this.countload_done
		= function(container, countloadId)
		{
			if(container.countLoadEnabled){
				container.countLoad = QPanel.Common.ArrayRemoveByValue(countloadId, container.countLoad);
			
				console.log('CountLoadDone = '+container.countLoad+' ('+my.countLoadStarted+') on '+container.id+' ('+countloadId+')');
			
				if(container.countLoadStarted && my.countLoad.length == 0){
					container.countLoadEnabled = false;
					container.countLoadStarted = false;
					container.countLoadAction.loadEnd();
				}
			}
		
			if(container.parentPanel != me.rootPanel){
				me.countload_done(container.parentPanel.selfContainer, countloadId);
			}
		}
		
	this.getPanelByTemplate
		= function(container, templateResolver, templateName)
		{
			var panels = container.panels;
			var res = null;
		
			for(var i=0; i<panels.length; i++)
			{
				if(panels[i].templateResolver == templateResolver && panels[i].templateName == templateName){
					res = panels[i];
					break;
				}
			}
		
			return res;
		}
	
	this.closePanel 
		= function(panelId)
		{
		}
		
	this.getRegisteredPanelContainerList
		= function(panelId)
		{
		}
		
	this.getPanelContainer
		= function(panel)
		{
			var container = null;
		
			if(panel.containers[id] == null){
				var div = QPanel.Common.GetElement(id);
			
				if(div == null) throw('QPanel - Try to do getContainer() at panel "'+panel.id+'" but no container element matching "'+id+'"') 
			
				container = me.createContainer(id);
				container.parentPanel = panel;
				panel.containers[id] = container;
				me.registerContainer(container);
			}
			else{ 
				container = panel.containers[id];
			}
		
			return container;

		}
		
	this.hideContainer
		= function(container)
		{
			container.displayStyle = container.handler.css('display');
			container.handler.hide();
		}
		
	this.showContainer
		= function(container)
		{
			container.handler.css('display', container.displayStyle);
		}

	this.getPanel
		= function(panelID)
		{
			return my.reg_panel[panelID];
		}

	this.alwaysFresh
		= function(bTrailstring)
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
	
	this.loadScript = function(templateResolver, templateName, onLoad)
	{
		var controllerName = me.getControllerFullName(templateResolver, templateName);
		
		if(my.reg_template_script[controllerName] == null){
		
			/* >>> JQUERY >>> */
			// JQuery getScript() with cache setting
			$.ajax({
				url: me.getTemplateScriptPath(templateResolver, templateName),
				dataType: "script",
				cache: !my.trailstring,
				success: function(){
					my.reg_template_script.push(controllerName);
					my.reg_template_script[controllerName] = true;
					
					if(onLoad != null) onLoad();
				}
			}).fail(function(){
				my.reg_template_script[controllerName] = false;
				
				if(arguments[0].status == 200){
					//console.log(arguments);
					console.log('QPanel|Controller error: ' + controllerName + '\n'
						+ arguments[2] + ' (line: ' + arguments[2].lineNumber+ ')');
					
					//throw('Controller error!');
				} else {
					//console.log('Controller file not found: '+controllerName);
				}
				
				if(onLoad != null) onLoad(true);
			});
			/* <<< JQUERY <<< */
		}
		else if(my.reg_template_script[controllerName] == false){
			if(onLoad != null) onLoad(true);
		}
		else{
			if(onLoad != null) onLoad();
		}
	}
	
	this.useTemplate = function(templateResolver, templateName)
	{
		var controllerName = me.getControllerFullName(templateResolver, templateName);
		
		if(my.reg_template_content[controllerName] == null){
			var url = me.alwaysFresh()
				? me.getTemplateContentPath(templateResolver, templateName) + '?_=' + QPanel.Common.GetTimeString()
				: me.getTemplateContentPath(templateResolver, templateName);
			
			console.log('Loading template: '+url+' (sync)');
			
			$.ajax({async:false});
			$.get(url, function(responseText){
				my.reg_template_content.push(controllerName);
				my.reg_template_content[controllerName] = responseText;
				
				me.loadScript(templateResolver, templateName, function(isFailed){
					if(!isFailed){
						me.registerController(templateResolver, templateName);
					}
				});
			});
			$.ajax({async:true});
		}
	}
	

// 	this.addTemplate = function(elementId, templatePath, templateName, opt, onNext){
// 		
// 		if(typeof opt == 'function')
// 		{
// 			onNext = opt;
// 			opt = null;
// 		}
// 		
// 		/* >>> JQUERY >>> */
// 		
// 		var handler = $('#'+elementId);
// 		
// 		/* <<< JQUERY <<< */
// 		
// 		var url = me.alwaysFresh()
// 				? templatePath.getHTMLPath(templateName) + '?_=' + QPanel.GetTimeString()
// 				: templatePath.getHTMLPath(templateName);
// 		
// 		$.get(url, function(responseText){
// 			
// 			me.loadScript(templatePath, templateName, function(isFailed){
// 				if(!isFailed){
// 					//{{{ begin create controller
// 					
// 					var controllerName = me.getControllerFullName(templateName);
// 					
// 					var sEval = "";
// 
// 					if(typeof QPanel.ns._tpl_ === 'undefined'){
// 						sEval = "QPanel.ns._tpl_ = {};\n";
// 					}
// 					
// 					sEval += "QPanel.ns._tpl_."+controllerName+" = "+templateName+";\n"
// 							+ "var newController = new QPanel.ns._tpl_."+controllerName+"()";
// 					
// 					try{
// 						console.log('QPanel: QPanel.addTemplate: Evaluating script ' + templateName)
// 						eval(sEval);
// 					} catch(e)
// 					{
// 						console.log('QPanel: evaluating ' + templateName + ' failed: ' + e.message);
// 					}
// 					
// 					newController.qpanel = me;
// 					newController.elementId = elementId;
// 					newController.handler = handler;
// 					
// 					responseText = newController.init(opt, responseText);
// 					
// 					// done create controller }}}
// 					
// 					handler.html(responseText);
// 				}
// 				
// 				if(typeof onNext === 'function'){ onNext(); }
// 			});
// 		});
// 	}
}

/*
===============
STRUCTS CREATOR
===============
*/

QPanel.CreateStruct = {}

QPanel.CreateStruct.Container = function(qpanel, parentPanel, containerId)
{
	return {
		parentPanel			: parentPanel,
		qpanel				: qpanel,
		id					: containerId,
		panels				: [],
		mode				: QPanel.Container.DOCK,
		displayStye			: '',

		countLoadEnabled	:false,
		countLoadStarted	:false,
		CountLoadAction		:null,
		countLoad			:[],
	}
}

QPanel.CreateStruct.Panel = function(qpanel, panelId)
{
	return {
		displayed 			: true,
		qpanel 				: qpanel,
		id					: panelId,
		templateName		: '',
		templateResolver	: null,
		controller			: null,
		selfContainer		: null,
		containers			: [],
		html				: null,
		handler				: $('#'+panelId),
		displayStyle		: '',
	}
}

QPanel.CreateStruct.TemplateResolver = function(qpanel, path)
{
	return {
		qpanel 				: qpanel,
		path 				: path,
		ns 					: '',
		
		disabledControllers	: false,
		controllerOff		: [],
	}
}

/* 
#################################################
CLASS QPanel.ControllerBase
version 1.2.0
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
// 	this.parentPanelController = function()
// 	{
// 		var parentContainer = me.getPanel().parentContainer;
// 		
// 		if(parentContainer != null){
// 			var parentPanel = parentContainer.parentPanel;
// 			
// 			if(parentPanel != null){
// 				return parentPanel.controller;
// 			}
// 		}
// 		
// 		return null;
// 	}
}

/* Controller Namespace Container */
QPanel.ns = {}

/*
#################################################
ENUM
#################################################
*/

QPanel.Container = {};
QPanel.Container.BLOCK 	= 'BLOCK'
QPanel.Container.DECK 	= 'DECK'
QPanel.Container.DOCK 	= 'DOCK'
QPanel.Container.STACK 	= 'STACK'

/* 
#################################################
LIBRARY-SPECIFIC STATICS FUNCTIONS
#################################################
*/

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

QPanel.ReplaceID = function(id)
{
	var newID = id + '_' + QPanel.Common.GetTimeString();
	document.getElementById(id).setAttribute('id',newID);
	return newID;
}

/* 
#################################################
COMMON STATICS FUNCTIONS
#################################################
*/

QPanel.Common = {}
QPanel.Common.GetTimeString = function(){return new Date().getTime(); }
QPanel.Common.GetElement = function(id){return document.getElementById(id);}

QPanel.Common.ArrayRemoveByKey = function(k, a)
{
	var i = 0;
	var r = [];
	for(i in a){ if(i != k) r[i]=a[i]; }
	return r;
}

QPanel.Common.ArrayRemoveByValue = function (v, a)
{
	var i = 0;
	var x = 0;
	var r = [];
	for(i in a){ if(a[i] != v) {r[x++]=a[i];} }
	return r;
}

QPanel.Common.Ajax = function()
{
}

QPanel.Common.Hide = function(id)
{
}

QPanel.Common.Show = function(id)
{
}