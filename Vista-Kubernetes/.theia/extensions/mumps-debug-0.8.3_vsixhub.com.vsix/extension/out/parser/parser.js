"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseText = exports.MemberClass = void 0;
const tokenizer_1 = require("./tokenizer");
// Code adapted from the vscode-psl extension by ing-bank
/**
 * Used for checking the type of Member at runtime
 */
var MemberClass;
(function (MemberClass) {
    MemberClass[MemberClass["method"] = 1] = "method";
    MemberClass[MemberClass["parameter"] = 2] = "parameter";
    // property = 3,
    MemberClass[MemberClass["declaration"] = 4] = "declaration";
    MemberClass[MemberClass["column"] = 5] = "column";
    MemberClass[MemberClass["table"] = 6] = "table";
    MemberClass[MemberClass["proc"] = 7] = "proc";
})(MemberClass = exports.MemberClass || (exports.MemberClass = {}));
class Method {
    constructor() {
        this.parameters = [];
        this.line = -1;
        this.declarations = [];
        this.endLine = -1;
        this.memberClass = MemberClass.method;
        this.documentation = '';
    }
}
class Parameter {
    constructor() { }
}
function parseText(sourceText) {
    let parser = new Parser();
    return parser.parseDocument(sourceText);
}
exports.parseText = parseText;
class Parser {
    constructor(tokenizer) {
        this.methods = [];
        this.declarations = [];
        this.tokens = [];
        if (tokenizer) {
            this.tokenizer = tokenizer;
        }
    }
    next() {
        this.activeToken = this.tokenizer.next().value;
        if (this.activeToken) {
            this.tokens.push(this.activeToken);
        }
        return this.activeToken !== undefined;
    }
    parseDocument(documentText) {
        this.tokenizer = tokenizer_1.getTokens(documentText);
        while (this.next()) {
            if (this.activeToken.isAlphanumeric()) {
                let method = this.parseMethod();
                if (!method) {
                    continue;
                }
                this.methods.push(method);
                this.activeMethod = method;
            }
            else if (this.activeToken.isTab() || this.activeToken.isSpace()) {
                let lineNumber = this.activeToken.position.line;
                let tokenBuffer = this.loadTokenBuffer();
                if (this.activeMethod && this.activeMethod.nextLine === lineNumber) {
                    let documentation = this.checkForDocumentation(tokenBuffer);
                    if (documentation) {
                        this.activeMethod.documentation = documentation;
                    }
                }
            }
            else if (this.activeToken.isNewLine()) {
                continue;
            }
            else {
                this.throwAwayTokensTil(13 /* NewLine */);
            }
        }
        return {
            declarations: this.declarations,
            methods: this.methods,
            tokens: this.tokens
        };
    }
    checkForDocumentation(tokenBuffer) {
        let i = 0;
        while (i < tokenBuffer.length) {
            let token = tokenBuffer[i];
            if (token.isSpace() || token.isTab()) {
                i++;
                continue;
            }
            if (token.isLineCommentInit() && tokenBuffer[i + 1] && tokenBuffer[i + 1].isLineComment()) {
                return tokenBuffer[i + 1].value;
            }
            return '';
        }
        return '';
    }
    loadTokenBuffer() {
        let tokenBuffer = [];
        while (this.next() && this.activeToken.type !== 13 /* NewLine */) {
            tokenBuffer.push(this.activeToken);
        }
        return tokenBuffer;
    }
    parseMethod() {
        let method = new Method();
        do {
            if (!this.activeToken) {
                continue;
            }
            if (this.activeToken.isTab() || this.activeToken.isSpace()) {
                continue;
            }
            else if (this.activeToken.isNewLine()) {
                break;
            }
            else if (this.activeToken.isOpenParen()) {
                let processed = this.processParameters(method);
                if (!processed) {
                    return undefined;
                }
                method.parameters = processed;
                break;
            }
            else if (this.activeToken.isAlphanumeric()) {
                if (method.line === -1) {
                    method.line = this.activeToken.position.line;
                    method.prevLine = this.activeToken.position.line - 1;
                    method.nextLine = this.activeToken.position.line + 1;
                    method.id = this.activeToken;
                }
            }
            else if (this.activeToken.isLineCommentInit() || this.activeToken.isLineComment()) {
                continue;
            }
            else if (this.activeToken.value === '\r') {
                continue;
            }
            else if (this.activeToken.isCloseParen()) {
                if (!method.closeParen) {
                    method.closeParen = this.activeToken;
                    method.nextLine = this.activeToken.position.line + 1;
                }
            }
            else {
                this.throwAwayTokensTil(13 /* NewLine */);
                if (method.id) {
                    break;
                }
                return undefined;
            }
        } while (this.next());
        if (this.activeMethod) {
            this.activeMethod.endLine = method.id.position.line - 1;
        }
        this.activeMethod = method;
        return method;
    }
    processParameters(method) {
        let args = [];
        let param;
        let open = false;
        while (this.next()) {
            if (this.activeToken.isTab() || this.activeToken.isSpace() || this.activeToken.isNewLine()) {
                continue;
            }
            else if (this.activeToken.isOpenParen()) {
                open = true;
                if (!param) {
                    return undefined;
                }
                continue;
            }
            else if (this.activeToken.isCloseParen()) {
                open = false;
                method.closeParen = this.activeToken;
                method.nextLine = this.activeToken.position.line + 1;
                if (!param) {
                    break;
                }
                args.push(param);
                break;
            }
            else if (this.activeToken.isAlphanumeric()) {
                if (!param) {
                    param = new Parameter();
                }
                param.id = this.activeToken;
            }
            else if (this.activeToken.isLineComment()) {
                if (param) {
                    param.comment = this.activeToken;
                }
                else if (args.length >= 1) {
                    args[args.length - 1].comment = this.activeToken;
                }
            }
            else if (this.activeToken.isComma()) {
                if (!param) {
                    return undefined;
                }
                args.push(param);
                param = undefined;
            }
        }
        if (open) {
            return undefined;
        }
        return args;
    }
    throwAwayTokensTil(type) {
        do { } while (this.next() && this.activeToken.type !== type);
    }
}
//# sourceMappingURL=parser.js.map