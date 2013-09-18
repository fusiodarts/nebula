TEMPLATE = app
TARGET = nebula_v2

QT += network
#QT -= gui
CONFIG += warn_off \
    console

DEPENDPATH += .
INCLUDEPATH += . ../aqwebserver
DESTDIR = ../../AbanQ-Nebula/bin
LIBS += -L../../AbanQ-Nebula/lib -ljson -laqwebserver

SOURCES += main.cpp

QMAKE_LFLAGS += -Wl,-rpath,../lib
