<?php
/* compare provided path to list */
$z = explode("\n", file_get_contents(__DIR__.'/hta_index__'.$_GET['i'].'.txt'));
if (in_array($_GET['a'], $z) || (str_ends_with($_GET['a'], '/') ? in_array(substr($_GET['a'],0,-1), $z) : false)) {
	echo file_get_contents(__DIR__.'/../index.html');
}
else {
	http_response_code(404);
	echo file_get_contents(__DIR__.'/../404.html');
}