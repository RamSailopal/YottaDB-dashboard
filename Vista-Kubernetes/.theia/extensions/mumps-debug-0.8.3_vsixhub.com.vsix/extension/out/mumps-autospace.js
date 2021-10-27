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
exports.autoSpaceEnter = exports.autoSpaceTab = void 0;
const vscode = require("vscode");
let em = require('emcellent');
function autoSpaceEnter() {
    return __awaiter(this, void 0, void 0, function* () {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let pos = editor.selection.active;
            let currentLine = editor.document.lineAt(pos.line).text;
            let parsed = em.parse(currentLine);
            let newLine = '';
            if (pos.character !== 0) {
                //check for removing a trailing .
                if ((parsed[0].lineRoutines === undefined || parsed[0].lineRoutines.length === 0) && currentLine.indexOf(";") === -1 && parsed[0].lineIndentationArray !== undefined && parsed[0].lineIndentationArray.length > 0) {
                    parsed[0].lineIndentationArray.splice(-1);
                    editor.edit((editBuilder) => {
                        editBuilder.replace(new vscode.Range(pos.with(pos.line, 0), pos.with(pos.line, currentLine.length)), em.render(parsed));
                    });
                    //check for adding indentation to the new line
                }
                else {
                    if (parsed[0].lineIndentationArray === undefined) {
                        parsed[0].lineIndentationArray = [];
                    }
                    if (lineContainsNoParamDo(parsed[0])) {
                        parsed[0].lineIndentationArray.push(" ");
                    }
                    parsed[0].lineRoutines = [];
                    delete parsed[0].lineComment;
                    delete parsed[0].lineLabel;
                    newLine = em.render(parsed);
                }
            }
            editor.edit((editBuilder) => {
                editBuilder.insert(pos, "\n" + newLine);
            });
        }
    });
}
exports.autoSpaceEnter = autoSpaceEnter;
function lineContainsNoParamDo(parsed) {
    let cmds = parsed.lineRoutines;
    if (cmds = parsed.lineRoutines) {
        for (let i = 0; i < cmds.length; i++) {
            if (cmds[i].mRoutine.match(/(d|do)/i) && !cmds[i].mArguments) {
                return true;
            }
        }
    }
    return false;
}
function autoSpaceTab() {
    return __awaiter(this, void 0, void 0, function* () {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let pos = editor.selection.active;
            let currentLine = editor.document.lineAt(pos.line).text;
            let parsed = em.parse(currentLine);
            if ((parsed[0].lineRoutines === undefined || parsed[0].lineRoutines.length === 0) &&
                currentLine.indexOf(";") === -1 && parsed[0].lineIndentationArray !== undefined &&
                parsed[0].lineIndentationArray.length > 0) {
                parsed[0].lineIndentationArray.push(" ");
                editor.edit((editBuilder) => {
                    if (currentLine.charAt(pos.character - 1) === " ") {
                        editBuilder.insert(pos.with(pos.line, pos.character), ". ");
                    }
                    else {
                        editBuilder.insert(pos.with(pos.line, pos.character), " . ");
                    }
                });
            }
            else {
                editor.edit((eb) => {
                    eb.insert(pos, "\t");
                });
            }
        }
    });
}
exports.autoSpaceTab = autoSpaceTab;
//# sourceMappingURL=mumps-autospace.js.map