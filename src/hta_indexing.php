<?php
/* compile sitemap.xml to ht_index.txt */
$stream = fopen(__DIR__.'/sitemap.xml', 'r');
$parser = xml_parser_create();
$in_URL = false;
$in_LOC = false;
$firstLine = true;

$startHandler = function($parser, $name, $attributes) { 
	global $in_URL, $in_LOC;
	
	if ('URL' == $name) {
		$in_URL = true;
	}
	else if ($in_URL && 'LOC' == $name) {
		$in_LOC = true;
	}
};

$endHandler = function($parser, $name) { 
	global $in_URL, $in_LOC;

	if ('URL' == $name) {
		$in_URL = false;
	}
	else if ('LOC' == $name) {
		$in_LOC = false;
	}
};

$characterData = function($parser, $data) { 
	global $in_URL, $in_LOC, $firstLine;

	if ($in_URL && $in_LOC) {
		echo (!$firstLine ? PHP_EOL : '') . trim($data) ;
		
		if ($firstLine) $firstLine = false;
	}
};

xml_set_element_handler($parser, $startHandler, $endHandler);
xml_set_character_data_handler($parser, $characterData); 

while (($data = fread($stream, 16384))) {
    xml_parse($parser, $data); // parse the current chunk
}

xml_parse($parser, '', true); // finalize parsing
xml_parser_free($parser);
fclose($stream);