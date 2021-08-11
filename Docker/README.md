The docker implementation of the stack now contains the Eclipse Theia browser based IDE for routine viewing and amendments.

The changes are the same as with Vista data project implementation but the URL for the IDE is **http://ipofdockerserver:3002/#/home/yottadb-settings/Yottadb.theia-workspace**

Further details are available here:

https://github.com/RamSailopal/YottaDB-dashboard/tree/main/Vista-Docker

There is also a difference in the design of this docker stack against the Vista one in that there is separate container running lsyncd to sync code changes.
