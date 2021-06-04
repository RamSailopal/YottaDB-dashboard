;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;								;
; Copyright (c) 2018 YottaDB LLC and/or its subsidiaries.	;
; All rights reserved.						;
;								;
;	This source code contains the intellectual property	;
;	of its copyright holder(s), and is made available	;
;	under a license.  If you do not know the terms of	;
;	the license, please stop and do not read further.	;
;								;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;
; Revision History:
; Version  Date                Author                            Summary
;   0.1    April 6, 2017       K.S. Bhaskar			 Original version
;   0.11   April 7, 2017       K.S. Bhaskar			 Make gatherdb work correctly; bug fixes in edge cases
;   0.12   July 17, 2018       K.S. Bhaskar			 Fix comment about time formats accepted by $$FUNC^%TI(); remove redundant set
;   0.13   July 27, 2018       K.S. Bhaskar			 Revision history now at https://gitlab.com/YottaDB/Util/YDBgvstat
;
gvstat
	; Utility program to demonstrate gathering and using YottaDB/GT.M database statistics
	; Usage: mumps -run $text(+0) [options] where [options] is zero or one of:
	; --consume - read lines of stdin ($PRINCIPAL) whose format is <region>,$horolog,$view("gvstat",<region>) and store into database
	; --csvdump - dump all statistics in database in csv format to stdout
	; --csvout [suboptions] - output selected statistics from database in csv format to stdout, where [suboptions] are:
	;   --date fromdate[,todate] - inclusive range of dates, in formats accepted by $$FUNC^%DATE except those using commas
	;     todate defaults to fromdate; omit suboption to select all dates in database
	;   --reg "*"|reg[,reg...] - comma separated list of regions, "*" or omit for all regions
	;   --stat "*"|stat[,stat...] - comma separated list of statistics, "*" or omit for all statistics
	;   --time fromtime[,totime] - inclusive range of times in selected dates, in format accepted by $$FUNC^%TI
	;     omitted fromtime defaults to 00:00, omitted totime defaults to 23:59 (note that seconds are not accepted)
	; --gatherdb [suboptions] - gather statistics and store in a database, where [suboptions] are:
	;   --gld globaldirectoryfile - global directory for database in which to store statistics, defaults to $gtmgbldir
	;   --int interval - interval in seconds between gatherings (program runs until terminated), defaults to 60 seconds
	;     interval of 0 means gather statistics once and terminate
	; --gatherfile [suboptions] - gather statistics and produce files that can later be read by --consume, where [suboptions] are:
	;   --fname filenamepattern - pattern for output file; filenamepattern shoud end in "_pattern" where pattern is
	;     a format recognized by $ZDATE(), to generate a timestamp for the file open time. If missing, defaults to
	;     "_YEAR-MM-DD+24:60:SS". When closing a file, a "-pattern" timestamp is appended to the filename as a closing timestamp.
	;   --int interval - interval in seconds between gatherings (program runs until terminated), defaults to 60 seconds
	;     interval of 0 means gather statistics once and terminate
	;   --rolltod is a time of day at which to switch the output file; use format recognized by %TI
	;     if time of day is a number representing seconds since midnight, quote it
	;   --rolldur is a duration/lifetime in seconds for each file
	;   If both rolldur and rolltod are specified, file is switched when either event happens.
	;   If neither is specified, output file is never switched.
	; --help - print information on using the program; default option if none specified
	; When storing database statistics, compute and store the ratio of lock failures (LKF) to successes (LKS).
	; If gathered statistics include critical section acquisition data, compute and store acquisition statistics.
	; Invoke from other programs using the following entryrefs:
	;   do consume^$text(+0)
	;   do csvout^$text(+0)(reg,date,time,stat)
	;   do csvdump^$text(+0)
	;   do gatherdb^$text(+0)(gld,int)
	;   do gatherfile^$text(+0)(fname,int,rolltod,rolldur)
	;   do help^$text(+0)
	; Caution: this program assumes YottaDB/GT.M short circuting of expressions; compile accordingly.
	; This program assumes exclusive access to the local variable %gvstatzut

	use $principal:(ctrap=$char(3):nocenable:exception="halt")         ; terminate on Ctrl-C if invoked from shell
	set $etrap="set $etrap=""use $principal write $zstatus,! zhalt 1"""
	set $etrap=$etrap_" set tmp1=$piece($ecode,"","",2),tmp2=$text(@tmp1)"
	set $etrap=$etrap_" if $length(tmp2) write $text(+0),@$piece(tmp2,"";"",2,$length(tmp2,"";"")),!"
	set $etrap=$etrap_" do help zhalt +$extract(tmp1,2,$length(tmp1))"
	set:$stack $ecode=",U254,"      ; top level entryref can only be invoked from the shell
	new cmdline,date,fname,gld,int,reg,rolldur,rolltod,stat,time
	set cmdline=$select($length($zcmdline):$zcmdline,1:"--help")
	for  quit:'$$trimleadingstr^%XCMD(.cmdline,"--")  do ; process options
	. if $$trimleadingstr^%XCMD(.cmdline,"consume") do consume quit
	. else  if $$trimleadingstr^%XCMD(.cmdline,"csvout") do  do csvout($get(reg),$get(date),$get(time),$get(stat)) quit
	. . do trimleadingstr^%XCMD(.cmdline," ")
	. . for  quit:'$$trimleadingstr^%XCMD(.cmdline,"--")  do
	. . . if $$trimleadingstr^%XCMD(.cmdline,"date") set date=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  if $$trimleadingstr^%XCMD(.cmdline,"reg") set reg=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  if $$trimleadingstr^%XCMD(.cmdline,"stat") set stat=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  if $$trimleadingstr^%XCMD(.cmdline,"time") set time=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  set $ecode=",U248,"
	. . . do trimleadingstr^%XCMD(.cmdline," ")
	. else  if $$trimleadingstr^%XCMD(.cmdline,"csvdump") do csvdump quit
	. else  if $$trimleadingstr^%XCMD(.cmdline,"gatherdb") do  do gatherdb($get(gld),$get(int)) quit
	. . do trimleadingstr^%XCMD(.cmdline," ")
	. . for  quit:'$$trimleadingstr^%XCMD(.cmdline,"--")  do
	. . . if $$trimleadingstr^%XCMD(.cmdline,"gld") set gld=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  if $$trimleadingstr^%XCMD(.cmdline,"int") set int=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  set $ecode=",U247,"
	. . . do trimleadingstr^%XCMD(.cmdline," ")
	. else  if $$trimleadingstr^%XCMD(.cmdline,"gatherfile") do  do gatherfile($get(fname),$get(int),$get(rolltod),$get(rolldur)) quit
	. . do trimleadingstr^%XCMD(.cmdline," ")
	. . for  quit:'$$trimleadingstr^%XCMD(.cmdline,"--")  do
	. . . if $$trimleadingstr^%XCMD(.cmdline,"fname") set fname=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  if $$trimleadingstr^%XCMD(.cmdline,"int") set int=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  if $$trimleadingstr^%XCMD(.cmdline,"rolldur") set rolldur=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  if $$trimleadingstr^%XCMD(.cmdline,"rolltod") set rolltod=$$trimleadingdelimstr^%XCMD(.cmdline)
	. . . else  set $ecode=",U246,"
	. . . do trimleadingstr^%XCMD(.cmdline," ")
	. else  if $$trimleadingstr^%XCMD(.cmdline,"help") do help quit
	. else  set $ecode=",U249,"
	. do trimleadingstr^%XCMD(.cmdline," ")
	quit

