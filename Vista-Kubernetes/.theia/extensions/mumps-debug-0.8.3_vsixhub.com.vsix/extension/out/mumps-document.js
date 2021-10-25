"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MumpsDocumentSymbolProvider = void 0;
const vscode = require("vscode");
const parser = require("./parser/parser");
class MumpsDocumentSymbolProvider {
    provideDocumentSymbols(document) {
        return new Promise(resolve => {
            let parsedDoc = parser.parseText(document.getText());
            let symbols = [];
            parsedDoc.methods.forEach(method => {
                let kind = vscode.SymbolKind.Function;
                let startPosition = new vscode.Position(method.id.position.line, 0);
                let endPostionLine = (method.endLine === -1) ? document.lineCount - 1 : method.endLine;
                let endPosition = new vscode.Position(endPostionLine, 0);
                let methodRange = new vscode.Location(document.uri, new vscode.Range(startPosition, endPosition));
                symbols.push(new vscode.SymbolInformation(method.id.value, kind, '', methodRange));
            });
            resolve(symbols);
        });
    }
}
exports.MumpsDocumentSymbolProvider = MumpsDocumentSymbolProvider;
//# sourceMappingURL=mumps-document.js.map