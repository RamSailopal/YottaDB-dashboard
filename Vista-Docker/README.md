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

Click **terminal** and then **Run task**, **GTM** and then **Continue without scanning the task output**. This will run a terminal window and "drop" you into a NODEVISTA prompt. Normal GT.M functionality, i.e. viewing globals can then be achieved.

**NOTE - The .ssh directory holds  ssh keys for demo/presentation purposes. Use fresh, confidential keys in a production setup.**

# iknow

An Intersystems iknow container has now been added to the stack to allow the natural language processing of text data from within VistA. Further details of iknow is available here - https://github.com/intersystems/iknow

The python iknowpy module allows nlp while mg_python allows python interaction with a YottaDB/GTm database, in this case VistA (further details of mg_python - https://github.com/chrisemunt/mg_python)

An example python script is available in the directory iknow, called nlp.py. This script takes the text stored in the node **^LAB("95.31", "6125", "10", "15", "0")** - **Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985**. It then hightlights and stores conceptual data. Each string is categorised into either **"Concept"** or **"NonRelevant or PathRelevant"**

To run the python script:

Open the workspace as instructed previously and create a new file called lnp.py. Copy and paste the text from 

Click **terminal** and then **Run task**, **GTM** and then **Continue without scanning the task output**. This will run a terminal window and "drop" you into the iknow container prompt. Type and execute:

    python3.8 /home/project/Vista/nlp.py
    
Then to see the global entries, access the nodevista/GT.m environment as instructed above and then list the NLP global:

    NODEVISTA>D ^%G


    Output device: <terminal>: 


    List ^NLP

    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","Fetal weight")="Concept"
    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","Roberts 1985")="Concept"
    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","abdominal circumference,")="Concept"
    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","biparietal diameter,")="Concept"
    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","femur length")="Concept"
    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","head circumference")="Concept"
    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","method")="Concept"
    ^NLP("Fetal weight estimated from abdominal circumference, biparietal diameter, femur length and head circumference by the method of Roberts 1985","the")="NonRelevant or PathRelevant"

    List ^


# Access to Code Changes

Any code is held in the shared docker volume hosted on the Docker host machine called **vistadocker_app-volume**. This can be accessed by executing the following command:

    docker volume inspect vistadocker_app-volume
    
    [
       {
           "Name": "vistadocker_app-volume",
           "Driver": "local",
           "Mountpoint": "/var/lib/docker/volumes/vistadocker_app-volume/_data",
           "Labels": null,
           "Scope": "local"
       }
    ]
    
 The code can then be referenced on the Docker host by running:
 
     ls -l /var/lib/docker/volumes/vistadocker_app-volume/_data
     
It is important to ensure that **docker-compose down** is used as opposed to **docker compose -v** to allow code persistence
    

    


