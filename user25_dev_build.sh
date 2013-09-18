#!/bin/bash

# Example
# ./user25_dev_build.sh debug /opt/Qt4

CURDIR=$PWD

./build.sh $1 $2

if [ "$?" != "0" ]
then
  exit 1
fi

cd $CURDIR

cd src/gui_apps/user25
source setenv-nebula.profile
./nebula_build.sh

cd $CURDIR

