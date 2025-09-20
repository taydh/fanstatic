QPanel.Scripts.group01_template03 = function(shadowId, args)
{
	var template = '<div>group01/template03: So, this is where I am. Writing ' + args.data + '</div>';
	var shadow = $('#'+shadowId);
	shadow.html(template);
}