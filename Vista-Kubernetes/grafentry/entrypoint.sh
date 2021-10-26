cp -Rf /home/git/YottaDB-dashboard/Vista-Kubernetes/provisioning/* /etc/grafana/provisioning
export PATH="/usr/share/grafana/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export GF_PATHS_CONFIG="/etc/grafana/grafana.ini"
export GF_PATHS_DATA="/var/lib/grafana"
export GF_PATHS_HOME="/usr/share/grafana"
export GF_PATHS_LOGS="/var/log/grafana"
export GF_PATHS_PLUGINS="/var/lib/grafana/plugins"
export GF_PATHS_PROVISIONING="/etc/grafana/provisioning"
cd /
./run.sh
