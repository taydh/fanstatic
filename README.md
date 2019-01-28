# QPanel
A (vanila) method to include HTML template and/or Javascript (need jquery and mustachejs)

## Version
There is no stable version yet, currently under experiment. Latest version is 2.1.0 for example in this Readme.

## Overview
In the spirit to easily build a smarter and reactive (well, yes) frontend web page, we thought that we could utilize client side (html+js) effectively by better handling a "client side template include".

So, we come up with a method to make it more simple. QPanel can be used either for dynamic or static web page. However, since it is ajax base include, it need to be run under web server and cannot be opened locally.

## Getting Started
Prepare the master HTML and the load the needed script.
Note that we need jquery and mustachejs as our foundation.
```
<html>
<head>
  <title>Test QPanel</title>
  <script src="/js/jquery.min.js"></script>
  <script src="/js/mustache.min.js"></script>
  <script src="/js/qpanel_2.1.0.js"></script>
</head>
<body>
  <div id="container"></div>
  
  <script>
    // init script
  </script>
</body>
</html>
```

Prepare the templates:

**Template Content**, term we use to identify the text part of the template

example: /templates/myname.htm
```
<div>
  Hello world, this is an example of a template content, my name is {{name}}.
</div>
```
The `name` variable would be replaced by script and template engine later on.

**Template Script**, term we use to identify the script part of the template

example: /templates/myname.js (name must be same)
```
var myname = function(shadowId, args)
{
  alert('hello world, this is an example of a template script');
  
  var shadow = $('#'+shadowId);
  var template = shadow.html();
  var output = Mustache.render(template, {name: 'John Doe'});
  shadow.html(output);
}
```

Then, in the init script of the master html, you can include the template with following functions:

Basic include:
```
QPanel.Include('append', 'container', './templates/', 'myname').done();
```

Or, you can using shortcut for placement:
```
QPanel.AppendTo('container', './templates/', 'myname').done();
QPanel.PrependTo('container', './templates/', 'myname').done();
QPanel.InsertBefore('container', './templates/', 'myname').done();
QPanel.InsertAfter('container', './templates/', 'myname').done();
```

## Features
There are several features that will be described later, such as:
- Template arguments
- Template request cached flag
- Different type of template loading (content-and-script, content-only, or script-only)
- Sequential asyncronous template include
- Sequential asyncronous include cleaning

## Test Page
A test page is alive at http://taydh.github.io/qpanel/test-2.1.0/

Thank you