consume for   read line quit:$zeof  do:$length(line,",")-1 digest(line)
	quit

csvout(reg,date,time,stat)
	new d,dt,fromdate,fromtime,maxdt,mindt,r,s,t,tmp,todate,totime
	set reg=$get(reg) if "*"=reg!'$length(reg) set (r,reg)=$order(^gvstatinc("")) quit:""=r  for  set r=$order(^gvstatinc(r)) quit:""=r  set reg=reg_","_r
	set stat=$get(stat) if "*"=stat!'$length(stat) set (s,stat)=$order(^gvstatname("")) quit:""=s  for  set s=$order(^gvstatname(s)) quit:""=s  set stat=stat_","_s
	set date=$get(date)
	set:$length(date) fromdate=$$FUNC^%DATE($piece(date,",",1)),todate=$select($length(date,",")-1:$$FUNC^%DATE($piece(date,",",2)),1:fromdate)
	set time=$get(time) if ""=time set fromtime=0,totime=86399
	else  do
	. set tmp=$piece(time,",",1),fromtime=$select($zlength(tmp):$$FUNC^%TI(tmp),1:0)
	. set tmp=$piece(time,",",2),totime=$select($zlength(tmp):$$FUNC^%TI(tmp),1:86399)
	. set:totime<fromtime totime=$select(fromtime<86340:59+fromtime,1:86399)
	do:$length(stat)
	. write "REGION,DATE,TIME,",stat,!
	. set mindt=+$get(fromdate)*86400+fromtime-1,maxdt=$select($length($get(todate)):+todate,1:$piece($horolog,",",1))*86400+totime
	. for i=1:1:$length(reg,",") set r=$piece(reg,",",i) do:$data(^gvstatinc(r))
	. . set dt=mindt for  set dt=$order(^gvstatinc(r,dt)) quit:""=dt!(dt>maxdt)  set d=dt\86400,t=dt#86400 do:t>=fromtime&(t<=totime)
	. . . write r,",",$zdate(d_","_t,"YEAR-MM-DD,24:60:SS")
	. . . for j=1:1:$length(stat,",") set s=$piece(stat,",",j) write ",",$get(^gvstatinc(r,dt,s))
	. . . write !
	quit

