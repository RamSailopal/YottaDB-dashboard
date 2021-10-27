/*
Mumps-Debug-Extension for Visual Studio Code by Jens Wulf
*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const mumpsDebug_1 = require("./mumpsDebug");
const mumps_hover_provider_1 = require("./mumps-hover-provider");
const mumps_definition_provider_1 = require("./mumps-definition-provider");
const mumps_signature_help_provider_1 = require("./mumps-signature-help-provider");
const mumps_documenter_1 = require("./mumps-documenter");
const mumps_document_1 = require("./mumps-document");
const AutospaceFunction = require("./mumps-autospace");
let entryRef = "";
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const MUMPS_MODE = { language: 'mumps', scheme: 'file' };
        // register a configuration provider for 'mumps' debug type
        const mumpsDiagnostics = vscode.languages.createDiagnosticCollection("mumps");
        context.subscriptions.push(vscode.commands.registerCommand('mumps.getEntryRef', () => {
            return vscode.window.showInputBox({
                placeHolder: "Please enter the Entry-Reference to start Debugging",
                value: entryRef
            });
        }));
        context.subscriptions.push(mumpsDiagnostics, vscode.commands.registerCommand("mumps.documentFunction", () => { mumps_documenter_1.DocumentFunction(); }), vscode.commands.registerCommand("mumps.autoSpaceEnter", () => { AutospaceFunction.autoSpaceEnter(); }), vscode.commands.registerCommand("mumps.autoSpaceTab", () => { AutospaceFunction.autoSpaceTab(); }), vscode.languages.registerHoverProvider(MUMPS_MODE, new mumps_hover_provider_1.MumpsHoverProvider()), vscode.languages.registerDefinitionProvider(MUMPS_MODE, new mumps_definition_provider_1.MumpsDefinitionProvider()), vscode.languages.registerSignatureHelpProvider(MUMPS_MODE, new mumps_signature_help_provider_1.MumpsSignatureHelpProvider(), '(', ','), vscode.languages.registerDocumentSymbolProvider(MUMPS_MODE, new mumps_document_1.MumpsDocumentSymbolProvider()), vscode.languages.registerDocumentFormattingEditProvider(MUMPS_MODE, {
            provideDocumentFormattingEdits: (document, options, token) => {
                let textEdits = [];
                for (var i = 0; i < document.lineCount; i++) {
                    let line = document.lineAt(i).text;
                    formatDocumentLine(line, i, textEdits);
                }
                return textEdits;
            }
        }), vscode.languages.registerDocumentRangeFormattingEditProvider(MUMPS_MODE, {
            provideDocumentRangeFormattingEdits: (document, range, options, token) => {
                let textEdits = [];
                for (var i = range.start.line; i <= range.end.line; i++) {
                    let line = document.lineAt(i).text;
                    formatDocumentLine(line, i, textEdits);
                }
                return textEdits;
            }
        }), vscode.debug.registerDebugConfigurationProvider('mumps', new MumpsConfigurationProvider()), vscode.debug.registerDebugAdapterDescriptorFactory('mumps', new InlineDebugAdapterFactory()));
        //vscode.debug.onDidStartDebugSession(()=>refreshDiagnostics(vscode.window.activeTextEditor!.document, mumpsDiagnostics))
        //subscribeToDocumentChanges(context, mumpsDiagnostics);
        //vscode.languages.registerCodeActionsProvider({scheme:'file', language:'mumps'},new MumpsSpellChecker(),{providedCodeActionKinds:MumpsSpellChecker.providedCodeActionKinds})
        vscode.languages.registerEvaluatableExpressionProvider(MUMPS_MODE, {
            provideEvaluatableExpression(document, position) {
                const diags = mumpsDiagnostics.get(document.uri);
                //If Position is inside Error-marked Area then no Check for Variables is performed
                if (diags) {
                    const found = diags.find(diag => diag.range.contains(position));
                    if (found) {
                        return undefined;
                    }
                }
                const lineContent = document.lineAt(position.line).text;
                let expression = /([ (,+\-\*_:=])(\^?%?[a-zA-Z][a-zA-Z\d]*(\(.[^\)]+\))?)/g;
                if (lineContent.substring(position.character, position.character + 1) !== ")") {
                    expression = /([ (,+\-\*_:=])(\^?%?[a-zA-Z][a-zA-Z\d]*)/g;
                }
                let result = null;
                // find the word under the cursor
                while (result = expression.exec(lineContent)) {
                    let start = result.index;
                    start += result[0].length - result[2].length; // ignore first part of expression
                    let end = start + result[2].length - 1;
                    if (start <= position.character && end >= position.character) {
                        return new vscode.EvaluatableExpression(new vscode.Range(position.line, start, position.line, end), result[2]);
                    }
                }
                return undefined;
                //	const wordRange = document.getWordRangeAtPosition(position);
                //return wordRange ? new vscode.EvaluatableExpression(wordRange) : undefined;
            }
        });
    });
}
exports.activate = activate;
function deactivate() {
    // nothing to do
}
exports.deactivate = deactivate;
class MumpsConfigurationProvider {
    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
    */
    resolveDebugConfiguration(folder, config, token) {
        // if launch.json is missing or empty
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'mumps') {
                config.type = 'mumps';
                config.name = 'Launch';
                config.request = 'launch';
                config.program = '${file}';
                config.stopOnEntry = true;
                config.hostname = '127.0.0.1';
                config.localRoutinesPath = 'y:\\',
                    config.port = 9000;
            }
        }
        if (!config.program) {
            return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
                return undefined; // abort launch
            });
        }
        return config;
    }
}
class InlineDebugAdapterFactory {
    createDebugAdapterDescriptor(_session) {
        return new vscode.DebugAdapterInlineImplementation(new mumpsDebug_1.MumpsDebugSession());
    }
}
function formatDocumentLine(line, lineNumber, textEdits) {
    let emptyLine = line.replace(/(\ |\t)/ig, "");
    if (emptyLine.length == 0) {
        textEdits.push(vscode.TextEdit.insert(new vscode.Position(lineNumber, 0), "\t;"));
    }
    if (line.endsWith(". ")) {
        textEdits.push(vscode.TextEdit.insert(new vscode.Position(lineNumber, line.length), ";"));
    }
    else if (line.endsWith(".")) {
        textEdits.push(vscode.TextEdit.insert(new vscode.Position(lineNumber, line.length), " ;"));
    }
    if (line.startsWith(" ")) {
        let endSpace;
        console.log("start");
        for (endSpace = 0; endSpace < line.length; endSpace++) {
            if (line.charAt(endSpace) != " ") {
                break;
            }
        }
        textEdits.push(vscode.TextEdit.replace(new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, endSpace)), "\t"));
    }
}
//# sourceMappingURL=extension1.js.map