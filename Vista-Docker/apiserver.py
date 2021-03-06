#!/usr/bin/python
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import json
import os
import urllib
import xmltodict

class S(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def _html(self, message):
        if (self.path=="/routines"):
           cmd = "(echo D ^%RD;sleep 1;echo \"*\";sleep 1;echo \"\";echo \"H\") | ydb | awk '/^Routine:/ { prnt=1;next } /Total/ { prnt=0 } prnt==1 && !/^$/ && !/^YDB>/ { print }'"
           process = subprocess.Popen(cmd,
                              stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE,
                              shell=True)
           result = process.communicate()
           result1=result[0].decode('utf-8').split(" ")
           content=()
           count=0
           for rout in result1:
              if (rout != "" and rout != "\n"):
                 count=count+1
                 content= content + ({ "id": str(count), "name": rout },)
           content1 = json.dumps(content)
           return content1.encode('utf-8')  # NOTE: must return a bytes object!
        elif (self.path=="/globals"):
           cmd = "(echo 'D ^%GD';sleep 1;echo '*';sleep 1;echo '';sleep 1;echo 'H') | ydb | awk '/^Global/ { prnt=1;next } /^Total/ { prnt=0 } prnt==1&&!/^$/&&!/NODEVISTA/ { print }'"
           process = subprocess.Popen(cmd,
                              stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE,
                              shell=True)
           result = process.communicate()
           result1=result[0].decode('utf-8').split(" ")
           content=()
           count=0
           for glob in result1:
              if (glob != "" and glob != "\n"):
                 count=count+1
                 content= content + ({ "id": str(count), "name": glob },)
           content1 = json.dumps(content)
           return content1.encode('utf-8')  # NOTE: must return a bytes object!
        elif (self.path=="/locks"):
           content=()
           if (os.environ.get('yotta_instdir')!=None and os.environ.get('ydb_gbldir')!=None and os.environ.get('ydb_dir')!=None and os.environ.get('ydb_rel')!=None):
              cmd=os.environ.get('yotta_instdir') + "/lke show -all 2>&1 | awk '/^\^/ { print $1\":\"$5 }'"
              process = subprocess.Popen(cmd,
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE,
                                     shell=True)
              result = process.communicate()
              content=()
              count=0
              for res in result:
                 if (res.decode('utf-8') != ""):
                    x=res.decode('utf-8').split(':')
                    lck=x[0]
                    pid=x[1]
                    count=count+1
                    if (lck != ""):
                       content= content + ({ "id": str(count), "global": str(lck), "pid": pid },)
           content1 = json.dumps(content)
           return content1.encode('utf-8')  # NOTE: must return a bytes object!
        elif (self.path=="/version"):
           cmd="ydb <<< 'W $ZV' | awk '!/^$/ && !/NODEVISTA/ { print \"YottaDB release:\"$1;print \"Upstream base version:\"$2;print \"Platform:\"$3 }'"
           process = subprocess.Popen(cmd,
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE,
                                     shell=True)
           result = process.communicate()
           content=()
           count=0
           resulta=result[0].decode('utf-8').split("\n")
           rel=""
           vers=""
           plat=""
           buildt=""
           buildc=""
           for res in resulta:
              if (res != ""):
                 dat=res.split(":")
                 if (dat[0]=="YottaDB release"):
                    rel=dat[1].replace(" ","")
                 elif (dat[0]=="Upstream base version"):
                    vers=dat[1].replace(" ","")
                 elif (dat[0]=="Platform"):
                    plat=dat[1].replace(" ","")
                 elif (dat[0]=="Build date/time"):
                    buildt=dat[1].replace(" ","")
                 elif (dat[0]=="Build commit SHA"):
                    buildc=dat[1].replace(" ","")
           content= content + ({ "YottaDB release": str(rel), "Upstream base version": str(vers), "Platform": str(plat), "Build date/time": str(buildt), "Build commit SHA": str(buildc) },)
           content1 = json.dumps(content)
           return content1.encode('utf-8')  # NOTE: must return a bytes object!
        elif (self.path=="/journal"):
           content=()
           if (os.environ.get('yotta_dir')!=None):
              cmd="find " + os.environ.get('yotta_dir') + "/j" + " -name \"*.mjl*\" -printf \"%h/%f:%s\n\"" 
              process = subprocess.Popen(cmd,
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE,
                                     shell=True)
              result = process.communicate()
              count=0
              resulta=result[0].decode('utf-8').split("\n")
              for res in resulta:
                 if (res != ""):
                    dat=res.split(":")
                    fil=dat[0].replace(" ","")
                    size=dat[1].replace(" ","")
                    content= content + ({ "File": str(fil), "Size": str(size) },)
           content1 = json.dumps(content)
           return content1.encode('utf-8')  # NOTE: must return a bytes object!
        elif (self.path=="/blog"):
           content=()
           file = urllib.request.urlopen('http://yottadb.com/feed/')
           data = file.read()
           file.close()
           data = xmltodict.parse(data)
           count=0
           for i in data['rss']['channel']['item']:
              if (count<=5):
                 content= content + ({ "Title": str(data['rss']['channel']['item'][count]['title']), "Data": str(data['rss']['channel']['item'][count]['pubDate']), "Link": str(data['rss']['channel']['item'][count]['link']) },)
              count=count+1
           content1 = json.dumps(content)
           return content1.encode('utf-8')  # NOTE: must return a bytes object!
        elif (self.path[0:5]=="/code"):
           rout=self.path[6:len(self.path):1]
           if (os.environ.get('yotta_dir')!=None and os.environ.get('ydb_rel')!=None):
              cmd="cat " + os.environ.get('yotta_dir') + "/" + os.environ.get('ydb_rel') + "/r/" + rout + ".m"
              process = subprocess.Popen(cmd,
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE,
                                     shell=True)
              result = process.communicate()
              lnetot=""
              for lne in result:
                 lnetot=lnetot + "\n" + lne.decode('utf-8')
              print(lnetot)
              return lnetot.encode('utf-8')
        else:
           content=()
           content1 = json.dumps(content)
           return content1.encode('utf-8')  # NOTE: must return a bytes object!





    def do_GET(self):
        self._set_headers()
        self.wfile.write(self._html("hi!"))

    def do_HEAD(self):
        self._set_headers()

    def do_POST(self):
        # Doesn't do anything with posted data
        self._set_headers()
        self.wfile.write(self._html("POST!"))


def run(server_class=HTTPServer, handler_class=S, addr="localhost", port=8000):
    server_address = (addr, port)
    httpd = server_class(server_address, handler_class)

    print("Starting httpd server on {addr}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Run a simple HTTP server")
    parser.add_argument(
        "-l",
        "--listen",
        default="localhost",
        help="Specify the IP address on which the server listens",
    )
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=8000,
        help="Specify the port on which the server listens",
    )
    args = parser.parse_args()
    run(addr=args.listen, port=args.port)

