TEMPLATE = subdirs

CONFIG  += ordered

#SUBDIRS	=  uic \
#	   uilib \
#	   designer \
#	   app

SUBDIRS	=  uic \
	   uilib

#dll:SUBDIRS *=  editor plugins
#shared:SUBDIRS *=  editor plugins
REQUIRES=full-config nocrosscompiler
