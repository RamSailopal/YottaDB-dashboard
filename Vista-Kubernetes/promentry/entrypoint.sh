#!/bin/bash
cp /home/git/YottaDB-dashboard/Vista-Kubernetes/prometheus/* /opt/bitnami/prometheus/conf/
cd /opt/bitnami/prometheus
/opt/bitnami/prometheus/bin/prometheus --config.file=/opt/bitnami/prometheus/conf/prometheus.yml --storage.tsdb.path=/opt/bitnami/prometheus/data --web.console.libraries=/opt/bitnami/prometheus/conf/console_libraries --web.console.templates=/opt/bitnami/prometheus/conf/consoles
