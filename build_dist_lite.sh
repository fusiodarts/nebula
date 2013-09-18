#!/bin/bash

# Example
# ./build_dist_lite.sh $HOME/AbanQ-Nebula /opt/Qt4

CURDIR=$PWD
INST_DIR=$1
QT4_DIR="/opt/Qt4"

if [ "$2" != "" ]
then
  QT4_DIR=$2
fi

./build.sh release $QT4_DIR
#./build.sh debug $QT4_DIR

cd src/gui_apps/lite
./nebula_build.sh $INST_DIR

cd $CURDIR
mkdir inst_work
cp -fvr $INST_DIR/* inst_work/
cd src/gui_apps/lite
./nebula_clean.sh

cd $CURDIR
rm -fr $INST_DIR/* 
mkdir $INST_DIR/bin

cp -fv inst_work/bin/fllite $INST_DIR/bin
cp -fv AbanQ-Nebula/bin/nebula_v2 $INST_DIR/bin

cp -fvr inst_work/lib $INST_DIR
cp -fvr inst_work/plugins $INST_DIR
cp -fvr inst_work/share $INST_DIR

cp -Ppva AbanQ-Nebula/lib/lib* $INST_DIR/lib
cp -fv $QT4_DIR/lib/libQtCore.so.4 $INST_DIR/lib
cp -fv $QT4_DIR/lib/libQtGui.so.4 $INST_DIR/lib
cp -fv $QT4_DIR/lib/libQtNetwork.so.4 $INST_DIR/lib

rm -fv $INST_DIR/lib/*.prl
rm -fv $INST_DIR/lib/*.a
rm -fv $INST_DIR/lib/*.la
rm -fvr $INST_DIR/lib/pkgconfig

rm -fr inst_work
./clean.sh

strip --strip-unneeded $INST_DIR/bin/*
strip --strip-unneeded $INST_DIR/lib/*

rm -fv $INST_DIR/share/facturalux/translations/sys.untranslated.ts
rm -fv $INST_DIR/share/facturalux/translations/sys.en.ts
rm -fv $INST_DIR/share/facturalux/translations/sys.gl.ts
rm -fv $INST_DIR/share/facturalux/translations/sys.it.ts

cp -fv src/scripts.sh/daemon/nebulad.sh $INST_DIR/bin
cp -fv src/scripts.sh/daemon/.nebauth $INST_DIR/bin

