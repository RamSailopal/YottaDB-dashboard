"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandCompress = void 0;
const vscode = require("vscode");
const mumpsLineParser_1 = require("./mumpsLineParser");
const parser = new mumpsLineParser_1.MumpsLineParser;
function expandCompress(state) {
    let doExpand = true;
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        let filename = editor.document.fileName;
        if (state.get(filename + "_expandState") === true) {
            doExpand = false;
            state.update(filename + "_expandState", false);
        }
        else {
            state.update(filename + "_expandState", true);
        }
        let document = editor.document.getText();
        let lines = document.split("\n");
        let lineCount = lines.length;
        if (lineCount) {
            let lastLineLength = lines[lineCount - 1].length;
            for (let i = 0; i < lineCount; i++) {
                let info = parser.expandCompressLine(lines[i], doExpand);
                if (info.errorText === '') {
                    lines[i] = info.lineText;
                }
            }
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(0, 0, lineCount, lastLineLength), lines.join("\n"));
            });
        }
    }
}
exports.expandCompress = expandCompress;
//# sourceMappingURL=mumpsCompExp.js.map