#!/usr/bin/python
#
#	AUTHOR - Raman Sailopal
#
#	Python code for YottaDB global viewer
#
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
           if (os.environ.get('glbviewadd') != None):
                 glbviewadd=os.environ.get('glbviewadd')
           else:
                 glbviewadd="localhost"
           if (os.environ.get('glbviewport') != None):
                 glbviewport=os.environ.get('glbviewport')
           else:
                 glbviewport="8001"
           glob = self.path.replace("/","")
           if (glob=="*" or glob==""):
              cmd = "ydb <<< 'D ^%GD;*' | awk '$0 !~ /^$/ && $0 !~ /^YDB>/ && $0 !~ /^Global/ && $0 !~ /Total/ { print }'"
              process = subprocess.Popen(cmd,
                              stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE,
                              shell=True)
              result = process.communicate()
              result1=result[0].replace(" ","")
              result2=result1.split("^")
              result3=""
              for glb in result2:
                 if (glb!=""):
                    result3 = result3 + "<a href=\"http://" + glbviewadd + ":" + glbviewport + "/" + glb + "\">^" + glb + "</a></br></br>"
              return("<HTML><BODY><p><img src=\"https://yottadb.com/wp-content/uploads/2018/01/YottaDB_logo.svg\" width=\"300\" height=\"150\"></p><P><H1>Global Directory Listing</H1><DIV style=\"background-color:#ECF0F1;\">" + result3 + "</DIV></P></BODY></HTML>")
           elif (glob[0:5]=="QUERY"):
              glob1=glob.split("?")
              query=glob[13::1]
              query=urllib.unquote(query).decode('utf8')
              query1=query.replace('"','\\"')
              query1=query1.replace("$","\\$")
              cmd = "timeout 3 bash -c '(echo \"" + query1 +"\")|ydb|head -500'" 
              process = subprocess.Popen(cmd,
                              stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE,
                              shell=True)
              result = process.communicate()
              result1=result[0].replace("YDB>"," ")
              result1=result1.replace("\n","</BR></BR>")
              return("<HTML><BODY><p><img src=\"https://yottadb.com/wp-content/uploads/2018/01/YottaDB_logo.svg\" width=\"300\" height=\"150\"></p><H1>M Query result for <font color=\"blue\">" + query + "</font></H1><DIV style=\"background-color:#ECF0F1;\">" + result1 + "</DIV></DIV></BODY></HTML>")             
           else:
              cmd = "timeout 3 bash -c '(echo \"D ^%G\";echo \"\";echo \"" + glob +"\")|ydb|head -500'"
              process = subprocess.Popen(cmd,
                              stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE,
                              shell=True)
              result = process.communicate()
              result1=result[0].replace("YDB>"," ")
              result1=result1.replace("Output device: <terminal>:","<p><img src=\"https://yottadb.com/wp-content/uploads/2018/01/YottaDB_logo.svg\" width=\"300\" height=\"150\"></p><H1>Global Listing for <font color=\"blue\">^" + glob + "</font></H1><P><b>M Query:</b><input type=\"text\" size=\"50\" id=\"mquery\"/><input type=\"button\" value=\"Run\" onClick='location.href=\"http://" + glbviewadd + ":" + glbviewport + "/QUERY?mquery=\" + document.getElementById(\"mquery\").value'/></P><DIV style=\"background-color:#ECF0F1;\">")
              result1=result1.replace("List ^","")
              result1=result1.replace("\n","</BR></BR>")
              result1=result1.replace("</BR></BR> </BR>","")
              result1=result1.replace("</BR></BR></BR><p>","")
              return("<HTML><BODY>" + result1 + "</DIV></BODY></HTML>")



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

