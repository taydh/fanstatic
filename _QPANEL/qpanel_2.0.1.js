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

QPanel.RegScript = function(path, templateName, cached, next)
{
	if(typeof window[templateName] !== 'function'){
		
		$.ajax({
			url: (path + templateName + '.js'),
			dataType: "script",
			cache: cached,
			success: function(){
				if(typeof window[templateName] === 'function'){
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
		loadType: 'content-and-script', // content-only | content-and-script | script-only
		placement: 'append', // prepend | append | before | after
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

QPanel.AddTemplate = function(info)
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
		
		if(window[info.templateName] !== undefined){
			// insert shadow dom as first arguments
			var params = [shadow.id, info.scriptArgs];
			window[info.templateName].apply(this, params);
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
	case 'content-only':
		QPanel.RegContent(info.path, info.templateName, !info.useTrail, function(){
			var templateId = QPanel.GetTemplateId(info.path, info.templateName);
			
			switch(info.placement){
			case 'append': $('#'+info.container).append(QPanel.TemplateContents[templateId]); break;
			case 'prepend': $('#'+info.container).prepend(QPanel.TemplateContents[templateId]); break;
			case 'before': $('#'+info.container).before(QPanel.TemplateContents[templateId]); break;
			case 'after': $('#'+info.container).after(QPanel.TemplateContents[templateId]); break;
			default: 
				console.log('QPanel: unknown AddContent placement info "' + info.placement + '", append instead');
				$('#'+info.container).append(QPanel.TemplateContents[templateId]);
				break;
			}
		
			info.next();
			if(info.counter !== null) info.counter.done();
		});
		break;
	case 'content-and-script':
		QPanel.RegContent(info.path, info.templateName, !info.useTrail, function(){
			QPanel.RegScript(info.path, info.templateName, !info.useTrail, function(){
				applyScript(info);	
				info.next();
				if(info.counter !== null) info.counter.done();
			});
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

QPanel.AppendTo = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();
	
	info.container = container;
	info.path = path;
	info.templateName = templateName;

	if(scriptArgs === undefined){
		info.loadType = 'content-only';
	} else if(typeof scriptArgs === 'function'){
		info.loadType = 'content-only';
		if(next !== undefined) counter = next;
		next = scriptArgs;		
	}
	
	if(scriptArgs !== undefined) info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.placement = 'append';
	
	QPanel.AddTemplate(info);
}

QPanel.PrependTo = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();
	
	info.container = container;
	info.path = path;
	info.templateName = templateName;
	
	if(scriptArgs === undefined){
		info.loadType = 'content-only';
	} else if(typeof scriptArgs === 'function'){
		info.loadType = 'content-only';
		if(next !== undefined) counter = next;
		next = scriptArgs;
	}
	
	if(scriptArgs !== undefined) info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.placement = 'prepend';
	QPanel.AddTemplate(info);
}

QPanel.InsertBefore = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();

	info.container = container;
	info.path = path;
	info.templateName = templateName;
	
	if(scriptArgs === undefined){
		info.loadType = 'content-only';
	} else if(typeof scriptArgs === 'function'){
		info.loadType = 'content-only';
		if(next !== undefined) counter = next;
		next = scriptArgs;
	}
	
	if(scriptArgs !== undefined) info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.placement = 'before';
	QPanel.AddTemplate(info);
}

QPanel.InsertAfter = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();

	info.container = container;
	info.path = path;
	info.templateName = templateName;
	
	if(scriptArgs === undefined){
		info.loadType = 'content-only';
	} else if(typeof scriptArgs === 'function'){
		info.loadType = 'content-only';
		if(next !== undefined) counter = next;
		next = scriptArgs;
	}
	
	if(scriptArgs !== undefined) info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.placement = 'after';
	QPanel.AddTemplate(info);
}

QPanel.AppendScriptTo = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();

	info.container = container;
	info.path = path;
	info.templateName = templateName;
	info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.loadType = 'script-only';
	info.placement = 'append';
	QPanel.AddTemplate(info);
}

QPanel.PrependScriptTo = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();

	info.container = container;
	info.path = path;
	info.templateName = templateName;
	info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.loadType = 'script-only';
	info.placement = 'prepend';
	QPanel.AddTemplate(info);
}

QPanel.InsertScriptBefore = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();
	
	info.container = container;
	info.path = path;
	info.templateName = templateName;
	info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.loadType = 'script-only';
	info.placement = 'before';
	QPanel.AddTemplate(info);
}

QPanel.InsertScriptAfter = function(container, path, templateName, scriptArgs, next, counter, _useTrail)
{
	var info = QPanel.GetAddTemplateInfoDefault();
	
	info.container = container;
	info.path = path;
	info.templateName = templateName;
	info.scriptArgs = scriptArgs;
	if(next !== undefined) info.next = next;
	if(counter !== undefined) info.counter = counter;
	
	if(_useTrail !== undefined) info.useTrail = _useTrail;
	
	info.loadType = 'script-only';
	info.placement = 'append';
	QPanel.AddTemplate(info);
}

QPanel.FreshAppendTo = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.AppendTo(container, path, templateName, scriptArgs, next, counter, true);
}

QPanel.FreshPrependTo = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.PrependTo(container, path, templateName, scriptArgs, next, counter, true);
}

QPanel.FreshInsertBefore = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.InsertBefore(container, path, templateName, scriptArgs, next, counter, true);
}

QPanel.FreshInsertAfter = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.InsertAfter(container, path, templateName, scriptArgs, next, counter, true);
}

QPanel.FreshAppendScriptTo = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.AppendScriptTo(container, path, templateName, scriptArgs, next, counter, true);
}

QPanel.FreshPrependScriptTo = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.PrependScriptTo(container, path, templateName, scriptArgs, next, counter, true);
}

QPanel.FreshInsertScriptBefore = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.InsertScriptBefore(container, path, templateName, scriptArgs, next, counter, true);
}

QPanel.FreshInsertScriptAfter = function(container, path, templateName, scriptArgs, next, counter)
{
	QPanel.InsertScriptAfter(container, path, templateName, scriptArgs, next, counter, true);
}

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