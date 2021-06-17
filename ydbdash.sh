#!/bin/bash
if [[ "$1" != "start" && "$1" != "stop" && "$1" != "status" ]]
then
	echo "Pass either start, stop or status as the first parameter"
	exit
fi
if [[ "$1" == "start" ]]
then
	if test -e ydbstat.pid
        then
		echo "Process is already running as $(cat ydbdash.pid)"
		exit
        elif [[ "$YOTTA_PROM_PORT" == "" ]]
	then
		read -p "Please enter the port you wish the Prometheus scraper ro run on? " port
                if [[ "$port" =~ [[:digit:]]{4,5} ]]
                then
			export YOTTA_PROM_PORT=$port
                else
			echo "Port must be 4 or 5 digits only"
			exit
		fi
	fi
	nohup ./ydbdash.py </dev/null >/dev/null 2>&1 &
	echo $! > ydbdash.pid

elif [[ "$1" == "stop" ]]
then
	if test -e ydbdash.pid
        then
		kill -9 $(cat ydbdash.pid)
                rm -f ydbdash.pid
	else
		echo "Process is not running!!"
		exit
	fi
elif [[ "$1" == "status" ]]
then
        if test -e ydbdash.pid
        then
                echo "Process is running as process $(cat ydbdash.pid)"
		exit
        else
                echo "Process is not running!!"
                exit
        fi
fi

