#!/bin/bash
trap "/etc/init.d/nodevistavista stop" SIGTERM
echo "Starting xinetd"
/usr/sbin/xinetd
echo "Starting sshd"
/usr/sbin/sshd
cd /usr/local/YottaDB-Dashboard && /usr/local/YottaDB-Dashboard/install.sh "/home/nodevista/r"
/bin/bash -c 'source /home/nodevista/etc/env && export YOTTA_PROM_PORT=8083 && /usr/local/YottaDB-Dashboard/Vista-Docker/ydbdash.py &'
echo "Starting vista processes"
/etc/init.d/nodevistavista start
chmod ug+rw /home/nodevista/tmp/*
# Create a fifo so that bash can read from it to
# catch signals from docker
rm -f ~/fifo
mkfifo ~/fifo || exit
chmod 400 ~/fifo
read < ~/fifo
