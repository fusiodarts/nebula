#!/bin/bash

make clean
make distclean

rm -vf  src/aqwebserver/webroot/nebula_lib.js

find . -name "AbanQ-Nebula" -exec rm -vfr \{\} \;
find . -name "*~" -exec rm -vf \{\} \;
find . -name "*.bak" -exec rm -vf \{\} \;
find . -name "*.old" -exec rm -vf \{\} \;

if [ "$1" != "" ]
then
  find $1 -name "AbanQ-Nebula" -exec rm -vfr \{\} \;
	find $1 -name "*~" -exec rm -vf \{\} \;
	find $1 -name "*.bak" -exec rm -vf \{\} \;
	find $1 -name "*.old" -exec rm -vf \{\} \;
fi

rm -f clean
rm -f nebula_settings.pro

svn up
