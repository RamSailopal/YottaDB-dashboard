#!/bin/bash
if test -d /home/project
then 
   if ! test -d /home/project/Vista
   then
     mkdir /home/project/Vista
     cp -Rf /home/nodevista/p /home/project/Vista
     cp -Rf /home/nodevista/s /home/project/Vista
     cp -Rf /home/nodevista/r /home/project/Vista
     cp -Rf /home/nodevista/lib/gtm /home/project/Vista
     cp -Rf /home/nodevista/node_modules/nodem/src /home/project/Vista
     chmod -R o+w /home/project/*
     mkdir /home/project/log
   else
     rm -f /home/project/log/rcomp.log
   fi
   lsyncd /etc/lsyncd.conf
   echo "Starting routine compilation process" >> /home/project/log/rcomp.log
   /home/nodevista/bin/rcomp.sh &
fi
