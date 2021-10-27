"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionItemProvider = void 0;
const vscode = require("vscode");
const fs = require('fs');
class CompletionItemProvider {
    constructor(labeldb) {
        this._labelsReady = false;
        this._dbfile = labeldb;
        this._refreshLabelDB();
    }
    provideCompletionItems(document, position, token) {
        //let word = document.getText(document.getWordRangeAtPosition(position));
        let line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
        let status = getLineStatus(line, position.character);
        let clean = [];
        if (this._labelsReady && status.lineStatus === 'jumplabel') {
            let replaceRange = new vscode.Range(new vscode.Position(position.line, position.character - status.startstring.length), position);
            clean = this._findLabel(status.startstring, clean, replaceRange);
        }
        return clean;
    }
    _refreshLabelDB() {
        if (!fs.existsSync(this._dbfile)) {
            let db = {
                labels: [{ routine: '', label: '' }],
                routines: {}
            };
            fs.writeFileSync(this._dbfile, JSON.stringify(db));
        }
        fs.readFile(this._dbfile, (err, data) => {
            if (!err) {
                this._labelDB = JSON.parse(data);
                let dbChanged = false;
                vscode.workspace.findFiles('*.m').then((files) => {
                    this._filesToCheck = files.length;
                    for (let i = 0; i < files.length; i++) {
                        let path = files[i].fsPath;
                        fs.stat(path, false, (err, stats) => {
                            if (!err) {
                                let ms = this._labelDB.routines[path];
                                if (ms === undefined || stats.mtimeMs > ms) {
                                    this._labelDB.routines[path] = stats.mtimeMs;
                                    dbChanged = true;
                                    if (stats.size < 50000) { //parse only Files <50K
                                        this._refreshFileLabels(path);
                                    }
                                    else {
                                        this._checkReady(dbChanged);
                                    }
                                }
                                else {
                                    this._checkReady(dbChanged);
                                }
                            }
                            else {
                                this._checkReady(dbChanged);
                            }
                        });
                    }
                    this._labelsReady = true;
                });
            }
        });
    }
    _checkReady(dbChanged) {
        if (--this._filesToCheck === 0) {
            if (dbChanged) {
                fs.writeFile(this._dbfile, JSON.stringify(this._labelDB), (err) => {
                    if (err) {
                        vscode.window.showErrorMessage("Error writing Label DB");
                    }
                });
            }
        }
    }
    _refreshFileLabels(path) {
        let routine = path.replace('\\', '/').split('/').pop();
        routine = routine.split('.')[0].replace('_', '%');
        fs.readFile(path, 'utf8', (err, content) => {
            if (!err) {
                let lines = content.split('\n');
                let label = '';
                this._labelDB.labels = this._labelDB.labels.filter((label) => {
                    return label.routine !== routine;
                });
                for (let i = 0; i < lines.length; i++) {
                    if (i === 0) {
                        this._labelDB.labels.push({ label: '*FL', routine, line: lines[0] });
                    }
                    if (label = lines[i].match(/^[%A-Za-z0-9][A-Za-z0-9]{0,31}/)) {
                        this._labelDB.labels.push({ label: label[0], routine, line: lines[i] });
                    }
                }
            }
            this._checkReady(true);
        });
    }
    _findLabel(startstring, list, replaceRange) {
        //let hits = 0;
        let hitlist;
        let sortText = '';
        if (startstring.charAt(0) === '^') {
            let suchstring = startstring.substring(1);
            hitlist = this._labelDB.labels.filter((item) => {
                return item.routine.startsWith(suchstring);
            });
        }
        else {
            if (startstring.indexOf('^') !== -1) {
                let label = startstring.split('^')[0];
                let routinepart = startstring.split('^')[1];
                hitlist = this._labelDB.labels.filter((item) => {
                    let fits = item.label === label && item.routine.startsWith(routinepart);
                    return fits;
                });
            }
            else {
                hitlist = this._labelDB.labels.filter((item) => {
                    let fits = item.label.startsWith(startstring);
                    return fits;
                });
            }
        }
        for (let i = 0; i < hitlist.length; i++) {
            let item = hitlist[i];
            let label = item.label + '^' + item.routine;
            if (label === startstring) {
                continue;
            }
            if (item.label === "*FL") {
                if (!startstring.startsWith('^')) {
                    continue;
                }
                label = '^' + item.routine;
                sortText = "100";
            }
            let detail = '';
            if (item.line.charAt(item.label.length) === '(') {
                if (item.line.indexOf(')') !== -1) {
                    detail = item.line.split(')')[0] + ')';
                }
            }
            if (item.line.indexOf(';') !== -1) {
                detail += item.line.substring(item.line.indexOf(';') + 1);
            }
            if (detail.length > 0 && sortText !== '100') {
                sortText = '099';
            }
            list.push({ label, detail, sortText, range: replaceRange });
        }
        return list;
    }
}
exports.CompletionItemProvider = CompletionItemProvider;
function getLineStatus(line, position) {
    let lineStatus = 'lineStart';
    let lookPosition = 0;
    let lastCommand = '';
    let startstring = '';
    let isInsidePostcond = false;
    if (line) {
        while (lookPosition < position) {
            let char = line.substring(lookPosition, ++lookPosition);
            let isWhiteSpace = (char === " " || char === "\t");
            let isBeginOfVariable = char.match(/[A-Za-z%^]/);
            let isAlphaChar = char.match(/[A-Za-z]/);
            //let isAlphanumeric=char.match(/[A-Za-z0-9%]/);
            //let isOperand = char.match(/[*+-/\[\]']/);
            if (lineStatus !== 'string' && char === ';') {
                return { lineStatus: 'comment', startstring: '' };
            }
            if (!isBeginOfVariable) {
                if (startstring !== '' && char.match(/[0-9]/)) {
                    startstring += char;
                }
                else {
                    startstring = '';
                }
            }
            else {
                startstring += char;
            }
            switch (lineStatus) {
                case 'argument': {
                    if (isWhiteSpace) {
                        if (isInsidePostcond) {
                            isInsidePostcond = false;
                            if (lastCommand.match(/[D|DO|G|GOTO|J|JOB]/i)) {
                                lineStatus = 'jumplabel';
                            }
                        }
                        else {
                            lineStatus = 'command';
                            lastCommand = '';
                        }
                    }
                    else if (char === '"') {
                        lineStatus = 'string';
                    }
                    else if (isBeginOfVariable) {
                        lineStatus = 'variable';
                    }
                    else if (char === "$") {
                        lineStatus = 'function';
                    }
                    break;
                }
                case 'command': {
                    if (char === ":") {
                        lineStatus = 'argument';
                        isInsidePostcond = true;
                    }
                    else if (isAlphaChar) {
                        lastCommand += char;
                        break;
                    }
                    else if (isWhiteSpace) {
                        lineStatus = 'argument';
                        if (lastCommand.match(/[D|DO|G|GOTO|J|JOB]/i)) {
                            lineStatus = 'jumplabel';
                        }
                    }
                    else {
                        lineStatus = 'error';
                        return { lineStatus: 'error', startstring: '' };
                    }
                    break;
                }
                case 'function': {
                    if (isWhiteSpace) {
                        if (isInsidePostcond) {
                            isInsidePostcond = false;
                        }
                        else {
                            lineStatus = 'command';
                            lastCommand = '';
                        }
                    }
                    else if (char === "$") {
                        lineStatus = 'jumplabel';
                    }
                    else if (!isBeginOfVariable) {
                        lineStatus = 'argument';
                    }
                    break;
                }
                case 'jumplabel': {
                    if (isWhiteSpace) {
                        lineStatus = 'command';
                        lastCommand = '';
                    }
                    else if (char === ":") {
                        lineStatus = 'argument';
                    }
                    else if (char === "(") {
                        lineStatus = 'argument';
                    }
                    break;
                }
                case 'label': {
                    if (isWhiteSpace) {
                        lineStatus = 'command';
                    }
                    else if (char = '(') {
                        lineStatus = 'variable';
                    }
                    break;
                }
                case 'lineStart': {
                    if (isWhiteSpace) {
                        lineStatus = 'command';
                    }
                    else {
                        lineStatus = 'label';
                    }
                    break;
                }
                case 'string': {
                    if (char === '"') {
                        lineStatus = 'argument';
                    }
                    break;
                }
                case 'variable': {
                    if (isWhiteSpace) {
                        if (isInsidePostcond) {
                            isInsidePostcond = false;
                            lineStatus = 'argument';
                        }
                        else {
                            lineStatus = 'command';
                            lastCommand = '';
                        }
                    }
                    else if (!isBeginOfVariable) {
                        lineStatus = 'argument';
                    }
                    break;
                }
            }
        }
    }
    return { lineStatus, startstring };
}
//# sourceMappingURL=mumps-completion-item-provider.js.map