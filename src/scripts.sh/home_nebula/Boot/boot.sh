#!/bin/bash

export DISPLAY=:88

CHROOT_DIR=/jail/chroots/i386-hardy
BOOT_DIR=$CHROOT_DIR/home/nebula/Boot
NEW_MOUNT=$($BOOT_DIR/mount_proc_dev.sh)
SCRIPTS_DIR=/home/nebula/Scripts

chroot $CHROOT_DIR /usr/bin/Xvfb $DISPLAY +bs -screen 0 1440x990x16 &

for i in $(cat $BOOT_DIR/active_users)
do
	chroot $CHROOT_DIR $SCRIPTS_DIR/exec_nebula_usr.sh $i &
done
	