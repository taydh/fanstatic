cat ../v2/fanstatic.js > ._combined.js
find ../v2 -type f -name 'ext.*' -exec cat {} + >> ._combined.js
uglifyjs ._combined.js -o ../v2/fanstatic-combined.min.js 

find -type f -name '._runstatic.js' -exec cat {} + >> ._combined.js
uglifyjs ._combined.js -o ../v2/runstatic-combined.min.js 