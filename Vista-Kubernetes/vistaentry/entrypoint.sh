#!/bin/bash
mkdir /root/.ssh
cp -Rf /home/git/YottaDB-dashboard/Vista-Kubernetes/.ssh/* /root/.ssh
/home/nodevista/bin/entryCombo.sh
