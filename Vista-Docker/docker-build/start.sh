#!/bin/bash
trap "/etc/init.d/nodevistavista stop" SIGTERM
echo "Starting xinetd"
/usr/sbin/xinetd
echo "Starting sshd"
/usr/sbin/sshd
echo "Starting YottaDB Dashboard processes"
cd /usr/local/YottaDB-Dashboard && /usr/local/YottaDB-Dashboard/install.sh "/home/nodevista/r"
/bin/bash -c 'source /home/nodevista/etc/env && export YOTTA_PROM_PORT=8083 && /usr/local/YottaDB-Dashboard/Vista-Docker/ydbdash.py &'
/bin/bash -c 'source /home/nodevista/etc/env && source /home/nodevista/etc/yottadbdash.env && /usr/local/YottaDB-Dashboard/apiserver/apiserver.py -l 0.0.0.0 -p 8082 &'
echo "Starting vista processes"
/etc/init.d/nodevistavista start
echo "Copying routines for Theia IDE"
/bin/bash -c '/home/nodevista/bin/rcopy.sh'
echo "Theia is now ready for use"
chmod ug+rw /home/nodevista/tmp/*
# Create a fifo so that bash can read from it to
# catch signals from docker
rm -f ~/fifo
mkfifo ~/fifo || exit
chmod 400 ~/fifo
read < ~/fifo
