"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MumpsDefinitionProvider = void 0;
const mumpsTokenData_1 = require("./mumpsTokenData");
class MumpsDefinitionProvider {
    provideDefinition(document, position) {
        let helper = new mumpsTokenData_1.MumpsTokenHelper(document, position);
        return helper.getTokenRefLocation();
    }
}
exports.MumpsDefinitionProvider = MumpsDefinitionProvider;
//# sourceMappingURL=mumps-definition-provider.js.map