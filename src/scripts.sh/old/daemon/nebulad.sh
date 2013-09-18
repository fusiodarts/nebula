#!/bin/bash

NEBUSR=$(whoami)
if [ "$NEBUSR" == "" -o "$NEBUSR" == "root" ]
then
  exit 1
fi

NEBDIR=$PWD
if [ "$1" != "" ]
then 
 NEBDIR=$1
fi

if [ ! -d "$NEBDIR" ]
then
  exit 2
fi
if [ ! -r "$NEBDIR/.nebauth" ]
then
  exit 3
fi
if [ ! -x "$NEBDIR/nebula_v2" ]
then
  exit 4
fi
if [ ! -x "$NEBDIR/fllite" ]
then
  exit 5
fi

cd $NEBDIR
NEBPORT=$(cat .nebauth | grep $NEBUSR | sed -n "s/.*:\(.*\)/\1/p")

if [ "$NEBPORT" == "" ]
then 
  exit 6
fi

$NEBDIR/nebula_v2 $NEBDIR/fllite $NEBPORT &

