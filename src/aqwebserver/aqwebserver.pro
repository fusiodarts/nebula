exists(../../nebula_settings.pro):include(../../nebula_settings.pro)
TEMPLATE = lib
TARGET = aqwebserver
QT += network

# QT -= gui
CONFIG += warn_off \
    console
#DEFINES += AQ_ENABLE_DEBUG
DEPENDPATH += .
INCLUDEPATH += . \
    ../3rdparty/json
DESTDIR = ../../AbanQ-Nebula/lib
LIBS += -L../../AbanQ-Nebula/lib \
    -ljson
HEADERS += FileServer.h \
    GuiWebProxy.h \
    WebApplication.h \
    AQWebServer.h \
    EventQueue.h \
    EventHandler.h \
    WebServer.h
SOURCES += FileServer.cpp \
    GuiWebProxy.cpp \
    WebApplication.cpp \
    EventQueue.cpp \
    EventHandler.cpp \
    WebServer.cpp \
    inflate_base64.c
RESOURCES += webroot/webroot.qrc \
    ../3rdparty/dojo/dojo.qrc
