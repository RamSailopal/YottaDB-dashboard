"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MConnect = void 0;
/*
    Connector to MDEBUG-Server by Jens Wulf
    License: LGPL
*/
const net_1 = require("net");
const events_1 = require("events");
const fs_1 = require("fs");
var connectState;
(function (connectState) {
    connectState[connectState["disconnected"] = 0] = "disconnected";
    connectState[connectState["waitingforStart"] = 1] = "waitingforStart";
    connectState[connectState["waitingForVars"] = 2] = "waitingForVars";
    connectState[connectState["waitingForBreakpoints"] = 3] = "waitingForBreakpoints";
    connectState[connectState["waitingForSingleVar"] = 4] = "waitingForSingleVar";
    connectState[connectState["waitingForSingleVarContent"] = 5] = "waitingForSingleVarContent";
    connectState[connectState["waitingForErrorReport"] = 6] = "waitingForErrorReport";
    connectState[connectState["waitingForHints"] = 7] = "waitingForHints";
})(connectState || (connectState = {}));
class MConnect extends events_1.EventEmitter {
    constructor() {
        super();
        this._socket = new net_1.Socket();
        this._event = new events_1.EventEmitter();
        this._currentLine = 0;
        this._breakpointId = 1;
        this._logging = false;
        this._singleVar = "";
        this._singleVarContent = "";
        this._commandQueue = [];
        this._connectState = connectState.disconnected;
        this._readedData = "";
        this._mVars = {};
        this._mStack = [];
        this._activeBreakpoints = [];
        this._breakPoints = [];
        this._errorLines = [];
        this._singleVar = "";
        this._singleVarContent = "";
        this._hints = [];
        this._event.on('varsComplete', () => {
            if (typeof (this._mVars["I"]) !== 'undefined') {
                let internals = this._mVars["I"];
                this.checkEvents(internals);
            }
        });
    }
    init(hostname, port, localRoutinesPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this._localRoutinesPath = localRoutinesPath;
            this._hostname = hostname;
            this._port = port;
            return new Promise((resolve, reject) => {
                this._socket.connect(this._port, this._hostname, () => {
                    this._log("Debug-Server connected\n");
                    this._connectState = connectState.waitingforStart;
                    this._socket.on('data', (chunk) => {
                        this._readedData += chunk.toString();
                        let n = this._readedData.indexOf('\n');
                        while (n !== -1) {
                            let data = this._readedData.substring(0, n);
                            this.processLine(data);
                            this._readedData = this._readedData.substring(n + 1);
                            n = this._readedData.indexOf('\n');
                        }
                    });
                    resolve(this._socket);
                });
                this._socket.on('error', (error) => {
                    reject(error);
                });
                this._socket.on('end', () => { this._connectState = connectState.disconnected; });
            });
            // Put a friendly message on the terminal of the server.
        });
    }
    _log(msg) {
        if (this._logging) {
            console.log(msg);
        }
    }
    processLine(line) {
        this._log("Line:  " + line);
        let varname;
        let value;
        let vartype;
        switch (this._connectState) {
            case connectState.waitingforStart: {
                if (line === "***STARTVAR") {
                    this._connectState = connectState.waitingForVars;
                    this._mStack = [];
                    this._mVars = {};
                    break;
                }
                if (line === "***STARTBP") {
                    this._connectState = connectState.waitingForBreakpoints;
                    this._activeBreakpoints = [];
                    this._log(line);
                    break;
                }
                if (line === "***SINGLEVAR") {
                    this._connectState = connectState.waitingForSingleVar;
                    this._singleVar = "";
                    this._singleVarContent = "";
                    break;
                }
                if (line === "***ENDPROGRAM") {
                    this.sendEvent("end");
                    this._socket.end();
                    break;
                }
                if (line === "***BEGINERRCHK") {
                    this._connectState = connectState.waitingForErrorReport;
                    this._errorLines = [];
                    break;
                }
                if (line === "***STARTHINTS") {
                    this._connectState = connectState.waitingForHints;
                    this._hints = [];
                    break;
                }
                break;
            }
            case connectState.waitingForVars: {
                if (line === "***ENDVAR") {
                    this._connectState = connectState.waitingforStart;
                    this._event.emit("varsComplete");
                }
                else {
                    vartype = line.substring(0, 1); //I=internal,V=local Variable,S=Stackframe
                    if (vartype === "S") {
                        this._mStack.push(line.substring(2));
                    }
                    varname = line.substring(2, line.indexOf('='));
                    while ((varname.split('"').length - 1) % 2 !== 0) {
                        varname = line.substring(0, line.indexOf('=', varname.length + 1));
                    }
                    value = line.substring(varname.length + 3).replace(/^"/, "").replace(/"$/, "");
                    if (typeof (this._mVars[vartype]) === 'undefined') {
                        this._mVars[vartype] = {};
                    }
                    this._mVars[vartype][varname] = value;
                }
                break;
            }
            case connectState.waitingForBreakpoints: {
                if (line === "***ENDBP") {
                    this._log(line);
                    this._connectState = connectState.waitingforStart;
                    this.verifyBreakpoints();
                }
                else {
                    this._log(line);
                    this._activeBreakpoints.push(line);
                }
                break;
            }
            case connectState.waitingForSingleVar: {
                if (line === "***SINGLEEND") {
                    this._connectState = connectState.waitingforStart;
                    this._event.emit('SingleVarReceived', this._event, this._singleVar, this._singleVarContent);
                }
                else if (line === "***SINGLEVARCONTENT") {
                    this._connectState = connectState.waitingForSingleVarContent;
                }
                else {
                    this._singleVar += line;
                }
                break;
            }
            case connectState.waitingForSingleVarContent: {
                if (line === "***SINGLEEND") {
                    this._connectState = connectState.waitingforStart;
                    this._event.emit('SingleVarReceived', this._event, this._singleVar, this._singleVarContent);
                }
                else {
                    this._singleVarContent += line;
                }
                break;
            }
            case connectState.waitingForErrorReport: {
                if (line === "***ENDERRCHK") {
                    this._connectState = connectState.waitingforStart;
                    this._event.emit('ErrorreportReceived', this._event, this._errorLines);
                }
                else {
                    this._errorLines.push(line);
                }
                break;
            }
            case connectState.waitingForHints: {
                if (line === "***ENDHINTS") {
                    this._connectState = connectState.waitingforStart;
                    this._event.emit('HintsReceived', this._event, this._hints);
                }
                else {
                    this._hints.push(line);
                }
            }
            default: {
                console.error("Unexpected Message: " + line);
            }
        }
    }
    writeln(message) {
        this._commandQueue.push(message);
        if (this._commandQueue.length > 1000) {
            console.error("Too many Commands in Queue: Check Debugger Connection");
            throw new Error();
        }
        if (this._connectState !== connectState.disconnected) {
            while (this._commandQueue.length) {
                message = this._commandQueue.shift();
                try {
                    this._socket.write(message + "\n");
                }
                catch (_a) {
                    this._commandQueue.unshift(message);
                    break;
                }
            }
        }
    }
    sendBreakpoint(file, line, onOff) {
        if (onOff) {
            this.writeln("SETBP;" + file + ";" + line);
        }
        else {
            this.writeln("CLEARBP;" + file + ";" + line);
        }
    }
    start(file, stopAtStart) {
        if (stopAtStart) {
            if (file.indexOf("^")) {
                //Stop direct at given Label not at first line
                this.sendBreakpoint(file, 0, true);
            }
            else {
                this.sendBreakpoint(file, 1, true);
            }
        }
        this.requestBreakpoints();
        this.writeln("START;" + file);
    }
    step(type) {
        this.writeln(type);
    }
    continue() {
        this.writeln("CONTINUE");
    }
    disconnect() {
        this.writeln("RESET");
        this._socket.end();
    }
    requestBreakpoints() {
        this.writeln("REQUESTBP");
    }
    restart(file) {
        this.writeln("RESTART;" + file);
    }
    /**
     * Fire events if line has a breakpoint or hs stopped beacause of a different reason
     */
    checkEvents(internals) {
        const mumpsposition = internals["$ZPOSITION"];
        const mumpsstatus = internals["$ZSTATUS"];
        const parts = mumpsposition.split("^");
        const position = parts[0];
        const program = parts[1];
        const file = this._localRoutinesPath + program + ".m";
        this.loadSource(file);
        const startlabel = position.split("+")[0];
        let offset = 0;
        if (position.split("+")[1] !== undefined) {
            offset = parseInt(position.split("+")[1]);
        }
        let line = 0;
        if (startlabel !== "") {
            for (let ln = 0; ln < this._sourceLines.length; ln++) {
                if (this._sourceLines[ln].substring(0, startlabel.length) === startlabel) {
                    line = ln;
                    break;
                }
            }
        }
        this._currentLine = line + offset;
        if (mumpsstatus !== "" && internals["$ZTRAP"] === internals["$ZSTEP"]) {
            this.sendEvent('stopOnException', mumpsstatus);
            this._log(mumpsstatus);
        }
        else {
            const bps = this._breakPoints.filter(bp => bp.file === this._sourceFile && bp.line === this._currentLine);
            if (bps.length > 0) {
                this.sendEvent('stopOnBreakpoint');
            }
            else {
                this.sendEvent('stopOnStep');
            }
        }
    }
    /**
     * Returns the actual Stack
     */
    stack(startFrame, endFrame) {
        const frames = new Array();
        for (let i = startFrame; i < this._mStack.length; i++) {
            const position = this._mStack[i];
            if (position.indexOf("^") !== -1) {
                const fileposition = this.convertMumpsPosition(position);
                fileposition.line++; //Correction 0/1 based in Editor/GT.M
                frames.push({
                    index: i,
                    name: `${position}(${i})`,
                    file: fileposition.file,
                    line: fileposition.line
                });
            }
        }
        return {
            frames: frames,
            count: Math.min(frames.length, endFrame)
        };
    }
    /*
     * Set breakpoint in file with given line.
     */
    setBreakPoint(file, line) {
        const bp = { verified: false, file, line, id: this._breakpointId++ };
        this._breakPoints.push(bp);
        this.sendBreakpoint(file, bp.line + 1, true);
        return bp;
    }
    /*
     * Clear breakpoint in file with given line.
     */
    clearBreakPoint(file, line) {
        let bps = this._breakPoints;
        if (bps) {
            const index = bps.findIndex(bp => bp.file === file && bp.line === line);
            if (index >= 0) {
                const bp = bps[index];
                this.sendBreakpoint(file, bp.line, false);
                bps.splice(index, 1);
                return bp;
            }
        }
        return undefined;
    }
    /*
     * Clear all breakpoints
     */
    clearBreakpoints(file) {
        this.writeln("CLEARBP;" + file);
    }
    verifyBreakpoints() {
        let merk = [];
        this._breakPoints.forEach(bp => {
            bp.verified = false;
            for (let i = 0; i < this._activeBreakpoints.length; i++) {
                let internalBp = this.convertMumpsPosition(this._activeBreakpoints[i]);
                if (internalBp.file === bp.file && bp.line === internalBp.line) {
                    bp.verified = true;
                    this.sendEvent('breakpointValidated', bp);
                    merk[i] = true;
                    break;
                }
            }
            if (!bp.verified) {
                this.sendEvent('breakpointValidated', bp);
            }
        });
        for (let i = 0; i < this._activeBreakpoints.length; i++) {
            if (!merk[i]) {
                let internalBp = this.convertMumpsPosition(this._activeBreakpoints[i]);
                let bp = { 'verified': true, 'file': internalBp.file, 'line': internalBp.line, 'id': this._breakpointId++ };
                this.sendEvent('breakpointValidated', bp);
            }
        }
    }
    getVariables(type) {
        if (type === "system") {
            return this._mVars["I"];
        }
        else if (type === "local") {
            return this._mVars["V"];
        }
    }
    /*
    public buildLabelDb() {
        this.writeln("BUILDLABELDB");
    }

    public async requestHints(part: string) {
        return new Promise((resolve, reject) => {
            this._event.on('HintsReceived', function HintsReceived(event: EventEmitter, hints: string[]) {
                event.removeListener('HintsReceived', HintsReceived);
                resolve(hints);
            });
            this.writeln("GETHINTS;" + part);
        })
    }
    */
    checkRoutine(lines) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this._event.on('ErrorreportReceived', function ErrorreportReceived(event, errorLines) {
                    event.removeListener('ErrorreportReceived', ErrorreportReceived);
                    resolve(errorLines);
                });
                this.writeln("ERRCHK");
                for (let i = 0; i < lines.length; i++) {
                    this.writeln(lines[i]);
                }
                this.writeln("***ENDPROGRAM");
            });
        });
    }
    getSingleVar(expression) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let reply = { name: expression, indexCount: 0, content: "undefined", bases: [] };
                let varType = "V";
                if (expression.charAt(0) === "$") {
                    varType = "I";
                }
                if (this._mVars[varType] !== undefined) {
                    if (this._mVars[varType][expression] !== undefined) {
                        reply.content = this._mVars[varType][expression];
                        resolve(reply);
                    }
                    else {
                        this._event.on('SingleVarReceived', function SingleVarReceived(event, singleVar, singleVarContent) {
                            event.removeListener('SingleVarReceived', SingleVarReceived);
                            reply.name = singleVar;
                            reply.content = singleVarContent;
                            resolve(reply);
                        });
                        this.writeln("GETVAR;" + expression);
                    }
                }
                else {
                    resolve(reply);
                }
            });
        });
    }
    // private methods
    loadSource(file) {
        file = file.replace("%", "_");
        if (this._sourceFile !== file) {
            this._sourceFile = file;
            try {
                this._sourceLines = fs_1.readFileSync(this._sourceFile).toString().split('\n');
            }
            catch (_a) {
                console.log("Could not read Sourcefile " + file);
            }
        }
    }
    convertMumpsPosition(positionstring) {
        let parts = positionstring.split("^");
        let position = parts[0];
        if (parts[1] !== undefined) {
            let program = parts[1].split(" ", 1)[0];
            let file = (this._localRoutinesPath + program + ".m").replace("%", "_");
            try {
                let filecontent = fs_1.readFileSync(file).toString().split('\n');
                let startlabel = position.split("+")[0];
                let offset = 0;
                if (position.split("+")[1] !== undefined) {
                    offset = parseInt(position.split("+")[1]);
                }
                let line = 0;
                if (startlabel !== "") {
                    for (let ln = 0; ln < filecontent.length; ln++) {
                        if (filecontent[ln].substring(0, startlabel.length) === startlabel) {
                            line = ln;
                            break;
                        }
                    }
                }
                return { "file": file, "line": line + offset - 1 };
            }
            catch (_a) {
                console.log("Could not read Sourcefile " + file);
                return { "file": file, "line": 1 };
            }
        }
        else {
            return { "file": "", "line": 1 };
        }
    }
    sendEvent(event, ...args) {
        this.emit(event, ...args);
    }
}
exports.MConnect = MConnect;
//# sourceMappingURL=mconnect.js.map