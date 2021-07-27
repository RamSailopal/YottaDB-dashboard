#!/usr/bin/python
import subprocess
import time
import httplib
import glob
import os
from prometheus_client.core import GaugeMetricFamily, StateSetMetricFamily, REGISTRY, CounterMetricFamily
from prometheus_client import start_http_server, Enum


class CustomCollector(object):
 def __init__(self):
  pass
  

 def collect(self):


    job="Process"

    if (os.environ.get('YOTTA_PROM_REG')==None):
       reg="DEFAULT"
    else:
       reg=os.environ.get('YOTTA_PROM_REG')
    title="Yottadb_Stats"
    mets=("pit","acc")
    for met in mets:
       if (met=="pit"):
          cmd="ydb <<< 'D proc^gvstatprom(\"" + reg + "\")' | grep -Ev '(^NODEVISTA>)|(^$)'"
       else:
          cmd="ydb <<< 'D accproc^gvstatprom(\"" + reg + "\")' | grep -Ev '(^NODEVISTA>)|(^$)'"
       process = subprocess.Popen(cmd,
                              stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE,
                              shell=True)
       result = process.communicate()
       stats=str(result).split(",")
       for i in stats:
           stats1=i.split(":")
           if stats1[0] == "DRD":
             a = GaugeMetricFamily("DRD" + "_" + met,"Disk Reads from the database file", labels=[job])
             a.add_metric([title], stats1[1])
             yield a
           elif stats1[0] == "BTD":
             b = GaugeMetricFamily("BTD" + "_" + met,"Number of database block transitions to dirty", labels=[job])
             b.add_metric([title], stats1[1])
             yield b
           elif stats1[0] == "CAT":
             c = GaugeMetricFamily("CAT" + "_" + met,"Critical session Acquisitions successes", labels=[job])
             c.add_metric([title], stats1[1])
             yield c
           elif stats1[0] == "CFE":
             d = GaugeMetricFamily("CFE" + "_" + met,"Critical section Failed (blocked) acquisition total caused by Epochs", labels=[job])
             d.add_metric([title], stats1[1])
             yield d
           elif stats1[0] == "CFS":
             e = GaugeMetricFamily("CFS" + "_" + met,"Critical section Failed (blocked) acquisition sum of Squares", labels=[job])
             e.add_metric([title], stats1[1])
             yield e
           elif stats1[0] == "CFT":
             g = GaugeMetricFamily("CFT" + "_" + met,"Critical section Failed (blocked) acquisition Total", labels=[job])
             g.add_metric([title], stats1[1])
             yield g
           elif stats1[0] == "CQS":
             f = GaugeMetricFamily("CQS" + "_" + met,"Critical section acquisition Queued sleeps sum of Squares", labels=[job])
             f.add_metric([title], stats1[1])
             yield f
           elif stats1[0] == "CQT":
             g = GaugeMetricFamily("CQT" + "_" + met,"Critical section acquisition Queued sleeps Total", labels=[job])
             g.add_metric([title], stats1[1])
             yield g
           elif stats1[0] == "CTN":
             h = GaugeMetricFamily("CTN" + "_" + met,"Current Transaction Number of the database for the last committed read-write transaction (TP and non-TP)", labels=[job])
             h.add_metric([title], stats1[1])
             yield h
           elif stats1[0] == "CYS":
             i = GaugeMetricFamily("CYS" + "_" + met,"Critical section acquisition processor Yields sum of Squares", labels=[job])
             i.add_metric([title], stats1[1])
             yield i
           elif stats1[0] == "CYT":
             j = GaugeMetricFamily("CYT" + "_" + met,"Critical section acquisition processor Yields Total", labels=[job])
             j.add_metric([title], stats1[1])
             yield j
           elif stats1[0] == "DEX":
             k = GaugeMetricFamily("DEX" + "_" + met,"Number of Database file Extentions", labels=[job])
             k.add_metric([title], stats1[1])
             yield k
           elif stats1[0] == "DFL":
             l = GaugeMetricFamily("DFL" + "_" + met,"Number of Database Flushes of the entire set of dirty global buffers in shared memory to disk", labels=[job])
             l.add_metric([title], stats1[1])
             yield l
           elif stats1[0] == "DFS":
             m = GaugeMetricFamily("DFS" + "_" + met,"Number of times a process does an fsync of the database file", labels=[job])
             m.add_metric([title], stats1[1])
             yield m
           elif stats1[0] == "DTA":
             n = GaugeMetricFamily("DTA" + "_" + met,"Number of data operations (TP and non-TP)", labels=[job])
             n.add_metric([title], stats1[1])
             yield n
           elif stats1[0] == "DWT":
             o = GaugeMetricFamily("DWT" + "_" + met,"Number of Disk Writes to the database file (TP and non-TP, committed and rolled-back)", labels=[job])
             o.add_metric([title], stats1[1])
             yield o
           elif stats1[0] == "GET":
             p = GaugeMetricFamily("GET" + "_" + met,"Number of GET operations (TP and non-TP)", labels=[job])
             p.add_metric([title], stats1[1])
             yield p
           elif stats1[0] == "JBB":
             q = GaugeMetricFamily("JBB" + "_" + met,"Number of Journal Buffer Bytes updated in shared memory", labels=[job])
             q.add_metric([title], stats1[1])
             yield q
           elif stats1[0] == "JEX":
             r = GaugeMetricFamily("JEX" + "_" + met,"Number of Journal file Extentions", labels=[job])
             r.add_metric([title], stats1[1])
             yield r
           elif stats1[0] == "JFB":
             s = GaugeMetricFamily("JFB" + "_" + met,"Number of Journal File Bytes written to the journal file on disk", labels=[job])
             s.add_metric([title], stats1[1])
             yield s
           elif stats1[0] == "JFL":
             t = GaugeMetricFamily("JFL" + "_" + met,"Number of Journal Flushes of all dirty journal buffers in shared memory to disk", labels=[job])
             t.add_metric([title], stats1[1])
             yield t
           elif stats1[0] == "JFS":
             u = GaugeMetricFamily("JFS" + "_" + met,"Number of Journal FSync operations on the journal file", labels=[job])
             u.add_metric([title], stats1[1])
             yield u
           elif stats1[0] == "JFW":
             v = GaugeMetricFamily("JFW" + "_" + met,"Number of Journal File Write system calls", labels=[job])
             v.add_metric([title], stats1[1])
             yield v
           elif stats1[0] == "JRE":
             w = GaugeMetricFamily("JRE" + "_" + met,"Number of Journal Regular Epoch records written to the journal file", labels=[job])
             w.add_metric([title], stats1[1])
             yield w
           elif stats1[0] == "JRI":
             x = GaugeMetricFamily("JRI" + "_" + met,"Number of Journal Idle epoch journal records written to the journal file", labels=[job])
             x.add_metric([title], stats1[1])
             yield x
           elif stats1[0] == "JRL":
             y = GaugeMetricFamily("JRL" + "_" + met,"Number of Journal Records with a Logical record type (e.g. SET, KILL etc.) written to the journal file", labels=[job])
             y.add_metric([title], stats1[1])
             yield y
           elif stats1[0] == "JRO":
             z = GaugeMetricFamily("JRO" + "_" + met,"Number of Journal Records with a type Other than logical written to the journal file (e.g. AIMG, EPOCH, PBLK, PFIN, PINI, and so on)", labels=[job])
             z.add_metric([title], stats1[1])
             yield z
           elif stats1[0] == "JRP":
             aa = GaugeMetricFamily("JRP" + "_" + met,"Number of Journal Records with a Physical record type (i.e. PBLK, AIMG) written to the journal file", labels=[job])
             aa.add_metric([title], stats1[1])
             yield aa
           elif stats1[0] == "KIL":
             ab = GaugeMetricFamily("KIL" + "_" + met,"Number of KILl operations (kill as well as zwithdraw, TP and non-TP)", labels=[job])
             ab.add_metric([title], stats1[1])
             yield ab
           elif stats1[0] == "LKF":
             ac = GaugeMetricFamily("LKF" + "_" + met,"Number of LocK calls (mapped to this db) that Failed", labels=[job])
             ac.add_metric([title], stats1[1])
             yield ac
           elif stats1[0] == "LKS":
             ad = GaugeMetricFamily("LKS" + "_" + met,"Number of LocK calls (mapped to this db) that Succeeded", labels=[job])
             ad.add_metric([title], stats1[1])
             yield ad
           elif stats1[0] == "NBR":
             ae = GaugeMetricFamily("NBR" + "_" + met,"Number of Non-tp committed transaction induced Block Reads on this database", labels=[job])
             ae.add_metric([title], stats1[1])
             yield ae
           elif stats1[0] == "NBW":
             af = GaugeMetricFamily("NBR" + "_" + met,"Number of Non-tp committed transaction induced Block Writes on this database", labels=[job])
             af.add_metric([title], stats1[1])
             yield af
           elif stats1[0] == "NB0":
             ag = GaugeMetricFamily("NB0","Number of Non-tp transaction Restarts at try 0", labels=[job])
             ag.add_metric([title], stats1[1])
             yield ag
           elif stats1[0] == "NB1":
             ah = GaugeMetricFamily("NB1","Number of Non-tp transaction Restarts at try 1", labels=[job])
             ah.add_metric([title], stats1[1])
             yield ah
           elif stats1[0] == "NB2":
             ai = GaugeMetricFamily("NB2","Number of Non-tp transaction Restarts at try 2", labels=[job])
             ai.add_metric([title], stats1[1])
             yield ai
           elif stats1[0] == "NB3":
             aj = GaugeMetricFamily("NB3","Number of Non-tp transaction Restarts at try 3", labels=[job])
             aj.add_metric([title], stats1[1])
             yield aj
           elif stats1[0] == "NTR":
             ak = GaugeMetricFamily("NTR" + "_" + met,"Number of Non-tp committed Transactions that were Read-only on this database", labels=[job])
             ak.add_metric([title], stats1[1])
             yield ak
           elif stats1[0] == "NTW":
             al = GaugeMetricFamily("NTW" + "_" + met,"Number of Non-tp committed Transactions that were read-Write on this database", labels=[job])
             al.add_metric([title], stats1[1])
             yield al
           elif stats1[0] == "ORD":
             am = GaugeMetricFamily("ORD" + "_" + met,"Number of $ORDer(,1) (forward) operations (TP and non-TP); the count of $Order(,-1) operations are reported under ZPR.", labels=[job])
             am.add_metric([title], stats1[1])
             yield am
           elif stats1[0] == "QRY":
             an = GaugeMetricFamily("QRY" + "_" + met,"Number of $QueRY() operations (TP and non-TP)", labels=[job])
             an.add_metric([title], stats1[1])
             yield an
           elif stats1[0] == "SET":
             ao = GaugeMetricFamily("SET" + "_" + met,"Number of SET operations (TP and non-TP)", labels=[job])
             ao.add_metric([title], stats1[1])
             yield ao
           elif stats1[0] == "TBR":
             ap = GaugeMetricFamily("TBR" + "_" + met,"Number of Tp transaction induced Block Reads on this database", labels=[job])
             ap.add_metric([title], stats1[1])
             yield ap
           elif stats1[0] == "TBW":
             aq = GaugeMetricFamily("TBW" + "_" + met,"Number of Tp transaction induced Block Writes on this database", labels=[job])
             aq.add_metric([title], stats1[1])
             yield aq
           elif stats1[0] == "TC0":
             ar = GaugeMetricFamily("TC0","Number of Tp transaction Conflicts at try 0 (counted only for that region which caused the TP transaction restart)", labels=[job])
             ar.add_metric([title], stats1[1])
             yield ar
           elif stats1[0] == "TC1":
             as1 = GaugeMetricFamily("TC1","Number of Tp transaction Conflicts at try 1 (counted only for that region which caused the TP transaction restart)", labels=[job])
             as1.add_metric([title], stats1[1])
             yield as1
           elif stats1[0] == "TC2":
             at = GaugeMetricFamily("TC2","Number of Tp transaction Conflicts at try 2 (counted only for that region which caused the TP transaction restart)", labels=[job])
             at.add_metric([title], stats1[1])
             yield at
           elif stats1[0] == "TC3":
             au = GaugeMetricFamily("TC3","Number of Tp transaction Conflicts at try 3 (counted only for that region which caused the TP transaction restart)", labels=[job])
             au.add_metric([title], stats1[1])
             yield au
           elif stats1[0] == "TC4":
             av = GaugeMetricFamily("TC4","Number of Tp transaction Conflicts at try 4 (counted only for that region which caused the TP transaction restart)", labels=[job])
             av.add_metric([title], stats1[1])
             yield av
           elif stats1[0] == "TR0":
             aw = GaugeMetricFamily("TR0","Number of Tp transaction Restarts at try 0 (counted for all regions participating in restarting TP transaction)", labels=[job])
             aw.add_metric([title], stats1[1])
             yield aw
           elif stats1[0] == "TR1":
             ax = GaugeMetricFamily("TR1","Number of Tp transaction Restarts at try 1 (counted for all regions participating in restarting TP transaction)", labels=[job])
             ax.add_metric([title], stats1[1])
             yield ax
           elif stats1[0] == "TR2":
             ay = GaugeMetricFamily("TR2","Number of Tp transaction Restarts at try 2 (counted for all regions participating in restarting TP transaction)", labels=[job])
             ay.add_metric([title], stats1[1])
             yield ay
           elif stats1[0] == "TR3":
             az = GaugeMetricFamily("TR3","Number of Tp transaction Restarts at try 3 (counted for all regions participating in restarting TP transaction)", labels=[job])
             az.add_metric([title], stats1[1])
             yield az
           elif stats1[0] == "TR4":
             aaa = GaugeMetricFamily("TR4","Number of Tp transaction Restarts at try 4 (counted for all regions participating in restarting TP transaction)", labels=[job])
             aaa.add_metric([title], stats1[1])
             yield aaa
           elif stats1[0] == "TRB":
             aab = GaugeMetricFamily("TRB" + "_" + met,"Number of Tp read-only or read-write transactions Rolled Back (excluding incremental rollbacks)", labels=[job])
             aab.add_metric([title], stats1[1])
             yield aab
           elif stats1[0] == "TTR":
             aac = GaugeMetricFamily("TTR" + "_" + met,"Number of Tp committed Transactions that were Read-only on this database", labels=[job])
             aac.add_metric([title], stats1[1]) 
             yield aac
           elif stats1[0] == "TTW":
             aad = GaugeMetricFamily("TTW" + "_" + met,"Number of Tp committed Transactions that were read-Write on this database", labels=[job])
             aad.add_metric([title], stats1[1])
             yield aad
           elif stats1[0] == "ZPR":
             aae = GaugeMetricFamily("ZPR" + "_" + met,"Number of $order(,-1) or $ZPRevious() (reverse order) operations (TP and non-TP). The count of $Order(,1) operations are reported under ORD", labels=[job])
             aae.add_metric([title], stats1[1])
             yield aae
           elif stats1[0] == "ZTR":
             aaf = GaugeMetricFamily("ZTR" + "_" + met,"Number of ZTRigger command operations", labels=[job])
             aaf.add_metric([title], stats1[1])
             yield aaf


if __name__ == '__main__':

    start_http_server(int(os.environ.get('YOTTA_PROM_PORT')))
    REGISTRY.register(CustomCollector())
    while True:
        time.sleep(10)


