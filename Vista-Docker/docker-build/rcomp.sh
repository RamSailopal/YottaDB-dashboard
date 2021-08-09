#!/bin/bash
source /home/nodevista/etc/env
tail -f /var/log/lsyncd/lsyncd.log | while read line
do
   rout=$(grep '^/.*\.m' <<< $line)
   if [[ "$rout" != "" ]]
   then
        rout=${rout:1}
        echo "Compiling routine ${rout%%.*}" >> /home/project/log/rcomp.log
        ydb <<< "ZL \"${rout%%.*}\"" >> /home/project/log/rcomp.log 2>&1
   fi
done

