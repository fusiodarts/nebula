#!/bin/bash

# Example
# ./build.sh debug /opt/Qt4

CURDIR=$PWD
QT4_DIR="/opt/Qt4"
BUILD_MODE="release"

if [ "$1" != "" ]
then
  BUILD_MODE=$1
fi

if [ "$BUILD_MODE" != "debug" -a "$BUILD_MODE" != "release" -a "$BUILD_MODE" != "verbose" -a "$BUILD_MODE" != "advanced" ]
then
  echo ""
  echo " ERROR: Modo incorrecto (primer argumento), posibles valores: debug verbose release advanced"
  echo ""
  exit 1
fi

if [ "$2" != "" ]
then
  QT4_DIR=$2
fi

EXE_QMAKE=$QT4_DIR/bin/qmake

if [ ! -x $EXE_QMAKE ]
then
  echo "" 
  echo " ERROR: $EXE_QMAKE no encontrado o no se puede ejecutar"
  echo ""
  exit 1
fi

echo "" 
echo "Qt4  : $QT4_DIR"
echo "qmake: $EXE_QMAKE"

cd src/aqwebserver/webroot/compiler/

if [ "$BUILD_MODE" == "debug" ]
then
  echo "Build: DEBUG MODE"
  echo "" 
  ./build_debug.sh
  echo "DEFINES *= AQ_ENABLE_DEBUG" >> $CURDIR/nebula_settings.pro
  echo "DEFINES *= AQ_NEBULA_BUILD_VERBOSE" >> $CURDIR/nebula_settings.pro
fi

if [ "$BUILD_MODE" == "verbose" ]
then
  echo "Build: VERBOSE DEBUG MODE"
  echo "" 
  ./build_debug.sh
  echo "DEFINES *= AQ_ENABLE_DEBUG" >> $CURDIR/nebula_settings.pro
  echo "DEFINES *= AQ_VERBOSE" >> $CURDIR/nebula_settings.pro
  echo "DEFINES *= AQ_NEBULA_BUILD_VERBOSE" >> $CURDIR/nebula_settings.pro
fi

if [ "$BUILD_MODE" == "release" ]
then
  echo "Build: RELEASE MODE"
  echo "" 
  ./build_simple.sh
  echo "DEFINES *= AQ_ENABLE_DEBUG" >> $CURDIR/nebula_settings.pro
fi

if [ "$BUILD_MODE" == "advanced" ]
then
  echo "Build: ADVANCED RELEASE MODE"
  echo "" 
  ./build_advanced.sh
  echo "DEFINES *= AQ_ENABLE_DEBUG" >> $CURDIR/nebula_settings.pro
fi

export QTDIR=$QT4_DIR
export PATH=$QTDIR/bin:$PATH
export LD_LIBRARY_PATH=$QTDIR/lib:$LD_LIBRARY_PATH

cd $CURDIR
make distclean 
$EXE_QMAKE -spec linux-g++-32
make

