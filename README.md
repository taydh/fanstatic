# QPanel
A method to include HTML template and/or Javascript (need jquery and mustachejs)

## Version
There is no stable version yet, currently under experiment.

## Overview
In the spirit to easily build a smarter frontend web page using only HTML and Javascript (client side)
we come up with this method to made html and javascript include (hopefully) more simple.
It can be used either for dynamic or static web page (an ajax-static, so it need to be run under web server and cannot be opened locally).

## Getting Started
Prepare the templates
- Template Content (term we use to identify the text part of the template)
- Template Script (term we use to identify the script part of the template)

Prepare the script loader
- Load JQuery library in &lt;head&gt;
- Load MustacheJS library in &lt;head&gt;
- Load QPanel library in &lt;head&gt;

Include the template with following functions

Simple include:
```
QPanel.Include(placement, container, path, templateName).done();
```

Or, you can using shortcut for placement:
```
QPanel.AppendTo(container, path, templateName, scriptArguments).done();
QPanel.PrependTo(container, path, templateName, scriptArguments).done();
QPanel.InsertBefore(container, path, templateName, scriptArguments).done();
QPanel.InsertAfter(container, path, templateName, scriptArguments).done();
```

Thank you
