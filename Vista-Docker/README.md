# VISTA project dashboard

This folder contains an implementation of YottaDB Dashboard specifically for the VISTA project. More details of the project can be found here:

 http://vistadataproject.info/

To run, execute:

    docker-compose up

Then navigate to the dashboard by navigating to http://ipofdockerserver:3001

Enter the default username and password of **admin/admin** and then create a new password. On gaining access. Select the **Yottadb** dashboard.

Access the VISTA GUI by navigating to http://ipofdockerserver:9100. Select a canned query. 

You will then see the metrics change on the YottaDB dashboard.

# Vista Integration with theia IDE

![Alt text](theia-ide.PNG?raw=true "theia IDE")

The integrated Vista/Yottadb dashboard solution now integrates Theia IDE for code reference and amendment with a custom built mumps language support:

Theia project - https://theia-ide.org/

MUMPS extension used for language support - https://marketplace.visualstudio.com/items?itemName=dsilin.mumps

**Design -** 

![Alt text](Yottadb-dashboard.png?raw=true "Arch design")

A shared volume is created between the nodevista and theia containers and the code from nodevista is copied from /home/nodevista to the shared volume on initial, vanilla startup. this can take a few minutes. When the below message appears, the IDE is ready for use at http://ipofdockerserver:3002/#/home/vista-settings/Vista.theia-workspace

      yottadbdash_1  | Theia is now ready for use
      
So long as the shared volume is not deleted (i.e. the **-v** flag is not used when issuing **docker-compose down**), subsequent issues of **docker-compose up** will cause the IDE to be ready quicker as no code copying will take place.

Although code is referenced and modified in a shared volume, lsyncd is used to sync any modifications and track any changes against the original nodevista code files. An additional process then checks for any lsync actions and automatically compiles any mumps/GT.m code. The compilations can be viewed in real time by opening a terminal window. Clean compilations will display with blank spaces between node vista prompts i.e.

    Compiling routine FMQLFILT
    which: no icu-config in (/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/nodevista/lib/gtm)
   
    NODEVISTA>

    NODEVISTA>
    
Error compilations will display with the associated compliation error displayed between the prompts i.e.
 
    Compiling routine FMQLFILT
    which: no icu-config in (/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/nodevista/lib/gtm)
    
    NODEVISTA>
         fdsfsdf
         ^-----
                At column 2, line 25, source module /home/nodevista/p/FMQLFILT.m
    %GTM-E-INVCMD, Invalid command keyword encountered

    NODEVISTA>
    
    
# Access to GT.M from Theia IDE

Access is now available to the GT.M environment on the Vista/YottaDB-Dashboard container from the Theia IDE. Access is attained through tasks. 

Click **terminal** and then **Run task**, **GTM** and then **Contiunue without scanning the task output**. This will run a terminal window and "drop" you into a NODEVISTA prompt. Normal GT.M functionality, i.e. viewing globals can then be achieved.

**NOTE - The .ssh directory holds  ssh keys for demo/presentation purposes. Use fresh, confidential keys in a production setup.**


