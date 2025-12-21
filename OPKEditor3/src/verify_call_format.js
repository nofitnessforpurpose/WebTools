const fs = require('fs');
const path = require('path');

// Global Mocks for Decompiler dependencies if needed
const { QCODE_DEFS, PRECEDENCE } = require(path.join(__dirname, 'logic/decompiler/constants.js'));
global.QCODE_DEFS = QCODE_DEFS;
global.PRECEDENCE = PRECEDENCE;
const { DecompilerStack } = require(path.join(__dirname, 'logic/decompiler/stack.js'));
global.DecompilerStack = DecompilerStack;

// Load Compiler via Eval (Legacy shim)
const compilerPath = path.join(__dirname, 'logic/compiler/Compiler.js');
let compilerContent = fs.readFileSync(compilerPath, 'utf8');
compilerContent += "\nglobal.OPLCompiler = OPLCompiler;";
eval.call(global, compilerContent);
const OPLCompiler = global.OPLCompiler;

// Load Decompiler
// Note: main.js supports require, but check if it finds instruction_handler correctly
const { OPLDecompiler } = require('./logic/decompiler/main.js');

async function run() {
    console.log("Compiling PROC call test...");
    const compiler = OPLCompiler;
    // SUB and CONV$ need to be defined or implicit?
    // If not defined, implicit external.
    const source = `PROC MAIN:
    SUB:
    CONV$:
ENDP`;
    // Note: SUB and CONV$ must be external or defined?
    // Compiler handles implicit externals.

    const res = compiler.compile(source);

    let binary = res;
    if (res.errors) {
        console.error("Compilation errors:", res.errors);
        process.exit(1);
    }
    // If res is not an array/buffer, it might be an error object?
    // Usually Uint8Array doesn't have errors prop.
    // Let's assume validity if it looks like array.

    console.log("Compiled Binary Size:", binary.length);

    console.log("Decompiling...");
    const decompiler = new OPLDecompiler();
    const decompiled = decompiler.decompile(Buffer.from(binary), "MAIN");

    console.log("\n--- Decompiled Output ---");
    console.log(decompiled);
    console.log("-------------------------\n");

    if (decompiled.includes("SUB:") && decompiled.includes("CONV$:")) {
        console.log("SUCCESS: Procedure calls have colons.");
    } else {
        console.error("FAILURE: Procedure calls MISSING colons.");
        if (!decompiled.includes("SUB:")) console.log("Missing SUB:");
        if (!decompiled.includes("CONV$:")) console.log("Missing CONV$:");
    }
}

run();
