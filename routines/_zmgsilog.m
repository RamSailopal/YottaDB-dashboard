START(FIL)
 S FIL="/var/log/mgsi.log"
 F  D
 . O FIL:(append)
 . S STRT=$G(^%zmgsitrk(1))
 . I STRT="" S STRT=""
 . E  I '$D(^%zmgsi("log",STRT)) S STRT=""
 . F  S STRT=$O(^%zmgsi("log",STRT)) Q:STRT=""  D
 .. S ^%zmgsitrk(1)=STRT
 .. S CNT=""
 .. F  S CNT=$O(^%zmgsi("log",STRT,CNT)) Q:CNT=""  D
 ...U FIL W !,$G(^%zmgsi("log",STRT,CNT))
 . C FIL
 . H 30
 QUIT
DAEMON
 J START Q

