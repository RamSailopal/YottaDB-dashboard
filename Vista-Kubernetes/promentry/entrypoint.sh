#!/bin/bash
cp /home/git/YottaDB-dashboard/Vista-Kubernetes/prometheus/* /opt/bitnami/prometheus/conf
cd /opt/bitnami/prometheus
/opt/bitnami/prometheus/bin/prometheus
