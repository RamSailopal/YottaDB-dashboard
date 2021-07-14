# YottaDB-dashboard


# Background


![Alt text](yottadb-graf.PNG?raw=true "YottaDB Dashboard")

The code in this repo allows for the integration of a YottaDB environment with Prometheus/Grafana.

This solution harnesses the gvstat routine to provide performance metrics about the running YottaDB environment

More details about gvstat can be found here:

https://gitlab.com/YottaDB/Util/YDBGvstat/-/blob/master/gvstat.m


# Metrics Available

The built in YottaDB metrics listed here https://docs.yottadb.com/ProgrammersGuide/commands.html#zshow

**Free** - Total Free space

**Total_Space** - Total space

**Perc_Free** - Percentage Free Space

Further details - https://docs.yottadb.com/ProgrammersGuide/utility.html#freecnt

**procs** - Total number of Yottadb processes

**globs** - Total number of globals

**routs** - Total number of routines

**journsp** - Total space taken by journal files in bytes (requires environmental variable yotta_dir to be set i.e. export yotta_dir="/root/.yottadb/V6.3-008_x86_64")

**journnum** - Total number of journal files (requires environmental variable yotta_dir to be set i.e. export yotta_dir="/root/.yottadb/V6.3-008_x86_64")

**sysspace** - Percentage use of the file system used by Yottadb

**dbspace** - Database size in bytes (requires environmental variable yotta_dir to be set i.e. export yotta_dir="/root/.yottadb/V6.3-008_x86_64")

**netproc** - Number of YottaDB network processes

**vmem** - Total amount of virtual memory consumed by all Yottadb processes in bytes.

**lavg1** - Load average over 1 minute

**lavg5** - Load average over 5 minutes

**lavg15** - Load average over 15 minutes

**dskutil_...** - % Disk utilisation metrics per second for each disk on the system

**locks** - Number of global locks active - Needs environmental variable **yotta_instdir** set to the installation directory i.e. **/usr/local/yottadb**, **ydb_gbldir** set the path of the gld file i.e. **/root/.yottadb/r1.30_x86_64/g/yottadb**, **ydb_dir** set to  root directory of globals directory i.e. **/root/.yottadb** and finally **ydb_rel** set to  version number i.e. **r1.30_x86_64**

**rlines** - Total number of routine lines (requires environmental variable yotta_dir to be set i.e. export yotta_dir="/root/.yottadb/V6.3-008_x86_64")

**rchange** - Total number of routines modified in the last 5 minutes (requires environmental variable yotta_dir to be set i.e. export yotta_dir="/root/.yottadb/V6.3-008_x86_64")

# Prerequisites

It is assumed that you have a functioning deployment of both Prometheus and Grafana with Prometheus able to "scape" metrics and Grafana able to see the scraped metrics through the Prometheus plugin.

The Prometheus-client Python library will also be required:

https://pypi.org/project/prometheus-client

Ensure that the ydb executable is executable via the system path and so ensure that there is a symbolic link between the localised executable and one of the system paths i.e.

    ln -s /usr/local/yottadb/ydb /usr/local/bin/ydb


# Installation and Operation

    git clone https://github.com/RamSailopal/YottaDB-dashboard.git
    cd YottaDB-dashboard
    ./install.sh "<path to yottadb routines directory>"
    
Run the prometheus web scraper process with:
   
    ./ydbdash.sh start
   
This will ask you for the port to run the scraper on. To avoid this question, set the environmental variable YOTTA_PROM_PORT to the port required i.e.

    export YOTTA_PROM_PORT="8001"

Additionally, a region can be selected by setting YOTTA_PROM_REG. Without this set, the region is set to DEFAULT.
    
The scraper process can later be stopped by passing the parameter "stop". The status of the process can also be observed with "status"
    


Add the contents of prometheus.yml to your existing Prometheus configuration, changing the target address and port accordingly
     
A demonstation routines to show spikes in GET and SET metric is available in the examples directory, to install:

     cp examples/TESTROUT.m "<path to yottadb routines directory>"
     ZLINK "TESTROUT.m"
    
Run the demonstration routine from within ydb:

     D GET^TESTROUT(50000)
     
The deomonstration example above will create 50000 GET calls and chart that will show in Grafana


# Grafana

An example dashboard showing metrics relating to global sets, gets and orders (example image above) can be shown by importing the dashboard file examples/Yottadb-grafana.json directly from the Grafana UI.

These are just 3 of the metrics that are scraped by Prometheus. Details of the full range of metrics can be found under the MNEMONICS/DESCRIPTION section here:

https://docs.yottadb.com/ProgrammersGuide/commands.html#zshow

Further details about adding further metrics are available in the Wiki

Both accumulated metric (designated with suffix _acc) over time for each stat as well as point in time statistics (designated with suffix _pit) will be shown.


# Log file analytics

Those wishing to view the log files created by YottaDB within Grafana can optionally add the data from promtail.yaml to the existing Promtail configuration file. The log messages (prefixed with YDB-I, W, E and F ) can then be viewed with the Loki datasource and by selecting the Activity label.

Further details about YottaDB syslog messaging can be found here - https://docs.yottadb.com/AdminOpsGuide/monitoring.html

