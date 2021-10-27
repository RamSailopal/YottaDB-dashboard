"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionItem = void 0;
const vscode = require("vscode");
/**
 * Implements the CompletionItem returned by autocomplete
 *
 * @class CompletionItem
 * @extends {vscode.CompletionItem}
 */
class CompletionItem extends vscode.CompletionItem {
    constructor(word, file) {
        super(word);
        this.kind = vscode.CompletionItemKind.Text;
        this.count = 1;
        this.file = file;
    }
    static copy(item) {
        let newItem = new CompletionItem(item.label, item.file);
        newItem.count = item.count;
        newItem.details = item.details;
        return newItem;
    }
}
exports.CompletionItem = CompletionItem;
//# sourceMappingURL=CompletionItem.js.map