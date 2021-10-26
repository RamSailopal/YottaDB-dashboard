cp -Rf /home/git/YottaDB-dashboard/Vista-Kubernetes/provisioning/* /etc/grafana/provisioning
chown -R grafana /var/lib/grafana
cd /usr/share/grafana
./run.sh
