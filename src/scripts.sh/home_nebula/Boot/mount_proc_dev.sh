#!/bin/bash

CHROOT_DIR=/jail/chroots/i386-hardy

IS_MOUNTED=$(mount | grep -o $CHROOT_DIR/dev)
if [ "$IS_MOUNTED" == "" ]
then
	IS_MOUNTED=$(mount | grep -o $CHROOT_DIR/proc)
fi

if [ "$IS_MOUNTED" == "" ]
then
	mount --bind /dev $CHROOT_DIR/dev
	mount -t proc none $CHROOT_DIR/proc
	echo "yes"
else
	echo "no"
fi

