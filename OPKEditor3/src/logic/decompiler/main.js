(function () {
    let InstructionHandler, SourceGenerator, QCODE_DEFS, FE_OPCODES;

    if (typeof window !== 'undefined' && window.InstructionHandler) {
        InstructionHandler = window.InstructionHandler;
        SourceGenerator = window.SourceGenerator;
        QCODE_DEFS = window.QCODE_DEFS;
        FE_OPCODES = window.FE_OPCODES;
    } else if (typeof require !== 'undefined') {
        const deps1 = require('./instruction_handler.js');
        InstructionHandler = deps1.InstructionHandler;
        const deps2 = require('./source_generator.js');
        SourceGenerator = deps2.SourceGenerator;
        const deps3 = require('./constants.js');
        QCODE_DEFS = deps3.QCODE_DEFS;
        FE_OPCODES = deps3.FE_OPCODES;
    }

    class OPLDecompiler {
        constructor() {
            this.opcodes = typeof QCODE_DEFS !== 'undefined' ? QCODE_DEFS : {};
            this.feOpcodes = typeof FE_OPCODES !== 'undefined' ? FE_OPCODES : {};
            this.floatSize = 6; // Strictly 6-byte for Psion Organiser II
            this.instHandler = new InstructionHandler(this.opcodes, this.floatSize, this.feOpcodes);
            this.sourceGen = new SourceGenerator(this.instHandler);
        }

        toEvenHex(val, bytes = 1) {
            if (typeof val !== 'number') return val;
            const hex = Math.abs(val).toString(16).toUpperCase();
            const targetLen = bytes * 2;
            const prefix = (val < 0) ? "-0x" : "0x";
            return prefix + hex.padStart(targetLen, '0');
        }

        formatPC(val) {
            return Math.abs(val).toString(16).toUpperCase().padStart(4, '0');
        }

        formatBytes(bytes) {
            if (!bytes) return "";
            return bytes.replace(/\s+/g, '');
        }

        getControlFlow(codeBlock, procName = "main", options = {}) {
            // Helper for Visualizer: Returns { instructions, flow, varMap }
            return this.getRawAnalysis(codeBlock, procName, options);
        }

        getRawAnalysis(codeBlock, procName = "main", options = {}) {
            if (!codeBlock || codeBlock.length < 4) return { instructions: [], flow: {}, varMap: {} };

            // Default to Organiser II settings
            this.floatSize = 6;
            this.opcodes = typeof QCODE_DEFS !== 'undefined' ? QCODE_DEFS : {};
            this.feOpcodes = typeof FE_OPCODES !== 'undefined' ? FE_OPCODES : {};
            this.instHandler = new InstructionHandler(this.opcodes, this.floatSize, this.feOpcodes);

            let offset = 0;
            this.oplBase = 0; // Will be set during parseHeader
            const header = this.parseHeader(codeBlock, offset, options);
            this.oplBase = header.oplBase || 0;
            const finalProcName = procName === "main" ? (header.extractedName || procName) : procName;
            const varMap = this.scanVariables(codeBlock, header, options);

            // Ensure QCode start is correct if header specified it
            if (header.qcodeActual !== undefined) {
                header.qcodeStart = header.qcodeActual;
            }
            const flow = this.analyzeControlFlow(codeBlock, header.qcodeStart, header.qcodeSize || (header.sourceActual - header.qcodeActual), options);

            // Generate Instructions List (Shared Logic)
            const instructions = [];
            const qcodeStart = header.qcodeStart;
            const qcodeSize = header.qcodeSize || (header.sourceActual - header.qcodeActual);

            let pc = qcodeStart;

            // Populate instructions using flow and instHandler
            while (pc < qcodeStart + qcodeSize) {
                if (pc >= codeBlock.length) break;
                const op = codeBlock[pc];
                const def = this.opcodes[op];
                if (!def) {
                    // Unknown Opcode - skip 1 byte
                    instructions.push({ pc, text: `UNK_${op.toString(16)}`, size: 1, op: op });
                    pc++;
                    continue;
                }

                const size = this.instHandler.getInstructionSize(codeBlock, pc, def);
                let text = null; // Will be populated by handleInstruction logic below

                if (text === null) {
                    // Stack manipulation only, check stack for pushed text?
                    // For Visualizer, we might need the stack top if pushed?
                }

                // So I MUST populate `instructions` array here.
                // Using InstHandler.

                // Re-using logic from InstructionHandler usage in SourceGenerator?
                // Actually, let's just use the opcode description or simple decode.
                // Visualizer regex runs on `inst.text`.

                const decoded = this.instHandler.getArgs(codeBlock, pc, def); // Just args
                // We need the text "PROC:".
                // InstHandler.decodeInstruction(...) returns that text.
                // But it requires a stack context to be accurate?
                // Let's try to mock the stack or use a fresh one.
                // But wait, `instructions` in CodeVisualizer was generated by `decompiler.getControlFlow` which was calling `analyzeControlFlow` before?
                // `analyzeControlFlow` DOES NOT return instructions.

                // So the original code (before my refactor) for `getControlFlow` MUST have returned instructions. 
                // Where did it come from? 
                // `main.js` from Step 1042 showed NO `getControlFlow` method.
                // So `CodeVisualizer` was calling a method that DID NOT EXIST?
                // That explains the empty graph.

                // But user said "Regression". Meaning it worked before?
                // Before recent refactors.
                // In the OLD `main.js`, `getControlFlow` likely existed and returned instructions.

                // So I am implementing it from scratch.
                // I need to generate `instructions` array with `text` property that contains "PROC NAME".

                // Simplest way: Loop opcodes, if Op=0x7D (PROC) or Call, format the text.
                // Use `instHandler.decodeInstruction`?
                // It needs a stack.
                // Let's provide a dummy stack. 


                if (op === 0x7D) {
                    // Manual decode for PROC
                    const args = this.instHandler.getArgs(codeBlock, pc, def);
                    text = `${args.params.name}:`;
                } else {
                    // Check if it's a function call (Pushes ?)
                    // If so, we might miss it if we don't decode.
                    // But Standard OPL calls (statements) use 0x7D.
                    // Functions use 0x7D too?
                    // Constants.js: 0x7D pushes '?' (maybe).
                    // Let's assume 0x7D covers all user-defined calls.

                    // What about `instHandler` usage?
                    // Let's try to use `decodeInstruction` if it exists on `instHandler`.
                    // `instHandler` was instantiated.
                    try {
                        const args = this.instHandler.getArgs(codeBlock, pc, def);
                        // handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap)
                        // Passing dummy stack and empty labelMap
                        const dummyStack = { push: () => { }, pop: (() => { return { text: "?" }; }), length: 0 };
                        text = this.instHandler.handleInstruction(op, def, args, dummyStack, varMap, pc, size, codeBlock, {});
                    } catch (e) { text = ""; }
                }

                instructions.push({ pc, text: text || "", size, op });
                pc += size;
            }

            return { instructions, flow, varMap, header, finalProcName };
        }

        decompile(codeBlock, procName = "main", options = {}) {
            const analysis = this.getRawAnalysis(codeBlock, procName, options);
            if (analysis.instructions.length === 0 && analysis.header && !analysis.header.qcodeStart) return "REM Error: Analysis Failed";

            // Pass analysis results to SourceGenerator
            // SourceGenerator needs to re-run the loop to track stack properly for indentation/expressions?
            // Yes, SourceGenerator does its own pass.
            // So we can just pass header/varMap/flow as before.
            return this.sourceGen.generateSource(analysis.header, analysis.varMap, analysis.flow, codeBlock, analysis.finalProcName, { ...options, oplBase: this.oplBase });
        }


        parseHeader(codeBlock, offset, options = {}) {
            const toEvenHex = (val, bytes = 1) => this.toEvenHex(val, bytes);
            const formatPC = (val) => this.formatPC(val);
            const formatBytes = (val) => this.formatBytes(val);

            const log = (pc, bytes, name, args, comment) => {
                if (options.logCallback) {
                    const relativePC = pc - (this.oplBase || 0);
                    options.logCallback({
                        pc: formatPC(relativePC),
                        bytes: formatBytes(bytes),
                        opName: name + (args ? " " + args : ""),
                        comment: comment
                    });
                }
            };

            const getHexBytes = (start, count) => {
                let hex = "";
                for (let i = 0; i < count; i++) {
                    if (start + i >= codeBlock.length) break;
                    hex += codeBlock[start + i].toString(16).toUpperCase().padStart(2, '0');
                }
                return hex;
            };

            const readWordBE = () => {
                const val = (codeBlock[offset] << 8) | codeBlock[offset + 1];
                offset += 2;
                return val;
            };
            const readWordLE = () => {
                const val = codeBlock[offset] | (codeBlock[offset + 1] << 8);
                offset += 2;
                return val;
            };
            const readByte = () => (offset < codeBlock.length) ? codeBlock[offset++] : 0;

            // --- 1. Detect Entry Point ---
            let extractedName = null;
            let sync = 0, type = 0, vSpace = 0, qSize = 0, nParams = 0;
            let isProcedure = true;
            let isLZ = false;
            // Detect LZ Variant via Heuristic (Type $ at offset 0x14)
            if (codeBlock.length > 0x14 && codeBlock[0x14] === 0x24) {
                isLZ = true;
            }

            if (codeBlock[0] === 0x09 && (codeBlock[1] === 0x83 || codeBlock[1] === 0x09 || codeBlock[1] === 0x03)) {
                // Full Record (09 83)
                // Decode Record Header
                const rLen = readByte(); // Offset 0
                log(0, getHexBytes(0, 1), "Length Byte", rLen.toString(), "Length of header");

                const rType = readByte(); // Offset 1
                log(1, getHexBytes(1, 1), "Record Type", `0x${rType.toString(16).toUpperCase()}`, "OPL Procedure Record");

                // Name (8 bytes)
                const nameBytes = codeBlock.slice(2, 10);
                let extractedNameStr = "";
                for (let i = 0; i < 8; i++) extractedNameStr += String.fromCharCode(nameBytes[i]);
                offset += 8;
                extractedName = extractedNameStr.trim();
                log(2, getHexBytes(2, 8), "File Name", extractedName, "Procedure Name");

                // Skip Terminator/Align? (Offset 10)
                const term = readByte();
                log(10, getHexBytes(10, 1), "Terminator", `0x${term.toString(16).toUpperCase()}`, "Unused/Terminator");

                // Now entering Long Record Structure (02 80) body...
                this.oplBase = offset; // Tentative, will adjust

                sync = readByte();
                log(offset - 1, getHexBytes(offset - 1, 1), "Sync Byte", `0x${sync.toString(16).toUpperCase()}`, "Long Record Sync");

                type = readByte();
                log(offset - 1, getHexBytes(offset - 1, 1), "Type Byte", `0x${type.toString(16).toUpperCase()}`, "OPL Procedure Data Block");

                const longRecLen = readWordBE();
                log(offset - 2, getHexBytes(offset - 2, 2), "LongRec Len", longRecLen.toString(), "Length of Data Block");

                const qcodeTotalLen = readWordBE();
                log(offset - 2, getHexBytes(offset - 2, 2), "Total Len", qcodeTotalLen.toString(), "Total Object Size");

                this.oplBase = offset;

            } else if (codeBlock[0] === 0x02 && codeBlock[1] === 0x80) {
                // Long Record (02 80) - Standalone
                sync = readByte(); // 02
                log(0, getHexBytes(0, 1), "Sync Byte", `0x${sync.toString(16).toUpperCase()}`, "Long Record Sync");

                type = readByte(); // 80
                log(1, getHexBytes(1, 1), "Type Byte", `0x${type.toString(16).toUpperCase()}`, "OPL Procedure Data Block");

                const longRecLen = readWordBE();
                log(2, getHexBytes(2, 2), "LongRec Len", longRecLen.toString(), "Length of Data Block");

                const qcodeTotalLen = readWordBE();
                log(4, getHexBytes(4, 2), "Total Len", qcodeTotalLen.toString(), "Total Object Size");

                this.oplBase = offset;

            } else if (codeBlock.length >= 5 && codeBlock[4] < 32) {
                // Raw OPL Block (Heuristic: nParams < 32)
                // No summary line, proceed to decode metadata
                this.oplBase = 0;
                offset = 0;
            } else {
                // Fallback: Truly unknown
                log(0, getHexBytes(0, Math.min(codeBlock.length, 8)), "Block File Header", "Unknown Format", "Assuming start of OPL metadata");
                this.oplBase = 0;
                offset = 0;
            }

            // Separator between File Headers and OPL Body
            if (options.logCallback) {
                options.logCallback({ pc: null, bytes: "", opName: "-------------------", args: "", comment: "Start of QCode" });
            }

            // --- 2. OPL Metadata Block ---
            vSpace = readWordBE();
            qSize = readWordBE();
            nParams = readByte();

            log(this.oplBase, getHexBytes(this.oplBase, 2), "VarSpace", vSpace.toString(), "Variable Space Size");
            log(this.oplBase + 2, getHexBytes(this.oplBase + 2, 2), "QCodeSize", qSize.toString(), "Active QCode area");
            log(this.oplBase + 4, getHexBytes(this.oplBase + 4, 1), "NumParams", nParams.toString(), `NPC:${nParams}`);

            const paramTypes = [];
            for (let i = 0; i < nParams; i++) {
                const poff = offset;
                const t = readByte();
                paramTypes.push(t);
                const typeLabel = t === 0 ? "Int" : t === 1 ? "Flt" : t === 2 ? "Str" : "Unknown";
                log(poff, getHexBytes(poff, 1), `ParamType`, typeLabel, "");
            }

            const hMeta = {
                extractedName,
                magic: (sync << 8) | type,
                varSpaceSize: vSpace, qcodeSize: qSize, numParams: nParams, paramTypes: [...paramTypes].reverse(),
                qcodeStart: offset,
                oplBase: this.oplBase,
                isProcedure, isLZ, isCMXP: false
            };

            const isProc = true;
            const qcodeActual = undefined; // Sequential in this model
            const fixupActual = undefined;

            const atBoundary = (off) => {
                return false;
            };

            // --- 4. Global Table ---
            const globals = [];
            const globalTableSize = readWordBE();
            log(offset - 2, getHexBytes(offset - 2, 2), "GlobalTblSize", globalTableSize.toString(), "Byte length of global variable declarations");

            const globalTableEnd = offset + globalTableSize;
            while (offset < globalTableEnd && !atBoundary(offset)) {
                const startOff = offset;
                const nameLen = readByte();
                if (nameLen === 0 || nameLen > 32) break;
                let name = "";
                for (let i = 0; i < nameLen; i++) name += String.fromCharCode(readByte());
                const type = readByte();
                const addr = readWordBE();
                globals.push({ name, type, addr });
                const suffix = this.instHandler.getTypeSuffix(type);
                const fullName = (name.endsWith(suffix) || (suffix === "" && !name.match(/[%$]$/))) ? name : name + suffix;
                log(startOff, getHexBytes(startOff, nameLen + 4), `Global ${fullName}`, null, `Type: ${type}, Addr: ${toEvenHex(addr, 2).replace('0x', '')}`);
            }

            const externals = [];
            const externTableSize = readWordBE();
            log(offset - 2, getHexBytes(offset - 2, 2), "ExternTblSize", externTableSize.toString(), "Byte length of external variable declarations");
            const externTableEnd = offset + externTableSize;
            while (offset < externTableEnd && !atBoundary(offset)) {
                const startOff = offset;
                const nameLen = readByte();
                if (nameLen === 0 || nameLen > 32) break;
                let name = "";
                for (let i = 0; i < nameLen; i++) name += String.fromCharCode(readByte());
                const type = readByte();
                externals.push({ name, type });
                const suffix = this.instHandler.getTypeSuffix(type);
                const fullName = (name.endsWith(suffix) || (suffix === "" && !name.match(/[%$]$/))) ? name : name + suffix;
                log(startOff, getHexBytes(startOff, nameLen + 2), `External ${fullName}`, null, `Type: ${type}`);
            }

            // --- 5. String and Array Fixup Tables ---
            const stringFixups = [];
            const arrayFixups = {};

            if (offset < codeBlock.length) {
                const strFixSize = readWordBE();
                log(offset - 2, getHexBytes(offset - 2, 2), "StrFixTblSize", strFixSize.toString(), "String fixup table length");

                const strFixEnd = offset + strFixSize;
                while (offset < strFixEnd && offset < codeBlock.length) {
                    const sOff = offset;
                    const addr = readWordBE();
                    const len = readByte();
                    stringFixups.push({ addr, len });
                    log(sOff, getHexBytes(sOff, 3), `StrFixup Addr:${toEvenHex(addr, 2).replace('0x', '')}`, `Len:${len}`);
                }
                if (offset < codeBlock.length) {
                    const arrFixSize = readWordBE();
                    log(offset - 2, getHexBytes(offset - 2, 2), "ArrFixTblSize", arrFixSize.toString(), "Array fixup table length");

                    const arrFixEnd = offset + arrFixSize;
                    while (offset < arrFixEnd && offset < codeBlock.length) {
                        const aOff = offset;
                        const addr = readWordBE();
                        const len = readWordBE();
                        arrayFixups[addr] = len;
                        log(aOff, getHexBytes(aOff, 4), `ArrFixup Addr:${toEvenHex(addr, 2).replace('0x', '')}`, `Len:${len}`);
                    }
                }
            }

            // --- 7. Fixup Mapping ---
            const applyFixups = (vars) => {
                for (const v of vars) {
                    // String lengths
                    if (stringFixups.length > 0) {
                        const sf = stringFixups.find(f => f.addr === v.addr || f.addr === v.addr - 1);
                        if (sf) v.maxLen = sf.len;
                    }
                    // Array elements
                    if (arrayFixups[v.addr] !== undefined) {
                        v.arrayLen = arrayFixups[v.addr];
                    } else if (arrayFixups[v.addr - 1] !== undefined) {
                        v.arrayLen = arrayFixups[v.addr - 1];
                    }
                }
            }
            applyFixups(globals);
            applyFixups(externals);

            const finalQCodeActual = isProc ? offset : qcodeActual;

            const isLZSig = (finalQCodeActual + 1 < codeBlock.length && codeBlock[finalQCodeActual] === 0x59 && codeBlock[finalQCodeActual + 1] === 0xB2);
            const adjQCodeStart = isLZSig ? finalQCodeActual + 2 : finalQCodeActual;
            // If we skip 2 bytes, we must reduce the reported size so we don't read past end
            // Note: If size is derived from pointers (sourceActual), we also reduce it.
            let calcSize = hMeta.qcodeSize !== undefined ? hMeta.qcodeSize : (sourceActual > qcodeActual ? sourceActual - qcodeActual : codeBlock.length - qcodeActual);
            if (isLZSig) calcSize -= 2;

            return {
                varSpaceSize: hMeta.varSpaceSize,
                qcodeSize: calcSize,
                numParams: hMeta.numParams,
                paramTypes: hMeta.paramTypes,
                globals,
                externals,
                stringFixups,
                arrayFixups,
                qcodeStart: adjQCodeStart,
                actualQCodeStart: adjQCodeStart,
                isLZ: (hMeta.isLZ === true) || isLZSig,
                isCMXP: !!hMeta.isCMXP,
                extractedName: hMeta.extractedName
            };
        }

        scanVariables(codeBlock, header, options = {}) {
            const toEvenHex = (val, bytes = 1) => this.toEvenHex(val, bytes);

            const log = (msg) => {
                if (options.logCallback) {
                    options.logCallback({ pc: "Vars", bytes: "", opName: "Scan", comment: msg });
                }
            };

            const varMap = {};
            const { globals, externals, stringFixups, arrayFixups, actualQCodeStart, qcodeStart, qcodeSize, numParams, paramTypes } = header;

            // Initialize handlers
            this.floatSize = 6;
            this.opcodes = typeof QCODE_DEFS !== 'undefined' ? QCODE_DEFS : {};
            this.feOpcodes = typeof FE_OPCODES !== 'undefined' ? FE_OPCODES : {};
            this.instHandler = new InstructionHandler(this.opcodes, this.floatSize, this.feOpcodes);
            this.sourceGen = new SourceGenerator(this.instHandler);

            log(`Scanning QCode for variable usage (Start:${toEvenHex(actualQCodeStart, 2)} End:${toEvenHex(qcodeStart + qcodeSize, 2)})`);

            const accessedVars = new Set();
            const intVars = new Set();
            const floatVars = new Set();
            const stringVars = new Set();
            const arrayVars = new Set();
            const externAccesses = new Set();

            const externOpcodes = new Set([
                0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, // Push extern val
                0x14, 0x15, 0x16, 0x17, 0x18, 0x19  // Push extern ref
            ]);

            const stringFixupsMap = {};
            stringFixups.forEach(f => {
                let addr = f.addr;
                if (addr > 32767) addr -= 65536;
                stringFixupsMap[addr] = f.len;
            });

            let pc = actualQCodeStart;
            while (pc < qcodeStart + qcodeSize) {
                const op = codeBlock[pc];
                const def = this.opcodes[op];
                if (!def) { pc++; continue; }

                let addr = null;
                if (def.args.includes('v') || def.args.includes('V')) {
                    addr = (codeBlock[pc + 1] << 8) | codeBlock[pc + 2];
                } else if (def.args.includes('W')) {
                    addr = (codeBlock[pc + 1] << 8) | codeBlock[pc + 2];
                }

                if (addr !== null) {
                    if (addr > 32767) addr -= 65536;
                    accessedVars.add(addr);

                    if (externOpcodes.has(op)) {
                        externAccesses.add(addr);
                    }

                    if ([0x02, 0x05, 0x0F, 0x12, 0x81, 0x09, 0x0C, 0x16, 0x19].includes(op)) stringVars.add(addr);
                    else if ([0x00, 0x03, 0x0D, 0x10, 0x7F, 0x07, 0x0A, 0x14, 0x17].includes(op)) intVars.add(addr);
                    else if ([0x01, 0x04, 0x0E, 0x11, 0x80, 0x08, 0x0B, 0x15, 0x18].includes(op)) floatVars.add(addr);

                    if ([0x03, 0x04, 0x05, 0x10, 0x11, 0x12, 0x0A, 0x0B, 0x0C, 0x17, 0x18, 0x19].includes(op)) {
                        arrayVars.add(addr);
                    }
                }
                pc += this.instHandler.getInstructionSize(codeBlock, pc, def);
            }

            // Helper to infer Psion type from usage
            const getScanType = (addr) => {
                const isArray = arrayVars.has(addr);
                if (stringVars.has(addr)) return isArray ? 5 : 2;
                if (intVars.has(addr)) return isArray ? 3 : 0;
                if (floatVars.has(addr)) return isArray ? 4 : 1;
                return 1;
            };


            let availableVars = Array.from(accessedVars);
            const isLZ = (header.isLZ !== false);

            // Identify Parameters
            // In LZ/Organiser II, params are usually at one end of the local frame.
            // We enforce LZ-style sorting (Highest/Top-Of-Stack first) as this compiler generates LZ-style binaries.
            // (Offset -10 > -12, so P1 is -10).
            // filter for negative offsets only (Params are stack-based)
            const candidateParams = availableVars.filter(v => v < 0 || v > 32767); // Handle logical negative if unsigned?
            // availableVars are already converted to signed if > 32767 in loop (lines 385)?
            // Check loop line 385: 'if (addr > 32767) addr -= 65536;' - Yes, accessedVars stores SIGNED.

            // So filter v < 0.
            const stackVars = availableVars.filter(v => v < 0);
            stackVars.sort((a, b) => b - a);

            const params = stackVars.slice(0, numParams);

            // 2. Map Params
            for (let i = 0; i < numParams; i++) {
                if (i < params.length) {
                    const off = params[i];
                    const type = paramTypes[i];
                    const suffix = this.instHandler.getTypeSuffix(type);
                    const pName = `P${i + 1}${suffix}`;
                    varMap[off] = { name: pName, type: type, isParam: true };
                    log(`Param ${pName}: Offset ${toEvenHex(off, 1)} type ${toEvenHex(type, 1)} (${suffix})`);
                }
            }

            // Use remaining vars for Globals & Locals
            // CRITICAL FIX: availableVars is unsorted. Slicing by numParams removes ARBITRARY variables.
            // We must explicitly remove the variables we identified as parameters.
            const paramSet = new Set(params);
            let remainingVars = availableVars.filter(v => !paramSet.has(v));

            // Prepare comprehensive address list for size inference

            // Prepare comprehensive address list for size inference
            // (Includes both accessed vars and declared globals to map full memory layout)
            const allAddrSet = new Set(availableVars);
            globals.forEach(g => {
                let addr = g.addr;
                if (addr > 32767) addr -= 65536;
                if (addr !== 0) allAddrSet.add(addr);
            });
            const fullMemoryMap = Array.from(allAddrSet).sort((a, b) => b - a);

            // 3. Map Globals
            if (globals.length > 0) {
                globals.forEach(g => {
                    let mappedAddr = null;
                    let signedAddr = g.addr;
                    if (signedAddr > 32767) signedAddr -= 65536;

                    // A. Explicit Address Match
                    // Only if it's in remainingVars (i.e., not a Param)
                    if (remainingVars.includes(signedAddr)) {
                        mappedAddr = signedAddr;
                    }

                    // B. Fallback: Extern or Lax
                    // Only for Globals WITHOUT explicit address.
                    // If address is explicit (Binary), we strictly map to it (Force Map below) or skip.
                    if (mappedAddr === null && g.addr === 0) {
                        // Start by looking at remaining variables
                        // 1. Extern Access Check
                        const externCandidates = remainingVars.filter(v => externAccesses.has(v));
                        const candIdx = externCandidates.findIndex(v => getScanType(v) === g.type);

                        if (candIdx !== -1) {
                            mappedAddr = externCandidates[candIdx];
                        }
                        // 2. Lax / Opportunistic Match
                        // If unmapped, assume it maps to one of the available stack slots 
                        // that matches the type.
                        else if (g.addr === 0) {
                            const laxIdx = remainingVars.findIndex(v => getScanType(v) === g.type);
                            if (laxIdx !== -1) {
                                mappedAddr = remainingVars[laxIdx];
                            }
                        }
                    } // End if (mappedAddr === null && g.addr === 0)

                    if (mappedAddr !== null) {
                        varMap[mappedAddr] = { name: g.name, type: g.type, isGlobal: true };

                        if (stringFixupsMap[mappedAddr]) {
                            varMap[mappedAddr].maxLen = stringFixupsMap[mappedAddr];
                            g.maxLen = stringFixupsMap[mappedAddr];
                        }
                        if (arrayFixups[mappedAddr]) {
                            varMap[mappedAddr].arrayLen = arrayFixups[mappedAddr];
                            g.arrayLen = arrayFixups[mappedAddr];
                        }



                        // Remove from remainingVars
                        remainingVars = remainingVars.filter(v => v !== mappedAddr);
                    } else if (g.addr !== 0 || signedAddr !== 0) {
                        // Force map if explicit address
                        mappedAddr = signedAddr;
                        varMap[mappedAddr] = { name: g.name, type: g.type, isGlobal: true, isForceMapped: true };
                    }

                    if (mappedAddr !== null) {
                        // --- Global Size Inference (if missing dimensions) ---
                        if (!g.arrayLen && !g.maxLen) {
                            const idx = fullMemoryMap.indexOf(mappedAddr);
                            if (idx >= 0) {
                                // fullMemoryMap sorted descending (e.g. -2, -10, -20)
                                // If idx=0 (e.g. -2), upper bound is 0 (Frame Pointer)
                                const nextOff = (idx > 0) ? fullMemoryMap[idx - 1] : 0;
                                const size = Math.abs(nextOff - mappedAddr);

                                if (g.type === 2) { // String
                                    let inferredLen = size - 1;
                                    if (inferredLen > 255) inferredLen = 255;
                                    if (inferredLen > 0) {
                                        g.maxLen = inferredLen;
                                        varMap[mappedAddr].maxLen = inferredLen;
                                    }
                                }

                                // Check Array Status (Independent of Type)
                                if (arrayVars.has(mappedAddr)) {
                                    // inference for array vars
                                    let inferredArrLen = 0;
                                    if (g.type === 0 && size > 2) inferredArrLen = Math.floor((size - 2) / 2);
                                    if (g.type === 1 && size > 8) inferredArrLen = Math.floor((size - 2) / 8);
                                    // String Array Inference (Heuristic: Try to fit elements)
                                    if (g.type === 2 && g.maxLen > 0 && size > 2) {
                                        // Size = 2 + Elements * (maxLen + 1)
                                        // Elements = (Size - 2) / (maxLen + 1)
                                        const elemSize = g.maxLen + 1;
                                        if ((size - 2) % elemSize === 0) {
                                            inferredArrLen = (size - 2) / elemSize;
                                        } else {
                                            // Fallback Heuristic
                                            inferredArrLen = Math.floor((size - 2) / elemSize);
                                        }
                                    }

                                    if (inferredArrLen > 0) {
                                        g.arrayLen = inferredArrLen;
                                        varMap[mappedAddr].arrayLen = inferredArrLen;
                                    }
                                }
                                // REMOVED: Aggressive inference that caused scalars to appear as arrays (False Positives)
                            }
                        }
                    }
                });
            }


            if (externals.length > 0) {
                externals.forEach(e => {
                    let mappedAddr = null;

                    // If External has an explicit address, it might be handled in "Map Locals" historically, 
                    // but let's handle it here if it matches 'remainingVars'.
                    if (e.addr !== undefined) {
                        // Address-based matching currently happens in Locals loop.
                        // We can leave it there OR handle it here.
                        // If we handle it here, we ensure it's prioritized.
                        if (remainingVars.includes(e.addr)) {
                            mappedAddr = e.addr;
                        }
                    }
                    else {
                        // No explicit address. Use Lax / Extern Logic.
                        // 1. Extern Access Check
                        const externCandidates = remainingVars.filter(v => externAccesses.has(v));
                        const candIdx = externCandidates.findIndex(v => getScanType(v) === e.type);

                        if (candIdx !== -1) {
                            mappedAddr = externCandidates[candIdx];
                        }
                        // 2. Lax Match (First variable of type)
                        else {
                            const laxIdx = remainingVars.findIndex(v => getScanType(v) === e.type);
                            if (laxIdx !== -1) {
                                mappedAddr = remainingVars[laxIdx];
                            }
                        }
                    }

                    if (mappedAddr !== null) {
                        // Apply mapping
                        varMap[mappedAddr] = { name: e.name, type: e.type, isExternal: true }; // isExternal true effectively mimics Global usage logic

                        if (stringFixupsMap[mappedAddr]) {
                            varMap[mappedAddr].maxLen = stringFixupsMap[mappedAddr];
                        }
                        if (arrayFixups[mappedAddr]) {
                            varMap[mappedAddr].arrayLen = arrayFixups[mappedAddr];
                        }

                        // Remove from remainingVars
                        remainingVars = remainingVars.filter(v => v !== mappedAddr);
                    }
                });
            }

            // 5. Map Locals
            let localCounter = 1;
            const locals = remainingVars;

            locals.forEach(off => {
                if (!varMap[off]) {
                    const ext = externals.find(e => e.addr === off);

                    let type = 1;
                    let suffix = '';
                    if (stringVars.has(off)) { type = 2; suffix = '$'; }
                    else if (intVars.has(off)) { type = 0; suffix = '%'; }

                    if (ext) {
                        let name = ext.name || `L${Math.abs(off).toString(16).toUpperCase()}${suffix}`;
                        varMap[off] = { name: name, type: ext.type !== undefined ? ext.type : type, isExternal: true };
                    } else {
                        let name = `L${localCounter}${suffix}`;
                        while (Object.values(varMap).some(v => v.name === name)) {
                            localCounter++;
                            name = `L${localCounter}${suffix}`;
                        }
                        localCounter++;

                        varMap[off] = { name: name, type: type, isLocal: true };

                        if (stringFixupsMap[off]) varMap[off].maxLen = stringFixupsMap[off];
                        if (arrayFixups[off]) varMap[off].arrayLen = arrayFixups[off];
                        if (arrayVars.has(off)) {
                            varMap[off].isArray = true;
                        }

                        // Size inference
                        let nextOff = 0;
                        // Note: 'availableVars' is sorted but contains Params/Globals/Locals.
                        // To infer distinct size for Locals, ideally we look at 'availableVars' 
                        // (which is ALL vars sorted). 
                        // So we can still use availableVars for neighbor finding.
                        const idx = availableVars.indexOf(off);
                        if (idx > 0) nextOff = availableVars[idx - 1];
                        const size = Math.abs(nextOff - off);

                        if (type === 2) {
                            if (varMap[off].isArray) {
                                // String Array Inference
                                // Size = (MaxLen + 1) * AllocElements
                                // We need to find factors of 'size'
                                let bestLen = 0;
                                let bestCount = 0;

                                // Heuristic: Iterate potential Element Sizes (Len + 1)
                                // We prefer Lenc > 1.
                                // Exclude elemSize == size (Count=1) to favor array dimensions for detected arrays.
                                for (let elemSize = 2; elemSize < size; elemSize++) {
                                    if (size % elemSize === 0) {
                                        let count = size / elemSize;
                                        let len = elemSize - 1;
                                        // Factors found.
                                        // Which one is 'best'?
                                        // Valid len is usually 255 or smaller.
                                        if (len > 255) continue;

                                        // Update best fit.
                                        // BUT arrays are huge.
                                        // Start loop from 2 up means we find smallest Len first (Largest Count).
                                        // If we want Largest Len, we should store all and pick.
                                        bestLen = len;
                                        bestCount = count;
                                        // Keep looping to find larger lengths?
                                    }
                                }

                                if (bestLen > 0) {
                                    // OPL arrays are declared as DIM(Count, MaxLen) meaning Count elements (0..Count-1)? 
                                    // Actually DIM A$(10) is 10 count?
                                    // Compiler allocs (Dim[0] + 1).
                                    // So if AllocElements is 7, the Dim is 6.
                                    varMap[off].maxLen = bestLen;
                                    varMap[off].arrayLen = bestCount - 1;
                                } else {
                                    // Fallback if prime or weird: Scalar-ish array?
                                    // Treat as Array of 1 element?
                                    varMap[off].maxLen = (size > 1 ? size - 1 : 1);
                                    varMap[off].arrayLen = 1;
                                }
                            } else {
                                // Scalar String
                                if (!varMap[off].maxLen) {
                                    const inferredLen = size - 1;
                                    varMap[off].maxLen = (inferredLen > 0 && inferredLen < 256) ? inferredLen : 255;
                                }
                            }
                        } else if (varMap[off].isArray) {
                            if (type === 0) varMap[off].arrayLen = Math.floor((size - 2) / 2) - 0; // -1 for 0-base? Compiler uses (Dim+1). Size = 2 * (Dim+1) -> Dim = (Size/2) - 1.
                            // Current code: Math.floor((size - 2) / 2).  If Size=14 (6+1 elements), (12)/2 = 6. Correct.
                            if (type === 1) varMap[off].arrayLen = Math.floor((size - 2) / 8); // Same logic? 
                            // Compiler: size = 8 * allocElements. (No +2?). Local logic lines 406-409.
                            // Locals: size = elemSize * allocElements.
                            // So Size / ElemSize = AllocElements.
                            // Dim = AllocElements - 1.
                            if (type === 0) varMap[off].arrayLen = Math.floor(size / 2) - 1;
                            if (type === 1) varMap[off].arrayLen = Math.floor(size / 8) - 1;
                        }
                    }
                }
            });

            return varMap;
        }

        analyzeControlFlow(codeBlock, start, size, options = {}) {
            const toEvenHex = (val, bytes = 1) => this.toEvenHex(val, bytes);

            const log = (msg) => {
                if (options.logCallback) {
                    options.logCallback({ pc: "Flow", bytes: "", opName: "Scan", comment: msg });
                }
            };

            const flow = {
                starts: {}, targets: {}, jumps: {}, labels: new Set(), structureLabels: new Set(), forceLabels: new Set()
            };
            let pc = start;
            log(`Analyzing control flow (Start:${toEvenHex(start, 2)} Size:${size})`);
            const instructions = [];
            while (pc < start + size && pc < codeBlock.length) {
                const op = codeBlock[pc];
                if (op === undefined) break; // Robustness: end of buffer
                const def = this.opcodes[op];
                if (!def) { pc++; continue; }
                const instSize = this.instHandler.getInstructionSize(codeBlock, pc, def);
                const args = this.instHandler.getArgs(codeBlock, pc, def);
                instructions.push({ pc, op, args, size: instSize });
                if (op === 0x7E || op === 0x51 || op === 0x53) { // BranchIfFalse(7E), GOTO(51), ONERR(53)
                    const target = (pc + 1) + args.D;
                    flow.labels.add(target);
                }
                pc += instSize;
            }


            // Helper to add structure
            const addStart = (pc, struct) => {
                if (!flow.starts[pc]) flow.starts[pc] = [];
                flow.starts[pc].push(struct);
            };
            const addTarget = (pc, struct) => {
                if (!flow.targets[pc]) flow.targets[pc] = [];
                flow.targets[pc].push(struct);
            };

            // Structure detection
            for (let i = 0; i < instructions.length; i++) {
                const inst = instructions[i];

                // DO ... UNTIL condition
                if (inst.op === 0x7E) {
                    const target = (inst.pc + 1) + inst.args.D;
                    if (target < inst.pc) {
                        const instSize = inst.size || 3;
                        // For DO..UNTIL, CONTINUE points to the condition evaluation.
                        // We can estimate condition start by looking for a label 
                        // just before the branch, or use the branch itself if none.
                        let condStart = inst.pc;
                        for (let j = i - 1; j >= 0; j--) {
                            if (instructions[j].pc <= target) break;
                            if (flow.labels.has(instructions[j].pc)) {
                                condStart = instructions[j].pc;
                                // Keep looking back for the EARLIEST label after loop body
                            }
                        }

                        addStart(target, { type: 'DO', end: inst.pc + instSize, cond: condStart });
                        addTarget(inst.pc, { type: 'UNTIL', start: target, condition: true });
                        flow.jumps[inst.pc] = { type: 'DO' };
                        flow.structureLabels.add(target);
                        if (condStart !== inst.pc) flow.structureLabels.add(condStart);
                        flow.structureLabels.add(inst.pc + instSize);
                        log(`Detected DO...UNTIL (Start:${target.toString(16)} End:${(inst.pc + instSize).toString(16)} CondRef:${condStart.toString(16)})`);
                        continue;
                    }
                }
            }

            // Forward scans for IF/WHILE
            for (let i = 0; i < instructions.length; i++) {
                const inst = instructions[i];
                if (inst.op === 0x7E) { // BranchIfFalse
                    const target = (inst.pc + 1) + inst.args.D;
                    if (target > inst.pc) {
                        // Check if target is preceded by GOTO back to here (WHILE)
                        const targetInstIndex = instructions.findIndex(in_ => in_.pc === target);
                        if (targetInstIndex > 0) {
                            const prev = instructions[targetInstIndex - 1];
                            if (prev.op === 0x51) { // GOTO
                                const gotoTarget = (prev.pc + 1) + prev.args.D;
                                // CM/XP back-jump often points to the start of the condition expression
                                // rather than the BranchIfFalse itself.
                                if (gotoTarget <= inst.pc && gotoTarget > (inst.pc - 20)) {
                                    // It's a WHILE loop
                                    addStart(gotoTarget, { type: 'WHILE', end: target });
                                    addTarget(prev.pc, { type: 'ENDWH', start: gotoTarget });
                                    flow.jumps[gotoTarget] = { type: 'WHILE_TOP' };
                                    flow.jumps[inst.pc] = { type: 'WHILE' };
                                    flow.jumps[prev.pc] = { type: 'WHILE' };
                                    flow.structureLabels.add(gotoTarget);
                                    flow.structureLabels.add(target);
                                    log(`Detected WHILE loop (Start:${gotoTarget.toString(16)} End:${target.toString(16)})`);
                                    continue;
                                }
                            }
                        }

                        // It's an IF
                        const elseJumpIndex = instructions.findIndex(in_ => in_.pc === target);
                        let isElse = false;
                        if (elseJumpIndex > 0) {
                            const prev = instructions[elseJumpIndex - 1];
                            if (prev.op === 0x51) { // GOTO
                                const endifTarget = (prev.pc + 1) + prev.args.D;
                                if (endifTarget > target) {
                                    // It's an IF ... ELSE ... ENDIF
                                    addStart(inst.pc, { type: 'IF', else: target, end: endifTarget });
                                    addTarget(prev.pc, { type: 'ELSE', start: inst.pc });
                                    addTarget(endifTarget, { type: 'ENDIF', start: inst.pc });
                                    flow.jumps[inst.pc] = { type: 'IF' };
                                    flow.jumps[prev.pc] = { type: 'ELSE' };
                                    flow.structureLabels.add(target);
                                    if (endifTarget < start + size) flow.structureLabels.add(endifTarget);
                                    log(`Detected IF...ELSE...ENDIF (Start:${inst.pc.toString(16)} Else:${target.toString(16)} End:${endifTarget.toString(16)})`);
                                    isElse = true;
                                }
                            }
                        }

                        if (!isElse) {
                            // Simple IF ... ENDIF
                            addStart(inst.pc, { type: 'IF', end: target });
                            addTarget(target, { type: 'ENDIF', start: inst.pc });
                            flow.jumps[inst.pc] = { type: 'IF' };
                            if (target < start + size) flow.structureLabels.add(target);
                            log(`Detected IF...ENDIF (Start:${inst.pc.toString(16)} End:${target.toString(16)})`);
                        }
                    }
                }
            }

            // FINAL PASS: Identify Explicit GOTOs (Not Structural, Not Loop Control)
            // We need to track the Loop Stack to identify BREAK/CONTINUE targets effectively.
            const loopStack = [];
            for (let i = 0; i < instructions.length; i++) {
                const inst = instructions[i];
                if (flow.starts[inst.pc]) {
                    for (const struct of flow.starts[inst.pc]) {
                        if (struct.type === 'DO' || struct.type === 'WHILE') {
                            loopStack.push({ type: struct.type, start: inst.pc, end: struct.end, cond: struct.cond });
                        }
                    }
                }

                if (inst.op === 0x51) { // GOTO
                    const target = (inst.pc + 1) + inst.args.D;
                    let isStructural = !!flow.jumps[inst.pc]; // Already marked as ELSE/WHILE/etc?

                    if (!isStructural && loopStack.length > 0) {
                        // Check for BREAK/CONTINUE
                        const currentLoop = loopStack[loopStack.length - 1];
                        const loopTop = (currentLoop.type === 'DO' && currentLoop.cond) ? currentLoop.cond : currentLoop.start; // start of WHILE is top
                        // Note: WHILE struct.start is gotoTarget (Top), DO struct.start is target (Top).

                        // For WHILE, analyze passes: addStart(gotoTarget, ...). gotoTarget is the loop top.
                        // So currentLoop.start is correct for Top.

                        if (target === loopTop || target === currentLoop.end) {
                            isStructural = true; // Treats BREAK/CONTINUE as Structural (Hidden)
                        }
                    }

                    if (!isStructural) {
                        flow.forceLabels.add(target);
                    }
                } else if (inst.op === 0x53) { // ONERR
                    const target = (inst.pc + 1) + inst.args.D;
                    if (inst.args.D !== 0) flow.forceLabels.add(target);
                } else if (inst.op === 0x7E) { // BranchIfFalse
                    if (!flow.jumps[inst.pc]) {
                        const target = (inst.pc + 1) + inst.args.D;
                        flow.forceLabels.add(target);
                    }
                }

                if (flow.targets[inst.pc]) {
                    // Check if we are popping a loop
                    // targets[pc] contains ENDWH, UNTIL, ENDIF, ELSE
                    // ENDWH and UNTIL pop loops.
                    const structs = flow.targets[inst.pc];
                    for (const s of structs) {
                        if (s.type === 'UNTIL' || s.type === 'ENDWH') {
                            loopStack.pop();
                        }
                    }
                }
            }
            return flow;
        }


    }

    if (typeof window !== 'undefined') {
        window.OPLDecompiler = OPLDecompiler;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { OPLDecompiler };
    }
})();
