# con dock
#java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --warning_level QUIET --externs ./externs.js \
#--js ../lib/sessionhandler.js --js ../lib/canvashtmlpaintengine.js --js ../lib/drawutils.js \
#--js ../lib/uploader.js --js ../lib/dock.js --js ../lib/widgetelement.js \
#--js ../lib/networkmonitor.js --js ../lib/eventhandler.js \
#--js_output_file ../nebula_lib.js

#sin dock
java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --warning_level QUIET --externs ./externs.js \
--js ../lib/sessionhandler.js --js ../lib/canvashtmlpaintengine.js --js ../lib/drawutils.js \
--js ../lib/uploader.js --js ../lib/widgetelement.js \
--js ../lib/networkmonitor.js --js ../lib/eventhandler.js \
--js_output_file ../nebula_lib.js
