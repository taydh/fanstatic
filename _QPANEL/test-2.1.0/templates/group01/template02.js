QPanel.Scripts.group01_template02 = function(shadowId, args)
{
	var shadow = $('#'+shadowId);
	var template = shadow.html();
	var output = Mustache.render(template, args);
	shadow.html(output);
}