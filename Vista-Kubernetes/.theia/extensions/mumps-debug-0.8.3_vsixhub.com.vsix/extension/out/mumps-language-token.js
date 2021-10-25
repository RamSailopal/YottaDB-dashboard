"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MumpsToken = void 0;
const vscode = require("vscode");
const definitionsArray = require('./../language-definitions.json');
const definitions = {};
exports.definitions = definitions;
let fs = require('fs');
let path = require('path');
let Position = vscode.Position;
let Uri = vscode.Uri;
const EXTENSIONS = ['.m', '.int', '.zwr', '.M', '.INT', '.ZWR'];
let cache = {};
class MumpsToken {
    constructor(document, position) {
        this.document = document;
        this.position = position;
        this.range = document.getWordRangeAtPosition(position);
        if (!this.range) {
            return;
        }
        this.word = document.getText(this.range);
        if (!this.word) {
            return;
        }
        this.surroundWord = getWordWithSurrounds(document, this.range) || this.word;
        if (this.isIntrinsic) {
            this.word = '$' + this.word;
        }
    }
    get mayBeCommand() {
        if (!this.surroundWord) {
            return false;
        }
        let lastChar = this.surroundWord.charAt(this.surroundWord.length - 1);
        return (isWhitespace(this.surroundWord.charAt(0)) || this.surroundWord.charAt(0) === ".") &&
            (lastChar === ':' ||
                isWhitespace(lastChar) ||
                this.surroundWord.length === this.word.length + 1); // end-of-line
    }
    get isIntrinsic() {
        if (!this.surroundWord) {
            return false;
        }
        return this.surroundWord.charAt(0) === '$' && this.surroundWord.charAt(1) !== '$';
    }
    get isFunctionCall() {
        if (!this.surroundWord) {
            return false;
        }
        return this.surroundWord.charAt(this.surroundWord.length - 1) === '(';
    }
    get isLabelReference() {
        if (this._isLabelReference === undefined) {
            let line = this.document.lineAt(this.range.start);
            let word = this.isIntrinsic ? this.word.substring(1) : this.word;
            let regex = new RegExp('(([ \t](D|DO|G|GOTO|J|JOB)[ \t]+)|\\$\\$)([%\\^\\+A-Z0-9]*' + word + '[%\\^\\+A-Z0-9]*)', 'i');
            let match = regex.exec(line.text);
            this._isLabelReference = match !== null;
            if (match) {
                let fullLabel = match[4];
                let partsRegex = /([%A-Z][%A-Z0-9]*)?(\+\d+)?(\^[%A-Z][%A-Z0-9]*)?/gi;
                let parts = partsRegex.exec(fullLabel);
                if (parts) {
                    this.label = parts[1];
                    this.labelOffset = Number(withoutFirstCharacter(parts[2]));
                    this.labelProgram = withoutFirstCharacter(parts[3]);
                }
                this.referredToLabel = this._lookupLabelReference();
            }
        }
        return this._isLabelReference;
    }
    get definition() {
        if (this._definition === undefined) {
            this._definition = false;
            let matches = definitions[this.word.toUpperCase()];
            if (matches) {
                for (let definition of matches) {
                    if (this.isFunctionCall && definition.type !== 'function') {
                        continue;
                    }
                    this._definition = definition;
                    break;
                }
            }
            else if (this.isLabelReference) {
                this._definition = this._createDefinitionForLabelReference(this.referredToLabel);
            }
            if (this._definition && this._definition.type === 'function') {
                this._definition.functionSignature = formatFunctionSignature(this._definition);
                if (this._definition.description === undefined) {
                    this._definition.description = "";
                }
                if (this.definition.commentText !== undefined) {
                    this._definition.description += "\n" + this.definition.commentText;
                }
                this._definition.parameters.forEach(parameter => {
                    if (parameter.description !== undefined) {
                        this._definition.description += "\n* " + parameter.description;
                    }
                });
            }
        }
        return this._definition;
    }
    _lookupLabelReference() {
        let uri = this.labelProgram ?
            siblingUri(this.document, this.labelProgram) :
            this.document.uri;
        let referredTo = findReferredToLabel(getText(uri, this.document), this.label);
        if (referredTo) {
            referredTo.position = new Position(referredTo.line + (this.labelOffset || 0), 0);
        }
        else {
            referredTo = {
                text: '',
                position: new Position(0, 0)
            };
        }
        referredTo.uri = uri;
        return referredTo;
    }
    _createDefinitionForLabelReference(referredTo) {
        if (!referredTo.text) {
            return;
        }
        let definitionRegex = /^([%A-Z][A-Z0-9]*)(\((,?[%A-Z][A-Z0-9]*)+\))?/i;
        let result = definitionRegex.exec(referredTo.text);
        if (!result) {
            return;
        }
        let commentText = '';
        if (referredTo.text.indexOf(';')) {
            commentText = referredTo.text.substring(referredTo.text.indexOf(';') + 1);
        }
        let parameters = [];
        let parametersByName = {};
        if (result[2] !== undefined) {
            parameters = result[2].substring(1, result[2].length - 1).split(',');
            for (let i = 0; i < parameters.length; i++) {
                parameters[i] = {
                    name: parameters[i],
                    type: 'any'
                };
                parametersByName[parameters[i].name] = parameters[i];
            }
        }
        let definition = {
            name: result[1],
            type: 'function',
            parameters,
            commentText,
            description: ''
        };
        if (referredTo.text) {
            let description = referredTo.text.match(/DESCRIPTION:.*/i);
            if (description !== null) {
                definition.description = description[0];
            }
            for (let param in parametersByName) {
                let paramDescription = referredTo.text.match(new RegExp(param + "\\(.*\\):.*", 'i'));
                if (paramDescription !== null) {
                    parametersByName[param].description = paramDescription;
                }
            }
            ;
        }
        return definition;
    }
}
exports.MumpsToken = MumpsToken;
function getWordWithSurrounds(document, range) {
    if (range.start.character <= 0) {
        return;
    }
    let start = new vscode.Position(range.start.line, range.start.character - 1);
    let end = new vscode.Position(range.end.line, range.end.character + 1);
    let surroundWord = document.getText(new vscode.Range(start, end));
    // check for two dollar signs
    if (surroundWord.charAt(0) === '$') {
        start = new vscode.Position(start.line, start.character - 1);
        let extendedWord = document.getText(new vscode.Range(start, end));
        if (extendedWord.charAt(0) === '$') {
            surroundWord = extendedWord;
        }
    }
    return surroundWord;
}
function isWhitespace(char) {
    return /\s+/.test(char);
}
function withoutFirstCharacter(string) {
    return string ? string.substring(1) : string;
}
function formatFunctionSignature(definition) {
    let signature = definition.name + '(';
    if (definition.parameters) {
        for (let i = 0; i < definition.parameters.length; i++) {
            signature += formatParameter(definition.parameters[i], i === 0);
        }
    }
    signature += ')';
    if (definition.returns) {
        signature += ':' + definition.returns.type;
    }
    return signature;
}
function formatParameter(parameter, first) {
    let s = (first ? '' : ',');
    s += parameter.name;
    s += ':' + parameter.type;
    if (parameter.optional) {
        s = '[' + s + ']';
    }
    return s;
}
function addDefinition(name, definition) {
    if (!definitions[name]) {
        definitions[name] = [definition];
    }
    else {
        definitions[name].push(definition);
    }
}
for (let definition of definitionsArray) {
    addDefinition(definition.name, definition);
    if (definition.abbreviation) {
        addDefinition(definition.abbreviation, definition);
    }
}
// get URI for given Mumps-Routine-Link
function siblingUri(document, fileName) {
    let siblingPath = path.resolve(document.uri.fsPath, '../' + fileName);
    if (!fs.existsSync(siblingPath)) {
        if (fileName.charAt(0) === '%') {
            return siblingUri(document, '_' + fileName.substring(1));
        }
        for (let extension of EXTENSIONS) {
            let extendedPath = siblingPath + extension;
            if (fs.existsSync(extendedPath)) {
                siblingPath = extendedPath;
                break;
            }
        }
    }
    return Uri.file(siblingPath);
}
function getText(uri, document) {
    if (uri === document.uri) {
        return document.getText();
    }
    if (uri.fsPath === cache.fsPath) {
        return cache.text;
    }
    try {
        cache.text = fs.readFileSync(uri.fsPath, 'utf8');
        cache.fsPath = uri.fsPath;
        return cache.text;
    }
    catch (e) {
        return '';
    }
}
function findReferredToLabel(text, label) {
    let lines = text.split("\n");
    let commentText = "";
    let i = 0;
    for (i = 0; i < lines.length; i++) {
        if (lines[i].match("^" + label) !== null) {
            commentText += lines[i] + "\n";
            for (let j = i - 1; j > 0; j--) {
                if (lines[j].length === 0 || lines[j].charAt(1) === ";") {
                    commentText += lines[j] + "\n";
                }
                else {
                    break;
                }
            }
            break;
        }
    }
    if (commentText.length > 0) {
        return {
            text: commentText,
            line: i
        };
    }
}
//# sourceMappingURL=mumps-language-token.js.map