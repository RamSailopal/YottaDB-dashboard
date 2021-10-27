"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Type = exports.Token = exports.getTokens = void 0;
const vscode_1 = require("vscode");
// Code adapted from the vscode-psl extension by ing-bank
function* getTokens(documentContents) {
    let tokenizer = new Tokenizer();
    for (let char of documentContents) {
        tokenizer.charType = getType(char);
        if (tokenizer.tokenType === 0) {
            tokenizer.tokenType = tokenizer.charType;
        }
        while (!tokenizer.parsed) {
            if (tokenizer.parseCharacter(char)) {
                yield tokenizer.finalizedToken;
            }
        }
        tokenizer.parsed = false;
    }
    // if there is an unfinished token left
    if (tokenizer.tokenType !== 0) {
        tokenizer.finalizeToken(0);
        yield tokenizer.finalizedToken;
    }
}
exports.getTokens = getTokens;
class Token {
    constructor(type, value, position) {
        this.type = type;
        this.value = value;
        this.position = position;
    }
    getRange() {
        let start = this.position;
        let end = new vscode_1.Position(this.position.line, this.position.character + this.value.length);
        return new vscode_1.Range(start, end);
    }
    isAlphanumeric() {
        return this.type === 1 /* Alphanumeric */;
    }
    isCloseParen() {
        return this.type === 41 /* CloseParen */;
    }
    isComma() {
        return this.type === 44 /* Comma */;
    }
    isLineComment() {
        return this.type === 3 /* LineComment */;
    }
    isLineCommentInit() {
        return this.type === 6 /* LineCommentInit */;
    }
    isNewLine() {
        return this.type === 13 /* NewLine */;
    }
    isNumeric() {
        return this.type === 2 /* Numeric */;
    }
    isOpenParen() {
        return this.type === 40 /* OpenParen */;
    }
    isSpace() {
        return this.type === 32 /* Space */;
    }
    isTab() {
        return this.type === 11 /* Tab */;
    }
    isWhiteSpace() {
        return this.type === 32 /* Space */ || this.type === 11 /* Tab */ || this.type === 13 /* NewLine */ || this.type === -1 /* Undefined */;
    }
}
exports.Token = Token;
class Tokenizer {
    constructor() {
        this.documentLine = 0;
        this.documentColumn = 0;
        this.charType = 0;
        this.tokenType = 0;
        this.tokenValue = '';
        this.tokenPosition = new vscode_1.Position(this.documentLine, this.documentColumn);
        this.parsed = false;
        this.stringOpen = false;
        this.firstSlash = false;
        this.asterisk = false;
    }
    /**
     *
     * @param char current character being parsed
     * @returns true if token is finalized
     */
    parseCharacter(char) {
        if (this.tokenType === 1 /* Alphanumeric */) {
            if (this.charType === 1 /* Alphanumeric */ || this.charType === 2 /* Numeric */) {
                this.updateTokenAndAdvanceCursor(char);
                return false;
            }
            else {
                this.finalizeToken(this.charType);
                return true;
            }
        }
        else if (this.tokenType === 2 /* Numeric */) {
            if (this.charType === 2 /* Numeric */) {
                this.updateTokenAndAdvanceCursor(char);
                return false;
            }
            else {
                this.finalizeToken(this.charType);
                return true;
            }
        }
        else if (this.tokenType === 3 /* LineComment */) {
            if (this.charType !== 13 /* NewLine */) {
                this.updateTokenAndAdvanceCursor(char);
                return false;
            }
            else {
                this.finalizeToken(13 /* NewLine */);
                return true;
            }
        }
        else if (this.tokenType === 5 /* String */) {
            if (this.charType !== 9 /* DoubleQuotes */) {
                this.updateTokenAndAdvanceCursor(char);
                return false;
            }
            else {
                this.finalizeToken(9 /* DoubleQuotes */);
                return true;
            }
        }
        else if (this.tokenType === 6 /* LineCommentInit */) {
            this.updateTokenAndAdvanceCursor(char);
            this.finalizeToken(3 /* LineComment */);
            return true;
        }
        else if (this.tokenType === 59 /* SemiColon */) {
            this.tokenType = 6 /* LineCommentInit */;
            return true;
        }
        else if (this.tokenType === 9 /* DoubleQuotes */) {
            this.updateTokenAndAdvanceCursor(char);
            if (this.stringOpen) {
                this.stringOpen = false;
                this.finalizeToken(0);
            }
            else {
                this.stringOpen = true;
                this.finalizeToken(5 /* String */);
            }
            return true;
        }
        else if (this.tokenType === 13 /* NewLine */) {
            this.tokenValue = this.tokenValue + char;
            this.parsed = true;
            this.documentLine++;
            this.documentColumn = 0;
            this.finalizeToken(0);
            return true;
        }
        else if ((this.tokenType > 10) || (this.tokenType === -1)) {
            this.updateTokenAndAdvanceCursor(char);
            this.finalizeToken(0);
            return true;
        }
        return false;
    }
    updateTokenAndAdvanceCursor(char) {
        this.tokenValue = this.tokenValue + char;
        this.parsed = true;
        this.documentColumn++;
    }
    finalizeToken(newType) {
        this.finalizedToken = new Token(this.tokenType, this.tokenValue, this.tokenPosition);
        this.tokenType = newType;
        this.tokenValue = '';
        this.tokenPosition = new vscode_1.Position(this.documentLine, this.documentColumn);
    }
}
function getType(c) {
    let charCode = c.charCodeAt(0);
    if (charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122 || charCode === 37) {
        return 1 /* Alphanumeric */;
    }
    else if (charCode >= 48 && charCode <= 57) {
        return 2 /* Numeric */;
    }
    else if (charCode === 34) {
        return 9 /* DoubleQuotes */;
    }
    else if (charCode === 9) {
        return 11 /* Tab */;
    }
    else if (charCode === 10) {
        return 13 /* NewLine */;
    }
    else if (charCode === 32) {
        return 32 /* Space */;
    }
    else if (charCode === 33) {
        return 33 /* ExclamationMark */;
    }
    else if (charCode === 35) {
        return 35 /* NumberSign */;
    }
    else if (charCode === 36) {
        return 36 /* DollarSign */;
        // } else if (charCode === 37) {
        // 	return Type.PercentSign;
    }
    else if (charCode === 38) {
        return 38 /* Ampersand */;
    }
    else if (charCode === 39) {
        return 39 /* SingleQuote */;
    }
    else if (charCode === 40) {
        return 40 /* OpenParen */;
    }
    else if (charCode === 41) {
        return 41 /* CloseParen */;
    }
    else if (charCode === 42) {
        return 42 /* Asterisk */;
    }
    else if (charCode === 43) {
        return 43 /* PlusSign */;
    }
    else if (charCode === 44) {
        return 44 /* Comma */;
    }
    else if (charCode === 45) {
        return 45 /* MinusSign */;
    }
    else if (charCode === 46) {
        return 46 /* Period */;
    }
    else if (charCode === 58) {
        return 58 /* Colon */;
    }
    else if (charCode === 59) {
        return 59 /* SemiColon */;
    }
    else if (charCode === 60) {
        return 60 /* LessThan */;
    }
    else if (charCode === 61) {
        return 61 /* EqualSign */;
    }
    else if (charCode === 62) {
        return 62 /* GreaterThan */;
    }
    else if (charCode === 63) {
        return 63 /* QuestionMark */;
    }
    else if (charCode === 64) {
        return 64 /* AtSymbol */;
    }
    else if (charCode === 91) {
        return 91 /* OpenBracket */;
    }
    else if (charCode === 92) {
        return 92 /* Backslash */;
    }
    else if (charCode === 93) {
        return 93 /* CloseBracket */;
    }
    else if (charCode === 94) {
        return 94 /* Caret */;
    }
    else if (charCode === 95) {
        return 95 /* Underscore */;
    }
    else if (charCode === 96) {
        return 96 /* BackQuote */;
    }
    else if (charCode === 123) {
        return 123 /* OpenBrace */;
    }
    else if (charCode === 124) {
        return 124 /* Pipe */;
    }
    else if (charCode === 125) {
        return 125 /* CloseBrace */;
    }
    else if (charCode === 126) {
        return 126 /* Tilde */;
    }
    else {
        return -1;
    }
}
var Type;
(function (Type) {
    Type[Type["Alphanumeric"] = 1] = "Alphanumeric";
    Type[Type["Numeric"] = 2] = "Numeric";
    Type[Type["LineComment"] = 3] = "LineComment";
    Type[Type["BlockComment"] = 4] = "BlockComment";
    Type[Type["String"] = 5] = "String";
    Type[Type["LineCommentInit"] = 6] = "LineCommentInit";
    Type[Type["DoubleQuotes"] = 9] = "DoubleQuotes";
    Type[Type["Tab"] = 11] = "Tab";
    Type[Type["NewLine"] = 13] = "NewLine";
    Type[Type["Space"] = 32] = "Space";
    Type[Type["ExclamationMark"] = 33] = "ExclamationMark";
    Type[Type["NumberSign"] = 35] = "NumberSign";
    Type[Type["DollarSign"] = 36] = "DollarSign";
    Type[Type["Ampersand"] = 38] = "Ampersand";
    Type[Type["SingleQuote"] = 39] = "SingleQuote";
    Type[Type["OpenParen"] = 40] = "OpenParen";
    Type[Type["CloseParen"] = 41] = "CloseParen";
    Type[Type["Asterisk"] = 42] = "Asterisk";
    Type[Type["PlusSign"] = 43] = "PlusSign";
    Type[Type["Comma"] = 44] = "Comma";
    Type[Type["MinusSign"] = 45] = "MinusSign";
    Type[Type["Period"] = 46] = "Period";
    Type[Type["Colon"] = 58] = "Colon";
    Type[Type["SemiColon"] = 59] = "SemiColon";
    Type[Type["LessThan"] = 60] = "LessThan";
    Type[Type["EqualSign"] = 61] = "EqualSign";
    Type[Type["GreaterThan"] = 62] = "GreaterThan";
    Type[Type["QuestionMark"] = 63] = "QuestionMark";
    Type[Type["AtSymbol"] = 64] = "AtSymbol";
    Type[Type["OpenBracket"] = 91] = "OpenBracket";
    Type[Type["Backslash"] = 92] = "Backslash";
    Type[Type["CloseBracket"] = 93] = "CloseBracket";
    Type[Type["Caret"] = 94] = "Caret";
    Type[Type["Underscore"] = 95] = "Underscore";
    Type[Type["BackQuote"] = 96] = "BackQuote";
    Type[Type["OpenBrace"] = 123] = "OpenBrace";
    Type[Type["Pipe"] = 124] = "Pipe";
    Type[Type["CloseBrace"] = 125] = "CloseBrace";
    Type[Type["Tilde"] = 126] = "Tilde";
    Type[Type["Undefined"] = -1] = "Undefined";
})(Type = exports.Type || (exports.Type = {}));
//# sourceMappingURL=tokenizer.js.map