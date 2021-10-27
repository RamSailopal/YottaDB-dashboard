#!/bin/bash
mkdir /root/.ssh
cp -Rf /home/git/YottaDB-dashboard/Vista-Kubernetes/.ssh/* /root/.ssh
sed -i 's@#!/usr/bin/python@#!/usr/bin/python3@' /usr/local/YottaDB-dashboard/apiserver/apiserver.py
/home/nodevista/bin/entryCombo.sh
