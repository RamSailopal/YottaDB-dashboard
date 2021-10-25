"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MumpsTokenHelper = void 0;
const vscode = require("vscode");
const mumpsLineParser_1 = require("./mumpsLineParser");
const parser = new mumpsLineParser_1.MumpsLineParser();
const definitionsArray = require('./../language-definitions.json');
const definitions = {};
let fs = require('fs');
let path = require('path');
let Uri = vscode.Uri;
const EXTENSIONS = ['.m', '.int', '.zwr', '.M', '.INT', '.ZWR'];
let cache = {};
function addDefinition(name, definition) {
    if (!definitions[name]) {
        definitions[name] = [definition];
    }
    else {
        definitions[name].push(definition);
    }
}
if (Object.keys(definitions).length === 0) {
    for (let definition of definitionsArray) {
        addDefinition(definition.name, definition);
        if (definition.abbreviation) {
            addDefinition(definition.abbreviation, definition);
        }
    }
}
class MumpsTokenHelper {
    constructor(document, position) {
        this._document = document;
        this._position = position;
    }
    _getText(uri) {
        if (uri === this._document.uri) {
            return this._document.getText();
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
    getTokenSignature() {
        let line = this._document.lineAt(this._position);
        if (!line) {
            return;
        }
        let text = line.text;
        let myToken = this._getFunctionToken(text);
        if (myToken === undefined || (myToken.type !== mumpsLineParser_1.TokenType.ifunction && myToken.type !== mumpsLineParser_1.TokenType.exfunction)) {
            return;
        }
        let definition = this.getTokenData(myToken.name, myToken.type);
        if (!definition) {
            return;
        }
        let help = new vscode.SignatureHelp();
        help.signatures = [this.convertDefinition(definition)];
        help.activeSignature = 0;
        help.activeParameter = this._calculateActiveParameter(line.text, myToken.position + myToken.name.length, this._position.character);
        return help;
    }
    getTokenHoverInfo() {
        let myToken = parser.getTokenAt(this._document.lineAt(this._position).text, this._position.character);
        if (myToken === undefined) {
            return;
        }
        if (myToken.type === mumpsLineParser_1.TokenType.exfunction || myToken.type === mumpsLineParser_1.TokenType.ifunction ||
            myToken.type === mumpsLineParser_1.TokenType.entryref || myToken.type === mumpsLineParser_1.TokenType.keyword) {
            let definition = this.getTokenData(myToken.name, myToken.type);
            if (!definition) {
                return;
            }
            if (definition.parameters) {
                definition.name += "(";
                for (let i = 0; i < definition.parameters.length; i++) {
                    if (i !== 0) {
                        definition.name += ",";
                    }
                    definition.name += definition.parameters[i].name;
                }
                definition.name += ")";
            }
            let snippet = { language: 'mumps', value: definition.name };
            return new vscode.Hover([snippet, definition.commentText || definition.description]);
        }
    }
    _calculateActiveParameter(lineText, parametersStartIndex, insertIndex) {
        let active = 0;
        let depth = 0;
        let isInsideString = false;
        for (let i = parametersStartIndex + 1; i < insertIndex; i++) {
            let char = lineText.charAt(i);
            if (char === '(' && !isInsideString) {
                depth++;
            }
            else if (char === ')' && !isInsideString) {
                depth--;
            }
            else if (char === '"') {
                isInsideString = !isInsideString;
            }
            else if (char === ',' && depth === 0 && !isInsideString) {
                active++;
            }
        }
        return active;
    }
    getTokenRefLocation() {
        let myToken = parser.getTokenAt(this._document.lineAt(this._position).text, this._position.character);
        if (myToken === undefined) {
            return;
        }
        if (myToken.type === mumpsLineParser_1.TokenType.entryref || myToken.type === mumpsLineParser_1.TokenType.exfunction) {
            let tokendata = this.getTokenData(myToken.name, myToken.type);
            if (tokendata) {
                return tokendata.location;
            }
        }
    }
    getTokenData(functionName, functionType) {
        if (functionType === mumpsLineParser_1.TokenType.ifunction || functionType === mumpsLineParser_1.TokenType.keyword) {
            let matches = definitions[functionName.toUpperCase()];
            if (matches) {
                for (let definition of matches) {
                    if (definition.type !== 'function' && definition.type !== "command") {
                        continue;
                    }
                    return Object.assign({}, definition);
                }
            }
            else {
                return;
            }
        }
        else if (functionType === mumpsLineParser_1.TokenType.exfunction || functionType === mumpsLineParser_1.TokenType.entryref) {
            let locationInfo = this.getPositionForLabel(functionName);
            if (locationInfo) {
                return this._extractDefinition(locationInfo);
            }
        }
        else {
            return;
        }
    }
    convertDefinition(definition) {
        let data = {
            name: "",
            description: "",
            parameters: []
        };
        data.description = definition.description;
        if (definition.parameters) {
            data.name = definition.name + '(';
            for (let i = 0; i < definition.parameters.length; i++) {
                let parameter = definition.parameters[i];
                let description = parameter.optional ? '(optional) ' : '';
                description += parameter.description || parameter.name;
                data.parameters.push(new vscode.ParameterInformation(parameter.name, description));
                if (parameter.optional) {
                    data.name += '[';
                }
                data.name += (i === 0 ? '' : ',');
                data.name += parameter.name + ':' + parameter.type;
                if (parameter.optional) {
                    data.name += ']';
                }
            }
            data.name += ')';
            if (definition.returns) {
                data.name += ':' + definition.returns;
            }
        }
        let signature = new vscode.SignatureInformation(data.name, data.description);
        signature.parameters = data.parameters;
        return signature;
    }
    getPositionForLabel(label) {
        let fileUri = this._document.uri;
        let nakedLabel = label.split("^")[0];
        let offset = 0;
        let labelLine = "";
        if (nakedLabel.split("+")[1] !== undefined) {
            offset = parseInt(label.split("+")[1]);
            nakedLabel = nakedLabel.split("+")[0];
        }
        if (label.indexOf("^") !== -1) {
            let fileName = label.split("^")[1];
            if (fileName.charAt(0) === '%') {
                fileName = '_' + fileName.substring(1);
            }
            let fullPath = path.resolve(this._document.uri.fsPath, '../' + fileName);
            for (let extension of EXTENSIONS) {
                let extendedPath = fullPath + extension;
                if (fs.existsSync(extendedPath)) {
                    fullPath = extendedPath;
                    break;
                }
            }
            fileUri = Uri.file(fullPath);
        }
        let lines = this._getText(fileUri).split("\n");
        let commentText = "";
        let i = 0;
        let labelLength = nakedLabel.length;
        for (i = 0; i < lines.length; i++) {
            if (lines[i].substr(0, labelLength) === nakedLabel && lines[i].substr(labelLength, 1).match(/(;|\s|\()/) !== null) {
                labelLine = lines[i];
                commentText += lines[i] + "\n";
                for (let j = i - 1; j > 0; j--) {
                    if (lines[j].length === 0 || lines[j].match(/^\s*;/)) {
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
            commentText = commentText.split("\n").reverse().join("\n");
            return {
                commentText,
                location: new vscode.Location(fileUri, new vscode.Position(i + offset, 0)),
                labelLine
            };
        }
        return;
    }
    _extractDefinition(locationInfo) {
        let definition = {
            name: '',
            type: 'function',
            commentText: '',
            description: '',
            returns: '',
            location: locationInfo.location
        };
        let labelLines = locationInfo.commentText;
        definition.commentText = labelLines;
        let definitionRegex = /^([%A-Z][A-Z0-9]*)(\((,?[%A-Z][A-Z0-9]*)+\))?/i;
        let result = definitionRegex.exec(locationInfo.labelLine);
        if (!result) {
            return;
        }
        definition.name = result[1];
        if (labelLines.indexOf(';')) {
            definition.commentText = labelLines.substring(labelLines.indexOf(';') + 1);
        }
        let parameterNames = [];
        let parametersByName = {};
        if (result[2] !== undefined) {
            parameterNames = result[2].substring(1, result[2].length - 1).split(',');
            definition.parameters = [];
            for (let i = 0; i < parameterNames.length; i++) {
                definition.parameters.push({
                    name: parameterNames[i],
                    type: 'any'
                });
                parametersByName[parameterNames[i]] = definition.parameters.length - 1;
            }
        }
        if (labelLines !== "") {
            let description = labelLines.match(/DESCRIPTION:.*/i);
            if (description !== null) {
                definition.description = description[0];
            }
            for (let param in parametersByName) {
                let paramDescription = labelLines.match(new RegExp("\\s" + param + "(\\(.*\\))?:.*", 'i'));
                if (paramDescription !== null) {
                    definition.parameters[parametersByName[param]].description = paramDescription[0];
                }
            }
            ;
        }
        return definition;
    }
    _getFunctionToken(lineText) {
        let depth = 1;
        let index;
        let linePosition = this._position.character;
        for (index = linePosition - 1; index > 0 && depth > 0; index--) {
            let char = lineText.charAt(index);
            if (char === ')') {
                depth++;
            }
            else if (char === '(') {
                depth--;
            }
        }
        if (depth > 0 || index <= 0) {
            return;
        }
        return parser.getTokenAt(lineText, index);
    }
}
exports.MumpsTokenHelper = MumpsTokenHelper;
//# sourceMappingURL=mumpsTokenData.js.map