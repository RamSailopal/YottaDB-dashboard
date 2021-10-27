# Debugger for Yottadb / GT.M

This is a Beta Version of language support for Mumps (M) running on Yottadb/GT.M
It includes a debugger, syntax check and the syntax-highlighting module by David Silin with some minor improvements

## Using mumps-debug

* Install the **mumps-debug** extension in VS Code.
* Put the MDEBUG.m Routine in your M-Program-Directory and start it.
* Edit the launch.json and set hostname of the host MDEBUG runs on.
* Maybe change Port in launch.json and in MDEBUG.m if Port 9000 isn't useable.

* Also set the localRoutinesPath to map the directory on your VS Code machine to the machine where MDEBUG.m runs.

* Open a M-Program you want to debug in VS Code and start debugging via "F5"
* New in Version 0.8.0: Press Ctrl-E to toggle between long and short Command-Format

## Project Page:

[https://github.com/jewuma/mumps-debug.git](https://github.com/jewuma/mumps-debug.git)

## launch.json:

A possible `launch.json` could look like this:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "mumps",
      "request": "launch",
      "name": "Debug active File",
      "program": "${file}",
      "stopOnEntry": true,
      "hostname": "192.168.0.1",
      "localRoutinesPath": "y:\\",
      "port": 9000
    }
  ]
}
