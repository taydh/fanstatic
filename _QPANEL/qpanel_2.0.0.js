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

QPanel.RegContent = function(path, templateName, next)
{
	var templateId = QPanel.GetTemplateId(path, templateName);
	
	if(QPanel.TemplateContents[templateId] === undefined){
		
		$.get(path + templateName + '.htm', function(content){
			QPanel.TemplateContents[templateId] = content;
			next();
		});
	}
	else{
		next();
	}
}

QPanel.RegScript = function(path, templateName, next)
{
	if(typeof window[templateName] !== 'function'){
		
		$.getScript(path + templateName + '.js', function(){
			if(typeof window[templateName] === 'function'){
				// success
			}
			else{
				console.log('Invalid function in Script ' + templateName + '!');
			}
			
			next();
		}).fail(function(){
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

// obsolete
QPanel.AddContentTo = function(container, path, templateName, next, counter)
{
	if(next === undefined || typeof next !== 'function'){
		next = function(){};
	}
	
	if(counter !== undefined) counter.count();
	
	var templateId = QPanel.GetTemplateId(path, templateName);

	QPanel.RegContent(path, templateName, function(){
		$('#'+container).append(QPanel.TemplateContents[templateId]);
		next();
		
		if(counter !== undefined) counter.done();
	});
}

// obsolete
QPanel.AddContentScriptTo = function(container, path, templateName, args, next, counter)
{
	if(next === undefined || typeof next !== 'function'){
		next = function(){};
	}
	
	if(counter !== undefined) counter.count();
			
	QPanel.RegContent(path, templateName, function(){
		
		QPanel.RegScript(path, templateName, function(){
		
			// create a "shadow DOM"
			var templateId = QPanel.GetTemplateId(path, templateName);
			var shadow = document.createElement('div');
			shadow.id = '_shadow_' + QPanel.GetTimeString();
			shadow.setAttribute('style','display:none');
			shadow.innerHTML = QPanel.TemplateContents[templateId];
			document.body.appendChild(shadow);
			
			// insert shadow dom as first arguments
			var params = [shadow.id, args];
			
			window[templateName].apply(this, params);
			
			$('#'+container).append(shadow.innerHTML);
			
			// remove shadow
			document.body.removeChild(shadow);
			
			next();
			
			if(counter !== undefined) counter.done();
		});
	});
}

// obsolete
QPanel.AddScriptOutputTo = function(container, path, templateName, args, next, counter)
{
	if(next === undefined || typeof next !== 'function'){
		next = function(){};
	}
	
	if(counter !== undefined) counter.count();
			
		
	QPanel.RegScript(path, templateName, function(){
		// create a "shadow DOM"
		var templateId = QPanel.GetTemplateId(path, templateName);
		var shadow = document.createElement('div');
		shadow.id = '_shadow_' + QPanel.GetTimeString();
		shadow.setAttribute('style','display:none');
		document.body.appendChild(shadow);
		
		// insert shadow dom as first arguments
		var params = [shadow.id, args];
		
		window[templateName].apply(this, params);
		
		$('#'+container).append(shadow.innerHTML);
		
		// remove shadow
		document.body.removeChild(shadow);
		
		next();
		
		if(counter !== undefined) counter.done();
	});
}

QPanel.CreateCounter = function(onFinish)
{
	return new function() 
	{
		this.counter = 0;
		this.done = function(){
				this.counter--;
				console.log('count: '+this.counter);
				if(this.counter == 0) onFinish();
			};
		this.count = function(){
				this.counter++;
			};
	}();
}