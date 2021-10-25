"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MumpsHoverProvider = void 0;
const mumpsTokenData_1 = require("./mumpsTokenData");
class MumpsHoverProvider {
    provideHover(document, position) {
        const helper = new mumpsTokenData_1.MumpsTokenHelper(document, position);
        return helper.getTokenHoverInfo();
    }
}
exports.MumpsHoverProvider = MumpsHoverProvider;
//# sourceMappingURL=mumps-hover-provider.js.map