#!/bin/bash

CURDIR=$PWD

cd src/gui_apps/user25
source setenv-nebula.profile
./nebula_clean.sh

cd $CURDIR

./clean.sh

