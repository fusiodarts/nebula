TEMPLATE	= lib
CONFIG		+= qt warn_on release
CONFIG		+= staticlib
win32:CONFIG	+= static
CONFIG		-= dll
SOURCES		= qwidgetfactory.cpp \
		  ../shared/domtool.cpp \
		  ../shared/uib.cpp

HEADERS		= ../shared/domtool.h \
		  ../shared/uib.h

sql:SOURCES += 		  ../designer/database.cpp
sql:HEADERS +=		  ../designer/database2.h

DEFINES += QT_INTERNAL_XML
!win32-borland:DEFINES += Q_TEMPLATE_EXTERN=extern
include( ../../../src/qt_professional.pri )
TARGET		= qui
INCLUDEPATH	+= ../shared
DESTDIR		= ../../../lib
VERSION		= 1.0.0
DEFINES		+= RESOURCE

unix {
	target.path=$$libs.path

	INSTALLS        += target
}

mac:QMAKE_LFLAGS_PREBIND = -prebind -seg1addr 0xB9000000

unix {
        QMAKE_CFLAGS += $$QMAKE_CFLAGS_SHLIB
        QMAKE_CXXFLAGS += $$QMAKE_CXXFLAGS_SHLIB
}
