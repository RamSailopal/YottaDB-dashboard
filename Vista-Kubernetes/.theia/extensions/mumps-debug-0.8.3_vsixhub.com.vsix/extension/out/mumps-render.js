//Append Line Label and Lead Spacing.
function appendLabel(inputObject, inputLine) {
    if (inputObject.lineLabel) {
        inputLine = inputLine + inputObject.lineLabel;
    }
    if (inputObject.lineLeadSpace) {
        inputLine = inputLine + inputObject.lineLeadSpace;
    }
    return inputLine;
}
//Append Indentation to Label/Spacing.
function appendIndentation(inputObject, inputLine) {
    let tmpIndentation = "";
    if (inputObject.lineIndentationArray) {
        if (inputObject.lineIndentationArray.length > 0) {
            for (let i in inputObject.lineIndentationArray) {
                tmpIndentation = tmpIndentation + "." + inputObject.lineIndentationArray[i];
            }
            inputLine = inputLine + tmpIndentation;
        }
    }
    return inputLine;
}
//Append Routines to Label/Spacing/Indentation.
function appendRoutines(inputObject, inputLine) {
    if (inputObject.lineRoutines) {
        for (let i in inputObject.lineRoutines) {
            if (inputObject.lineRoutines[i].mCommand || inputObject.lineRoutines[i].mCommand === "") {
                //Leave off interval spacing for first Routine.
                if (i === "0") {
                    inputLine = inputLine + inputObject.lineRoutines[i].mCommand;
                }
                else {
                    inputLine = inputLine + " " + inputObject.lineRoutines[i].mCommand;
                }
                //Append Post-Conditional.
                if (inputObject.lineRoutines[i].mPostCondition) {
                    inputLine = inputLine + ":" + inputObject.lineRoutines[i].mPostCondition;
                }
                //Append Arguments.
                if (inputObject.lineRoutines[i].hasOwnProperty("mArguments")) {
                    inputLine = inputLine + " " + inputObject.lineRoutines[i].mArguments;
                }
            }
        }
    }
    return inputLine;
}
//Append Comment.
function appendComment(inputObject, inputLine) {
    if (inputObject.hasOwnProperty("lineComment")) {
        inputLine = inputLine + ";" + inputObject.lineComment.comment;
    }
    return inputLine;
}
//Export all Routines.
module.exports.appendLabel = appendLabel;
module.exports.appendIndentation = appendIndentation;
module.exports.appendRoutines = appendRoutines;
module.exports.appendComment = appendComment;
//# sourceMappingURL=mumps-render.js.map