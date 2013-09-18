#!/bin/bash

CHROOT_DIR=/jail/chroots/i386-hardy
BOOT_DIR=$CHROOT_DIR/home/nebula/Boot
NEW_MOUNT=$($BOOT_DIR/mount_proc_dev.sh)

chroot $CHROOT_DIR

if [ "$NEW_MOUNT" == "yes" ]
then
	umount $CHROOT_DIR/dev
	umount $CHROOT_DIR/proc
fi
