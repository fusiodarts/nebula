TEMPLATE = lib
TARGET = json

QT -= gui core
CONFIG -= qt debug
CONFIG += warn_off

DEPENDPATH += .
INCLUDEPATH += .
DESTDIR = ../../../AbanQ-Nebula/lib

HEADERS += arraylist.h \
           bits.h \
           config.h \
           debug.h \
           json.h \
           json_object.h \
           json_object_private.h \
           json_tokener.h \
           json_util.h \
           linkhash.h \
           printbuf.h
SOURCES += arraylist.c \
           debug.c \
           json_object.c \
           json_tokener.c \
           json_util.c \
           linkhash.c \
           printbuf.c