It is assumed that instances of both Loki and Promtail are already running and that the Loki plugin is installed in Grafana.

A dashboard in JSON format that additionally includes FREECNT and system logs from YottaDB is available from examples/Yottadb-graf-loki.yaml 

![Alt text](yottadb-graf2.PNG?raw=true "YottaDB Dashboard")

Additional integration with M-Gateway (MGSI) logs is also now available. Please see the Wiki for more details - https://github.com/RamSailopal/yotta-dashboard/wiki

The solution runs an M daemon routine that periodically pulls additions to the %zmgsi("logs" global entries and appends them to /var/log/mgsi.log. The log file is then processed by Promtail.

Further details about the M Gateway service integration gateway are available here - https://github.com/chrisemunt/mgsi

# API data processing

A second dashboard is now available that utilised the Grafana infinity datasource to consume API endpoints that expose details about the YottaDB environment:

![Alt text](yattadb-dash2.PNG?raw=true "YottaDB Dashboard2")

To run:

     cd apiserver
     ./apiserver.sh start
     
Similar to ydbdash.sh,  the following environmental variable will need setting before running:

 1) **YOTTA_API_PORT** - The port for run the YottaDB api process on
 2) **YOTTA_API_IP** - The IP address on which to run the api process
 3) **yotta_dir** - The data directory for Yottadb
 4) **yotta_instdir** - The installation directory for YottaDB i.e. **/usr/local/yottadb**
 5) **ydb_gbldir** - The path of the gld file i.e. **/root/.yottadb/r1.30_x86_64/g/yottadb**
 6) **ydb_dir** - The root directory of the globals directory i.e. **/root/.yottadb**
 7) **ydb_rel** - The version number i.e. **r1.30_x86_64**

The process will expose a nmber of different end points that return data in JSON format:

**/routines** - A list of routines in the YottaDB environment

**/globals** - A list of globals in the YottaDB environment

**/locks** - A list of global locks currently active in the YottaDB environment

**/version** - Version information about the YottaDB environment

**/journals** - A list of journals currently active for the system showing filename and size in bytes

**/blog** - The last 5 news feeds titles from the official YottaDB website blog



# Stack setup

A step by step guide on building the tech stack is found on the wiki - https://github.com/RamSailopal/yotta-dashboard/wiki

**An Ansible playbook is also available in the Ansible folder**

Process for installation with ansible:

Set up a vanilla Linux server and install Ansible

Run:

    ansible-galaxy install ramsailopal.yottadb ramsailopal.yottadb_nodejs ramsailopal.yottadb_dashboard_role patrickjahns.promtail cloudalchemy.grafana cloudalchemy.prometheus
    ansible-galaxy collection install community.grafana
    
Add the following entries to **/etc/ansible/hosts**

    [localhost]
    127.0.0.1

Then run the playbook:

     cd Ansible
     ansible-playbook -e grafhost="192.168.240.50" -e grafpass="test" -e dashport="8001" -e repodir="/usr/local/YottaDB-dashboard" -e mgateway="yes" -e force="Yes" install.yaml
     
Where:

**grafhost** is the IP address to access the Grafana GUI

**grafpass** is the admin account (username admin) password

**dashport** is the port on which the YottaDB metric service is running

**repodir** is the LOCAL YottaDB-dashboard directory

**mgateway** is whether you want metrics for the M-Gateway service

**force** is whether to force the install of YottaDB on older versions of Linux


# Quick Setup of full stack with Vagrant integrated with Ansible

Steps:

1. Install Oracle Virtual Box - https://www.virtualbox.org/wiki/Downloads
2. Install Hashicorp Vagrant - https://www.vagrantup.com/downloads
3. Create a new directory in the Vagrant installation directory (**C:\HashiCorp** on Windows **/opt/vagrant** on Linux)
4. Create a file in the new directory called **Vagrantfile** and copy and paste the contents from https://raw.githubusercontent.com/RamSailopal/YottaDB-dashboard/main/Vagrant/Vagrantfile
5. Issue the command **vagrant up** from the Linux command line/Windows command prompt/Powershell prompt from within this directory
6. When Vagrant has finished provisioning the stack, navigate to http://127.0.0.1:3000/d/Pga70YCMk/yottadb?orgId=1&from=now-15m&to=now&refresh=5s and then login with:

   **username: admin**
   
   **password: test**
   
# Provisioning with Docker and Docker Compose

      cd Docker
   
      export yottadatadir="\<path to yottadb data directory\>"
   
      docker compose -d up
    
 Log into the Grafana server at http://\<docker server IP address\>:3001
    
 Login with:
    
   **username: admin**
   
   **password: admin**
    
 Create a new password
    
 Select the Yottadb dashboard
    
 To attain demo metrics, run:
 
     docker run --rm -v "$yottadatadir:/data" -i yottadb/yottadb-base /opt/yottadb/current/ydb <<< 'F I=1:1:10000 S ^TEST("COUNT")=I'
    
     docker run --rm -v "$yottadatadir:/data" -i yottadb/yottadb-base /opt/yottadb/current/ydb <<< 'F I=1:1:10000 W !,^TEST("COUNT")'
     
 **Note: The docker implementation shows "built in" yottadb metrics only and doesn't implement Promtail and Loki for log file processing**
