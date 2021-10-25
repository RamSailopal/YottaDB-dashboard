"use strict";
/*
    Implementation of DebugProtocol-Server for GT.M, Yottadb by Jens Wulf
    based on Mock-Debug by Microsoft Corp.
    License: LGPL
*/
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
exports.MumpsDebugSession = void 0;
const vscode_debugadapter_1 = require("vscode-debugadapter");
const path_1 = require("path");
const { Subject } = require('await-notify');
const mconnect_1 = require("./mconnect");
const vscode = require("vscode");
const fs_1 = require("fs");
const MUMPSDIAGNOSTICS = vscode.languages.createDiagnosticCollection("mumps");
class MumpsDebugSession extends vscode_debugadapter_1.DebugSession {
    /**
     * Creates a new debug adapter that is used for one debug session.
     * We configure the default implementation of a debug adapter here.
     */
    constructor() {
        super();
        this._variableHandles = new vscode_debugadapter_1.Handles();
        this._configurationDone = new Subject();
        // this debugger uses zero-based lines and columns
        this.setDebuggerLinesStartAt1(false);
        this.setDebuggerColumnsStartAt1(false);
        this._program = "";
        this._mconnect = new mconnect_1.MConnect();
        // setup event handlers
        this._mconnect.on('stopOnEntry', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('entry', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnStep', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('step', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnBreakpoint', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('breakpoint', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnDataBreakpoint', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('data breakpoint', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('stopOnException', () => {
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent('exception', MumpsDebugSession.THREAD_ID));
        });
        this._mconnect.on('breakpointValidated', (bp) => {
            this.sendEvent(new vscode_debugadapter_1.BreakpointEvent('changed', { verified: bp.verified, id: bp.id }));
        });
        this._mconnect.on('end', () => {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        });
    }
    /**
     * The 'initialize' request is the first request called by the frontend
     * to interrogate the features the debug adapter provides.
     */
    initializeRequest(response, args) {
        // build and return the capabilities of this debug adapter:
        response.body = response.body || {};
        // the adapter implements the configurationDoneRequest.
        response.body.supportsConfigurationDoneRequest = true;
        // make VS Code to use 'evaluate' when hovering over source
        response.body.supportsEvaluateForHovers = true;
        // make VS Code to support data breakpoints
        response.body.supportsDataBreakpoints = false;
        // make VS Code to support completion in REPL
        response.body.supportsCompletionsRequest = false;
        response.body.completionTriggerCharacters = [".", "["];
        // make VS Code to send cancelRequests
        response.body.supportsCancelRequest = false;
        // make VS Code send the breakpointLocations request
        response.body.supportsBreakpointLocationsRequest = true;
        response.body.supportsExceptionInfoRequest = true;
        response.body.supportsRestartRequest = true;
        // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
        // we request them early by sending an 'initializeRequest' to the frontend.
        // The frontend will end the configuration sequence by calling 'configurationDone' request.
        this.sendResponse(response);
        this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
    }
    /**
     * Called at the end of the configuration sequence.
     * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
     */
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        // notify the launchRequest that configuration has finished
        this._configurationDone.notify();
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            // make sure to 'Stop' the buffered logging if 'trace' is not set
            //logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);
            // wait until configuration has finished (and configurationDoneRequest has been called)
            yield this._configurationDone.wait(1000);
            // start the program in the runtime
            this._mconnect.init(args.hostname, args.port, args.localRoutinesPath).then(() => __awaiter(this, void 0, void 0, function* () {
                this.refreshDiagnostics(vscode.window.activeTextEditor.document, MUMPSDIAGNOSTICS);
                this._mconnect.start(args.program, !!args.stopOnEntry);
                this._program = args.program;
                this.sendResponse(response);
            })).catch((error) => {
                vscode.window.showErrorMessage("Connection to MDEBUG failed. \nPlease start MDEBUG first.");
            });
        });
    }
    setBreakPointsRequest(response, args) {
        const path = args.source.path;
        const clientLines = args.lines || [];
        this._mconnect.clearBreakpoints(path);
        // set and verify breakpoint locations
        const actualBreakpoints = clientLines.map(l => {
            let { verified, line, id } = this._mconnect.setBreakPoint(path, this.convertClientLineToDebugger(l));
            const bp = new vscode_debugadapter_1.Breakpoint(verified, this.convertDebuggerLineToClient(line));
            bp.id = id;
            return bp;
        });
        // send back the actual breakpoint positions
        response.body = {
            breakpoints: actualBreakpoints
        };
        this.sendResponse(response);
        this._mconnect.requestBreakpoints();
    }
    threadsRequest(response) {
        // runtime supports no threads so just return a default thread.
        response.body = {
            threads: [
                new vscode_debugadapter_1.Thread(MumpsDebugSession.THREAD_ID, "thread 1")
            ]
        };
        this.sendResponse(response);
    }
    stackTraceRequest(response, args) {
        const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
        const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
        const endFrame = startFrame + maxLevels;
        const stk = this._mconnect.stack(startFrame, endFrame);
        response.body = {
            stackFrames: stk.frames.map(f => new vscode_debugadapter_1.StackFrame(f.index, f.name, this.createSource(f.file), this.convertDebuggerLineToClient(f.line))),
            totalFrames: stk.count
        };
        if (stk.count === 0) {
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        }
        this.sendResponse(response);
    }
    scopesRequest(response, args) {
        response.body = {
            scopes: [
                new vscode_debugadapter_1.Scope("Local", this._variableHandles.create("local|0"), true),
                new vscode_debugadapter_1.Scope("System", this._variableHandles.create("system"), false)
            ]
        };
        this.sendResponse(response);
    }
    variablesRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const variables = [];
            let insertVariable;
            const varId = this._variableHandles.get(args.variablesReference);
            if (varId === "system") {
                let varObject = this._mconnect.getVariables("system");
                for (let varname in varObject) {
                    variables.push({
                        name: varname,
                        type: 'string',
                        value: varObject[varname],
                        variablesReference: 0
                    });
                }
            }
            else {
                const varparts = varId.split("|");
                const indexCount = parseInt(varparts.pop());
                const varBase = varparts.join("|");
                let varObject = this._mconnect.getVariables("local");
                let lastVar;
                let firstTime = true;
                let lastRef = "";
                for (let varname in varObject) {
                    let actualVar = this.varAnalyze(varname, varObject[varname]);
                    if (firstTime) { //First Variable not processed
                        lastVar = actualVar;
                        firstTime = false;
                        continue;
                    }
                    if (insertVariable = this.checkVars(lastVar, actualVar, indexCount, varBase, lastRef)) {
                        if (insertVariable.variablesReference !== 0) {
                            lastRef = lastVar.bases[indexCount];
                        }
                        variables.push(insertVariable);
                    }
                    lastVar = actualVar;
                }
                if (!firstTime) { // process Last Variable if there was minimum one
                    const dummyVar = { name: "", "indexCount": 0, "bases": [], "content": "" };
                    if (insertVariable = this.checkVars(lastVar, dummyVar, indexCount, varBase, lastRef)) {
                        variables.push(insertVariable);
                    }
                }
            }
            response.body = {
                variables: variables
            };
            this.sendResponse(response);
        });
    }
    //checkVars checks if Variable has to be inserted in Var-Display and if it has descendants
    checkVars(lastVar, actualVar, indexCount, varBase, lastRef) {
        let returnVar = undefined;
        let actualReference = 0;
        if (indexCount === 0 || (lastVar.bases[indexCount - 1] === varBase && lastVar.indexCount > indexCount)) {
            if (lastVar.indexCount > indexCount + 1) {
                if (lastRef !== lastVar.bases[indexCount]) {
                    let name = lastVar.bases[indexCount];
                    if (indexCount > 0) {
                        name += ")";
                    }
                    returnVar = {
                        name,
                        type: 'string',
                        value: 'undefined',
                        variablesReference: this._variableHandles.create(lastVar.bases[indexCount] + "|" + (indexCount + 1))
                    };
                }
            }
            else { //lastVar.indexCount==indexCount+1
                if (lastVar.bases[indexCount] === actualVar.bases[indexCount]) {
                    actualReference = this._variableHandles.create(lastVar.bases[indexCount] + "|" + (indexCount + 1));
                }
                returnVar = {
                    name: lastVar.name,
                    type: 'string',
                    value: lastVar.content,
                    variablesReference: actualReference
                };
            }
        }
        return returnVar;
    }
    continueRequest(response, args) {
        this._mconnect.continue();
        this.sendResponse(response);
    }
    nextRequest(response, args) {
        this._mconnect.step("OVER");
        this.sendResponse(response);
    }
    stepInRequest(response, args, request) {
        this._mconnect.step("INTO");
        this.sendResponse(response);
    }
    stepOutRequest(response, args, request) {
        this._mconnect.step("OUTOF");
        this.sendResponse(response);
    }
    evaluateRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.context === "hover" || args.context === "repl") {
                this._mconnect.getSingleVar(args.expression).then((varReply) => {
                    response.body = {
                        result: varReply.name + " := " + varReply.content,
                        variablesReference: 0
                    };
                    this.sendResponse(response);
                });
            }
        });
    }
    restartRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            let sourceLines = fs_1.readFileSync(this._program).toString().split('\n');
            this._mconnect.checkRoutine(sourceLines).then((errorLines) => {
                if (errorLines.length) {
                    vscode.window.showErrorMessage("File contains Problems - No Restart possible!");
                }
                else {
                    this._mconnect.restart(this._program);
                }
            });
            this.sendResponse(response);
        });
    }
    disconnectRequest(response, args, request) {
        this._mconnect.disconnect();
        this.sendResponse(response);
    }
    createSource(filePath) {
        return new vscode_debugadapter_1.Source(path_1.basename(filePath), this.convertDebuggerPathToClient(filePath), undefined, undefined, 'mumps-adapter-data');
    }
    exceptionInfoRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const statVariable = yield this._mconnect.getSingleVar("$ZSTATUS");
            const status = statVariable.content.split(",");
            let trashlength = status[0].length + status[1].length + status[2].length + 4;
            let description = statVariable.content.substr(trashlength);
            response.body = {
                exceptionId: status[2],
                description,
                breakMode: 'always',
                details: {
                    message: 'Line :' + status[1],
                    typeName: 'ErrorException',
                }
            };
            this.sendResponse(response);
        });
    }
    varAnalyze(varname, content) {
        let indexcount = 1;
        let bases = [];
        let length = varname.length;
        let klammerpos = varname.indexOf("(");
        let countKomma = true;
        //let lastKommaPos = varname.length;
        if (klammerpos > 0) {
            bases.push(varname.substring(0, klammerpos));
            indexcount++;
            //lastKommaPos = klammerpos;
            for (let i = klammerpos; i < length; i++) {
                if (varname.substring(i, i + 1) === "," && countKomma) {
                    bases.push(varname.substring(0, i));
                    indexcount++;
                    //lastKommaPos = i;
                }
                if (varname.substring(i, i + 1) === '"') {
                    countKomma = !countKomma;
                }
            }
            bases.push(varname.substring(0, varname.length - 1));
        }
        else {
            bases.push(varname);
        }
        return { "name": varname, "indexCount": indexcount, "bases": bases, content };
    }
    refreshDiagnostics(doc, mumpsDiagnostics) {
        let diagnostics = [];
        if (doc) {
            let lines = [];
            for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
                const lineOfText = doc.lineAt(lineIndex);
                lines.push(lineOfText.text);
            }
            this._mconnect.checkRoutine(lines).then((errLines) => {
                for (let i = 0; i < errLines.length; i++) {
                    let errData = errLines[i].split(";");
                    let column = parseInt(errData[0]) - 1;
                    if (isNaN(column)) {
                        column = 0;
                    }
                    ;
                    let line = parseInt(errData[1]) - 1;
                    if (isNaN(line)) {
                        line = 0;
                    }
                    ;
                    let endColumn = doc.lineAt(line).text.length;
                    if (line === 0 && column === 0) {
                        endColumn = 0;
                    }
                    ;
                    let message = errData[2];
                    let range = new vscode.Range(line, column, line, endColumn);
                    let diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                    diagnostic.code = message;
                    diagnostics.push(diagnostic);
                }
                mumpsDiagnostics.clear();
                mumpsDiagnostics.set(doc.uri, diagnostics);
            });
        }
    }
}
exports.MumpsDebugSession = MumpsDebugSession;
// we don't support multiple threads, so we can use a hardcoded ID for the default thread
MumpsDebugSession.THREAD_ID = 1;
//# sourceMappingURL=mumpsDebug.js.map