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
		echo "Process is already running as $(cat globview.pid)"
		exit
        elif [[ "$glbviewport" == "" ]]
	then
		read -p "Please enter the port you wish the Global Viewer to run on? " port
                if [[ "$port" =~ [[:digit:]]{4,5} ]]
                then
			export glbviewport=$port
                else
			echo "Port must be 4 or 5 digits only"
			exit
	  	fi
        fi
        if [[ "$glbviewadd" == "" ]]
        then
                read -p "Please enter the network address of this server? " add
                if [[ "$port" =~ [[[:digit:]]{1,3}\.]{3}[[:digit:]]{1,3} ]]
                then
                        export glbviewadd=$add
                else
                        echo "Address must be in the correct format"
                        exit
                fi
        fi
	nohup ./globview.py -l 0.0.0.0 -p $glbviewport </dev/null >/dev/null 2>&1 &
	echo $! > globview.pid

elif [[ "$1" == "stop" ]]
then
	if test -e globview.pid
        then
		kill -9 $(cat globview.pid)
                rm -f globview.pid
	else
		echo "Process is not running!!"
		exit
	fi
elif [[ "$1" == "status" ]]
then
        if test -e globview.pid
        then
                echo "Process is running as process $(cat globview.pid)"
		exit
        else
                echo "Process is not running!!"
                exit
        fi
fi

