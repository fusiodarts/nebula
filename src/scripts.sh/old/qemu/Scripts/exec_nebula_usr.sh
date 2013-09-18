#!/bin/bash

if [ "$(whoami)" != "root" ]
then
        echo ""
        echo "Are you root?"
        echo ""
        exit 1
fi

if [ "$1" == "" ]
then
        echo ""
        echo "Usage: $0 username"
        echo ""
        exit 1
fi

su -c '/opt/Nebula/bin/nebula_v2 /opt/Nebula/bin/fllite $(cat ~/.nebula_port)' - $1
