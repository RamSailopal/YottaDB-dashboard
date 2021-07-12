#!/bin/bash
if [[ "$1" != "start" && "$1" != "stop" && "$1" != "status" ]]
then
	echo "Pass either start, stop or status as the first parameter"
	exit
fi
if [[ "$1" == "start" ]]
then
	if test -e apiserver.pid
        then
		echo "Process is already running as $(cat apiserver.pid)"
		exit
        fi
        if [[ "$YOTTA_API_PORT" == "" ]]
	then
		read -p "Please enter the port you wish the API server to run on? " port
                if [[ "$port" =~ [[:digit:]]{4,5} ]]
                then
			export YOTTA_API_PORT=$port
                else
			echo "Port must be 4 or 5 digits only"
			exit
		fi
        fi
        if [[ "$YOTTA_API_IP" == "" ]]
        then
                read -p "Please enter the IP you wish the API server to run on? " ip
                if [[ "$ip" =~ ([[:digit:]]{1,3}\.){3}[[:digit:]]{1,3} ]]
                then
                        export YOTTA_API_IP=$ip
                else
                        echo "IP address is in the wrong format"
                        exit
                fi
        fi

	nohup ./apiserver.py -l $YOTTA_API_IP -p $YOTTA_API_PORT </dev/null >/dev/null 2>&1 &
	echo $! > apiserver.pid

elif [[ "$1" == "stop" ]]
then
	if test -e apiserver.pid
        then
		kill -9 $(cat apiserver.pid)
                rm -f apiserver.pid
	else
		echo "Process is not running!!"
		exit
	fi
elif [[ "$1" == "status" ]]
then
        if test -e apiserver.pid
        then
                echo "Process is running as process $(cat apiserver.pid)"
		exit
        else
                echo "Process is not running!!"
                exit
        fi
fi

