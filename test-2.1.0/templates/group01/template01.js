QPanel.Scripts.group01_template01 = function(shadowId, args)
{
	var shadow = $('#'+shadowId);
	var template = shadow.html();
	var output = Mustache.render(template, {greeting: 'Good Morning'});
	shadow.html(output);
}