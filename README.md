# yotta-dashboard


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

**dbspace** - Database size (in bytes)



# Prerequisites

It is assumed that you have a functioning deployment of both Prometheus and Grafana with Prometheus able to "scape" metrics and Grafana able to see the scraped metrics through the Prometheus plugin.

The Prometheus-client Python library will also be required:

https://pypi.org/project/prometheus-client

Ensure that the ydb executable is executable via the system path and so ensure that there is a symbolic link between the localised executable and one of the system paths i.e.

    ln -s /usr/local/yottadb/ydb /usr/local/bin/ydb


# Installation and Operation

    git clone https://github.com/RamSailopal/yotta-dashboard.git
    cd yotta-dashboard
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


# Stack setup

A step by step guide on building the tech stack is found on the wiki - https://github.com/RamSailopal/yotta-dashboard/wiki

