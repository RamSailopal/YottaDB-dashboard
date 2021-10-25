'use strict';
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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const mumpsDebug_1 = require("./mumpsDebug");
const mumps_evalutable_expression_provider_1 = require("./mumps-evalutable-expression-provider");
const mumps_hover_provider_1 = require("./mumps-hover-provider");
const mumps_definition_provider_1 = require("./mumps-definition-provider");
const mumps_formatting_help_provider_1 = require("./mumps-formatting-help-provider");
const mumps_signature_help_provider_1 = require("./mumps-signature-help-provider");
const mumps_documenter_1 = require("./mumps-documenter");
const mumps_document_1 = require("./mumps-document");
const mumps_completion_item_provider_1 = require("./mumps-completion-item-provider");
const AutospaceFunction = require("./mumps-autospace");
const mumpsLineParser_1 = require("./mumpsLineParser");
const mumps_highlighter_1 = require("./mumps-highlighter");
const mumpsCompExp_1 = require("./mumpsCompExp");
const parser = new mumpsLineParser_1.MumpsLineParser;
const fs = require('fs');
let timeout;
let entryRef = "";
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const MUMPS_MODE = { language: 'mumps', scheme: 'file' };
        // register a configuration provider for 'mumps' debug type
        const mumpsDiagnostics = vscode.languages.createDiagnosticCollection("mumps");
        let storage = context.storageUri.fsPath;
        if (!fs.existsSync(storage)) {
            fs.mkdirSync(storage);
        }
        const dbFile = storage + "/labeldb.json";
        const wsState = context.workspaceState;
        context.subscriptions.push(vscode.commands.registerCommand("mumps.documentFunction", () => { mumps_documenter_1.DocumentFunction(); }), vscode.commands.registerCommand("mumps.autoSpaceEnter", () => { AutospaceFunction.autoSpaceEnter(); }), vscode.commands.registerCommand("mumps.autoSpaceTab", () => { AutospaceFunction.autoSpaceTab(); }), vscode.commands.registerCommand("mumps.toggleExpandedCommands", () => { mumpsCompExp_1.expandCompress(wsState); }), vscode.commands.registerCommand('mumps.getEntryRef', () => { return getEntryRef(); }), vscode.languages.registerHoverProvider(MUMPS_MODE, new mumps_hover_provider_1.MumpsHoverProvider()), vscode.languages.registerDefinitionProvider(MUMPS_MODE, new mumps_definition_provider_1.MumpsDefinitionProvider()), vscode.languages.registerEvaluatableExpressionProvider(MUMPS_MODE, new mumps_evalutable_expression_provider_1.MumpsEvalutableExpressionProvider()), vscode.languages.registerSignatureHelpProvider(MUMPS_MODE, new mumps_signature_help_provider_1.MumpsSignatureHelpProvider(), '(', ','), vscode.languages.registerDocumentSymbolProvider(MUMPS_MODE, new mumps_document_1.MumpsDocumentSymbolProvider()), vscode.languages.registerCompletionItemProvider(MUMPS_MODE, new mumps_completion_item_provider_1.CompletionItemProvider(dbFile)), vscode.languages.registerDocumentSemanticTokensProvider(MUMPS_MODE, mumps_highlighter_1.MumpsHighlighter, mumps_highlighter_1.SemanticTokens), vscode.languages.registerDocumentFormattingEditProvider(MUMPS_MODE, new mumps_formatting_help_provider_1.MumpsFormattingHelpProvider()), vscode.languages.registerDocumentRangeFormattingEditProvider(MUMPS_MODE, new mumps_formatting_help_provider_1.MumpsFormattingHelpProvider()), vscode.debug.registerDebugConfigurationProvider('mumps', new MumpsConfigurationProvider()), vscode.debug.registerDebugAdapterDescriptorFactory('mumps', new InlineDebugAdapterFactory()), vscode.window.onDidChangeActiveTextEditor(editor => { if (editor) {
            triggerUpdateDiagnostics(editor.document, mumpsDiagnostics);
        } }), vscode.workspace.onDidChangeTextDocument(editor => { if (editor) {
            triggerUpdateDiagnostics(editor.document, mumpsDiagnostics);
        } }));
    });
}
exports.activate = activate;
function deactivate() {
    // nothing to do
}
exports.deactivate = deactivate;
class MumpsConfigurationProvider {
    /**
     * Message a debug configuration just before a debug session is being launched,
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
                config.hostname = '192.168.0.1';
                config.localRoutinesPath = 'y:\\';
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
function updateDiagnostics(document, collection) {
    if (document && document.languageId === 'mumps') {
        collection.clear();
        let diags = [];
        for (let i = 0; i < document.lineCount; i++) {
            let line = document.lineAt(i);
            let diag = parser.checkLine(line.text);
            if (diag.text !== '') {
                diags.push({
                    code: '',
                    message: diag.text,
                    range: new vscode.Range(new vscode.Position(i, diag.position), new vscode.Position(i, line.text.length)),
                    severity: vscode.DiagnosticSeverity.Error,
                    source: '',
                });
            }
        }
        if (diags) {
            collection.set(document.uri, diags);
        }
    }
}
function triggerUpdateDiagnostics(document, collection) {
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
    timeout = setTimeout(() => updateDiagnostics(document, collection), 500);
}
function getEntryRef() {
    return vscode.window.showInputBox({
        placeHolder: "Please enter the Entry-Reference to start Debugging",
        value: entryRef
    });
}
//# sourceMappingURL=extension.js.map