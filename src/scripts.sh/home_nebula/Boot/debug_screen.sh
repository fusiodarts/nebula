#!/bin/bash

export DISPLAY=:88

CHROOT_DIR=/jail/chroots/i386-hardy
SCRIPTS_DIR=/home/nebula/Scripts

chroot $CHROOT_DIR /usr/bin/x11vnc -viewonly

