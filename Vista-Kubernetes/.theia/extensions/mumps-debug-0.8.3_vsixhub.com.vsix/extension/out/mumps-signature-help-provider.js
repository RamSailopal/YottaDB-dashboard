"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MumpsSignatureHelpProvider = void 0;
const mumpsTokenData_1 = require("./mumpsTokenData");
class MumpsSignatureHelpProvider {
    provideSignatureHelp(document, position) {
        let helper = new mumpsTokenData_1.MumpsTokenHelper(document, position);
        return helper.getTokenSignature();
    }
}
exports.MumpsSignatureHelpProvider = MumpsSignatureHelpProvider;
//# sourceMappingURL=mumps-signature-help-provider.js.map