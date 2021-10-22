#!/bin/bash
sudo mkdir /root/.ssh
sudo cp -Rf /home/git/YottaDB-dashboard/Vista-Kubernetes/.ssh/* /root/.ssh
sudo cp -Rf /home/git/YottaDB-dashboard/Vista-Kubernetes/.theia/* /home/theia/.theia
sudo mkdir /home/yottadb-settings
sudo cp -Rf /home/git/YottaDB-dashboard/Vista-Kubernetes/project/* /home/yottadb-settings
cd /home/theia
node /home/theia/src-gen/backend/main.js /home/project --hostname=0.0.0.0
