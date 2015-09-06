var QPanel = {};

QPanel.GetTimeString = function(){ return new Date().getTime(); }

QPanel.ReplaceID = function(id)
{
	var newID = id + '_' + QPanel.GetTimeString();
	$('#'+id).attr('id',newID);
	return newID;
}

QPanel.TemplateContents = {};
QPanel.GetTemplateId = function(path, templateName){ return (path + templateName).replace('/','_'); }

QPanel.RegContent = function(path, templateName, cached, next)
{
	var templateId = QPanel.GetTemplateId(path, templateName);
	
	if(QPanel.TemplateContents[templateId] === undefined){
		
		$.ajax({
			url: (path + templateName + '.htm'),
			cache: cached,
			success: function(content){
				QPanel.TemplateContents[templateId] = content;
				next();
			}});
	}
	else{
		next();
	}
}

QPanel.GetWindowScriptName = function(templateName){ return 'QPANELSCRIPT_'+templateName; }

QPanel.RegScript = function(path, templateName, cached, next)
{
	if(typeof window[QPanel.GetWindowScriptName(templateName)] !== 'function'){
		
		$.ajax({
			url: (path + templateName + '.js'),
			dataType: "script",
			cache: cached,
			success: function(){
				if(typeof window[QPanel.GetWindowScriptName(templateName)] === 'function'){
					// success
				}
				else{
					console.log('Invalid function in Script ' + templateName + '!');
				}
			
				next();
			}}).fail(function(){
				if(arguments[0].status == 200){
					//console.log(arguments);
					console.log('RegScript error: ' + templateName + '\n'
						+ arguments[2] + ' (line: ' + arguments[2].lineNumber+ ')');
				}
				
				next();
			});
	}
	else{
		next();
	}
}

QPanel.GetAddTemplateInfoDefault = function()
{
	return {
		loadType: 'content-and-script', //>> content-only | content-and-script | script-only
		placement: 'append', //>> prepend | append | before | after
		container: '',
		path: '',
		templateName: '',
		useTrail: false,
		scriptArgs: {},
		next: function(){},
		counter: null,
	}
}

QPanel.ApplyMustache = function(shadowid, args)
{
	var shadow = document.getElementById(shadowid);
	shadow.innerHTML = Mustache.render(shadow.innerHTML, args);
}

QPanel.InsertTemplate = function(info)
{
	//args = {placement, container, path, templateName, cached, withScript, scriptArgs, next, counter}
	
	var applyScript = function(info){
		// create a "shadow DOM"
		var templateId = QPanel.GetTemplateId(info.path, info.templateName);
		var shadow = document.createElement('div');
		shadow.id = '_shadow_' + QPanel.GetTimeString();
		shadow.setAttribute('style','display:none');
		shadow.innerHTML = QPanel.TemplateContents[templateId];
		document.body.appendChild(shadow);
		
		if(window[QPanel.GetWindowScriptName(info.templateName)] !== undefined){
			// insert shadow dom as first arguments
			var params = [shadow.id, info.scriptArgs];
			window[QPanel.GetWindowScriptName(info.templateName)].apply(this, params);
		}
		else if(Mustache !== undefined){ // apply mustachejs
			 QPanel.ApplyMustache(shadow.id, info.scriptArgs);
		}
		
		switch(info.placement){
		case 'append': $('#'+info.container).append(shadow.innerHTML); break;
		case 'prepend': $('#'+info.container).prepend(shadow.innerHTML); break;
		case 'before': $('#'+info.container).before(shadow.innerHTML); break;
		case 'after': $('#'+info.container).after(shadow.innerHTML); break;
		default: 
			console.log('QPanel: unknown AddContent placement info "' + info.placement + '", append instead');
			$('#'+info.container).append(shadow.innerHTML);
			break;
		}
		
		// remove shadow
		document.body.removeChild(shadow);
	};
	
	if(info.counter !== null) info.counter.count();
	
	switch(info.loadType){
	case 'content-and-script':
		QPanel.RegContent(info.path, info.templateName, !info.useTrail, function(){
			QPanel.RegScript(info.path, info.templateName, !info.useTrail, function(){
				applyScript(info);		
				info.next();
				if(info.counter !== null) info.counter.done();
			});
		});
		break;
	case 'content-only':
		QPanel.RegContent(info.path, info.templateName, !info.useTrail, function(){
			
			applyScript(info);
			
			// var templateId = QPanel.GetTemplateId(info.path, info.templateName);
// 			
// 			switch(info.placement){
// 			case 'append': $('#'+info.container).append(QPanel.TemplateContents[templateId]); break;
// 			case 'prepend': $('#'+info.container).prepend(QPanel.TemplateContents[templateId]); break;
// 			case 'before': $('#'+info.container).before(QPanel.TemplateContents[templateId]); break;
// 			case 'after': $('#'+info.container).after(QPanel.TemplateContents[templateId]); break;
// 			default: 
// 				console.log('QPanel: unknown AddContent placement info "' + info.placement + '", append instead');
// 				$('#'+info.container).append(QPanel.TemplateContents[templateId]);
// 				break;
// 			}
		
			info.next();
			if(info.counter !== null) info.counter.done();
		});
		break;
	case 'script-only':
		QPanel.RegScript(info.path, info.templateName, !info.useTrail, function(){
			applyScript(info);
			info.next();
			if(info.counter !== null) info.counter.done();
		});
		break;
	default:
		console.log('QPanel: unknown AddContent type - library error!');
		break;
	}
}

QPanel.ExecutionChain = function(placement, container, path, templateName, scriptArgs)
{
	this.info = QPanel.GetAddTemplateInfoDefault();
	
	this.info.container = container;
	this.info.path = path;
	this.info.templateName = templateName;

	if(scriptArgs === undefined){
		this.info.loadType = 'content-only';
	}
	else{
		this.info.scriptArgs = scriptArgs;
	}
	
	this.contentOnly = function()
	{
		this.info.loadType = 'content-only';
		
		return this;
	}
	
	this.scriptOnly = function()
	{
		this.info.loadType = 'script-only';
		
		return this;
	}
	
	this.count = function(counter)
	{
		if(counter !== undefined) this.info.counter = counter;
		
		return this;
	};
	
	this.cached = function(isCached)
	{
		if(isCached !== undefined) this.info.useTrail = !isCached;
		
		return this;
	}
	
	this.done = function(f_next)
	{
		if(f_next !== undefined) this.info.next = f_next;
		
		QPanel.InsertTemplate(this.info);
	};
}

/* MAIN TEMPLATE INSERT */

QPanel.CreateCounter = function(onFinish)
{
	return new function() 
	{
		this.counter = 0;
		this.done = function(){
				this.counter--;
				//console.log('count: '+this.counter);
				if(this.counter == 0) onFinish();
			};
		this.count = function(){
				this.counter++;
			};
	}();
}

QPanel.Add = function(placement, container, path, templateName, scriptArgs)
{
	return new QPanel.ExecutionChain(placement, container, path, templateName, scriptArgs);
}

/* SHORTCUT INSERT */

QPanel.AppendTo = function(container, path, templateName, scriptArgs)
{ return QPanel.Add('append', container, path, templateName, scriptArgs); }

QPanel.PrependTo = function(container, path, templateName, scriptArgs)
{ return QPanel.Add('prepend', container, path, templateName, scriptArgs); }

QPanel.InsertBefore = function(container, path, templateName, scriptArgs)
{ return QPanel.Add('before', container, path, templateName, scriptArgs); }

QPanel.InsertAfter = function(container, path, templateName, scriptArgs)
{ return QPanel.Add('after', container, path, templateName, scriptArgs); }