csvdump ; dump the entire ^gvstatinc global in csv format
	new daytime,reg,stat,tmp
	set reg=$order(^gvstatinc("")) do:$length(reg)
	. set daytime=$order(^gvstatinc(reg,"")) do:$length(daytime)	; Dump output only if at least one region contains at least one incremental statistic
	. . write "REGION,DATE,TIME"
	. . set (stat,tmp)="" for  set stat=$order(^gvstatname(stat)) write:$length(stat) ",",stat if ""=stat write ! quit
	. . write $extract(tmp,1,$length(tmp-1))
	. . set reg="" for  set reg=$order(^gvstatinc(reg)) quit:""=reg  do
	. . . set daytime="" for  set daytime=$order(^gvstatinc(reg,daytime)) quit:""=daytime  write reg,",",$zdate(daytime\86400_","_(daytime#86400),"YEAR-MM-DD,24:60:SS") do
	. . . . set stat="" for  set stat=$order(^gvstatname(stat)) write:$length(stat) ",",$get(^gvstatinc(reg,daytime,stat)) if ""=stat write ! quit
	quit

digest(line)
	; line format expected is <region>,$horolog,$view("gvstat",<region>), so statistics start at 4th comma separated piece
	new daytime,j,n,prevtime,reg,stat,tmp,val
	set reg=$piece(line,",",1)
	set daytime=$piece(line,",",2)*86400+$piece(line,",",3)
	set prevtime=+$order(^gvstat(reg,daytime),-1)
	for j=4:1:$length(line,",") do
	. set tmp=$piece(line,",",j),stat=$piece(tmp,":",1),val=$piece(tmp,":",2),^gvstat(reg,daytime,stat)=val
	. set:'$data(^gvstatname(stat)) ^gvstatname(stat)=""	; if not already recorded, record that there is a statistic stat
	. set:prevtime ^gvstatinc(reg,daytime,stat)=val-$get(^gvstat(reg,prevtime,stat))   ; prevtime may not have this statistic if older version
	do:prevtime    ; compute derived statistics - naked references used to make code fit on one line & none relied on outside a line
	. set ^gvstatinc(reg,daytime,"LKfrate")=$select(^("LKS"):^("LKF")/^("LKS"),1:$select(^("LKF"):999999999999999999,1:"")) ; LKF=nonzero & LKS=0 is infinite fail rate
	. set n=$get(^gvstatinc(reg,daytime,"CAT"),0) ; older versions of GT.M may not have CAT et al to compute derived statistics, also CAT may be zero
	. do:n
	. . set a=^gvstatinc(reg,daytime,"CFT"),b=^("CFS"),(avg,^("CFavg"))=a/n,(sigma,^("CFsigma"))=((b+(avg*(n*avg-(2*a))))/n)**.5,^("CFvar")=$select(sigma:sigma/avg,1:"")
	. . set a=^gvstatinc(reg,daytime,"CQT"),b=^("CQS"),(avg,^("CQavg"))=a/n,(sigma,^("CQsigma"))=((b+(avg*(n*avg-(2*a))))/n)**.5,^("CQvar")=$select(sigma:sigma/avg,1:"")
	. . set a=^gvstatinc(reg,daytime,"CYT"),b=^("CYS"),(avg,^("CYavg"))=a/n,(sigma,^("CYsigma"))=((b+(avg*(n*avg-(2*a))))/n)**.5,^("CYvar")=$select(sigma:sigma/avg,1:"")
	. . set:'$data(^gvstatname("CFavg")) (^gvstatname("CFavg"),^gvstatname("CFsigma"),^gvstatname("CFvar"),^gvstatname("CQavg"),^gvstatname("CQsigma"),^gvstatname("CQvar"),^gvstatname("CYavg"),^gvstatname("CYsigma"),^gvstatname("CYvar"))=""	; ensure computed statistic names are recorded if values exist
	quit

donefile
	; on interrupt, clean up file used for gathering data and exit
	new tmp
	set tmp=$zdate($horolog,pattern)
	close outfile:rename=outfile_"_to_"_tmp
	lock -^gvstat($job)
	quit

gatherdb(gld,int)
	; gather statistics from current database into a database specified by gld
	; int is an interval in seconds between runs, defaulting to 60
	;   if int is zero gathers statistics just once and quits
	; using ^%PEEKBYNAME() would be more efficient than using $view("gvstat",<region>), but the difference is not
	; material for code that runs at most once every tens of seconds
	lock +^gvstat($job)
	lock +^gvstat:0 if  lock -^gvstat
	else  write "Note: another gvstat process is already running",!
	new nextint,reg,savegd,stats,zint
	set int=$select($length($get(int)):+$get(int),1:60)*1E6 ; convert to microseconds for compatibility with $ZUT
	set:$data(gld) savegd=$zgbldir
	set zint=$zinterrupt,$zinterrupt="set $zinterrupt=zint,int=0"
	set nextint=$$zut+int
	for  do:$increment(nextint,int)  quit:'int
	. set reg="" for  set reg=$view("gvnext",reg) quit:""=reg  do
	. . set stats=$view("gvstat",reg)
	. . set:$data(gld) $zgbldir=gld
	. . do digest(reg_","_$horolog_","_stats)
	. . set:$data(gld) $zgbldir=savegd
	. hang nextint-$$zut/1E6
	lock -^gvstat($job)
	quit

gatherfile(fname,int,rolltod,rolldur)
	; gather statistics and output to a file
	lock +^gvstat($job)
	lock +^gvstat:0 if  lock -^gvstat
	else  write "Note: another gvstat process is already running",!
	new nextdur,nextint,nexttod,outfile,patlen,pattern,tmp,tmp1,zint,zut
	set patlen=$length(fname,"_") set:patlen<2 fname=fname_"_YEAR-MM-DD+24:60:SS",patlen=2
	set pattern=$piece(fname,"_",patlen),outfile=$piece(fname,"_",1,patlen-1)_"_"_$zdate($horolog,pattern)
	set int=$select($length($get(int)):+$get(int),1:60)*1E6 ; convert to microseconds for compatibility with $$ZUT
	set rolldur=+$get(rolldur) set rolldur=$select(0>rolldur:0,1:rolldur*1E6)
	set rolltod=$get(rolltod)  ; rolltod may not be numeric
	if rolltod!$length(rolltod) do
	. set rolltod=$$FUNC^%TI(rolltod)
	. set tmp=$horolog,tmp1=rolltod-$piece(tmp,",",2) if 0>tmp1&$increment(tmp1,86400)
	. set rolltod=tmp1*1E6
	else  set rolltod=0
	set zint=$zinterrupt,$zinterrupt="set $zinterrupt=zint zgoto "_$zlevel_":donefile"
	open outfile:newver use outfile
	set (nextint,zut)=$$zut,nextdur=$select(rolldur:zut+rolldur,1:0),nexttod=$select(rolltod:zut+rolltod,1:0)
	for  do:$increment(nextint,int)  if 'int do donefile quit
	. set reg="" for  set reg=$view("gvnext",reg) quit:""=reg  write reg,",",$horolog,",",$view("gvstat",reg),!
	. do:nextdur&(nextdur<nextint&$increment(nextdur,rolldur))!(nexttod&(nexttod<nextint&$increment(nexttod,86400*1E6)))
	. . set tmp=$zdate($horolog,pattern)
	. . close outfile:rename=outfile_"_to_"_tmp
	. . set outfile=$piece(fname,"_",1,patlen-1)_"_"_tmp
	. . open outfile:newver use outfile
	. hang nextint-$$zut/1E6
	quit

help    new j,k,label,tmp
	set label=$text(+0)
	for j=1:1 set tmp=$piece($text(@label+j),"; ",2) quit:""=tmp  do
	. write $piece(tmp,"$text(+0)",1) for k=2:1:$length(tmp,"$text(+0)") write $text(+0),$piece(tmp,"$text(+0)",k)
	. write !
	quit

zut()	set:'$data(%gvstatzut) %gvstatzut=$select($ztranslate($zpiece($zversion," ",2),".-ABCDEFGHIJKLMNOPQRSTUVWXYZ")-62000>0:"$zut",1:"$zpiece($horolog,"","",1)*86400+$zpiece($horolog,"","",2)*1E6")	; use $zut for versions after V6.2-000
	quit @%gvstatzut       ; Use $zut or substitute for older versions

;       Error message texts
U246    ;"-F-ILLGATHERFILOPT Illegal suboption for --getherfile starting with: --"_cmdline
U247    ;"-F-ILLGATHERDBOPT Illegal suboption for --gatherdb starting with: --"_cmdline
U248    ;"-F-ILLCSVOUTOPT Illegal suboption for --csvout option starting with: --"_cmdline
U249    ;"-F-ILLCMDLINE Illegal command line starting with: --"_cmdline
U254    ;"-F-LABREQ Invocation from another program must specify a label;  use mumps -run "_$text(+0)_" to execute from top of routine"

