#!/bin/bash

if [ "$(whoami)" != "root" ]
then
	echo ""
	echo "Are you root?"
	echo ""
	exit 1
fi

if [ "$1" == "" -o "$2" == "" -o "$3" == "" ]
then
	echo ""
	echo "Usage: $0 username default_bd nebula_port"
	echo ""
	exit 1
fi
	
NEBULA_USR_DIR=/home/nebula/Users
SKEL_DIR=/home/nebula/Skel
HOME_USR=$NEBULA_USR_DIR/$1

if [ -d $HOME_USR ]
then
	echo ""
	echo "$HOME_USR already exists"
	echo ""
	exit 1
fi

mkdir $HOME_USR
chown $1:$1 $HOME_USR

adduser --home $HOME_USR --no-create-home --disabled-password -disabled-login $1

rm -vfR $HOME_USR/.bash*
rm -vfR $HOME_USR/.flxcache
rm -vfR $HOME_USR/.profile
rm -vfR $HOME_USR/.X*

cp -vfR $SKEL_DIR/.bash* $HOME_USR
cp -vfR $SKEL_DIR/.profile $HOME_USR
cp -vfR $SKEL_DIR/.qt $HOME_USR

sed "s/base_datos/$2/g" $SKEL_DIR/.qt/facturaluxrc > $HOME_USR/.qt/facturaluxrc

mkdir $HOME_USR/.flxcache

echo "$3" > $HOME_USR/.nebula_port

chown $1:$1 $HOME_USR
chown $1:$1 $HOME_USR/.??* -R
chmod go-rw $NEBULA_USR_DIR/*/

chattr +i $HOME_USR/.bash*
chattr +i $HOME_USR/.flxcache
chattr +i $HOME_USR/.profile
#chattr +i $HOME_USR/.qt/facturaluxrc
chattr +i $HOME_USR/.nebula_port
