# Kubernetes

![Alt text](YottaDBDashboard-Kubernetes.png?raw=true "Vista Kubernetes")

This directory holds yaml files for deploying Vista/YottaDB Dashboard into a Kubernetes cluster.

The example vagrantfile, deploys the cluster into a single node MinKube cluster but deployment can easily be made to a Kubernetes cluster "in the cloud" by amending the volumes.yaml to reference cloud based storage.

The fact that GT.m/VistA relies to shared memory for inter process communication means that containers need shared memory and IPC. In Kubernetes, memory and IPC can only be shared across pods and not deployments. This means that GT.m/VistA cannot run across multiple Kubernetes nodes and so Kubernetes cannot horizontally scale deployments or provide any form of zero time fault tollerance. Unhealthy pods will be replaced but there will be a period of outage involved. 
