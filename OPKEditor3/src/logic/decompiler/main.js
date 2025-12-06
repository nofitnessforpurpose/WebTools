/**
 * main.js
 * 
 * OPL Decompiler Main Module
 * Orchestrates the decompilation process.
 * 
 * STRICTLY FOR PSION ORGANISER II (OPLE)
 */

class OPLDecompiler {
    constructor() {
        this.opcodes = QCODE_DEFS;
        this.floatSize = 6; // Strictly 6-byte for Psion Organiser II
        this.instHandler = new InstructionHandler(this.opcodes, this.floatSize);
        this.sourceGen = new SourceGenerator(this.instHandler);
    }

    decompile(codeBlock, procName = "main", options = {}) {
        if (!codeBlock || codeBlock.length < 4) return "REM Error: Data too short";

        // Default to Organiser II settings
        this.floatSize = 6;
        this.opcodes = QCODE_DEFS;
        this.instHandler = new InstructionHandler(this.opcodes, this.floatSize);
        this.sourceGen = new SourceGenerator(this.instHandler);

        let offset = 0;
        const header = this.parseHeader(codeBlock, offset);
        const flow = this.analyzeControlFlow(codeBlock, header.qcodeStart, header.qcodeSize - (header.isLZ ? 2 : 0));
        const varMap = this.scanVariables(codeBlock, header);

        return this.sourceGen.generateSource(header, varMap, flow, codeBlock, procName, options);
    }

    parseHeader(codeBlock, offset) {
        const readWord = () => {
            const val = (codeBlock[offset] << 8) | codeBlock[offset + 1];
            offset += 2;
            return val;
        };
        const readByte = () => codeBlock[offset++];
        const readString = (len) => {
            let s = "";
            for (let i = 0; i < len; i++) s += String.fromCharCode(readByte());
            return s;
        };

        const varSpaceSize = readWord();
        const qcodeSize = readWord();

        const numParams = readByte();
        const paramTypes = [];
        for (let i = 0; i < numParams; i++) paramTypes.push(readByte());

        const globalTableSize = readWord();
        const globalTableEnd = offset + globalTableSize;
        const globals = [];
        let currentGlobalAddr = 0; // Inferred address for globals
        while (offset < globalTableEnd) {
            const len = readByte();
            const name = readString(len);
            const type = readByte();
            const addr = readWord(); // Jaap's ref confirms Address IS present in header!
            globals.push({ name, type, addr });
        }

        const externalTableSize = readWord();
        const externalTableEnd = offset + externalTableSize;
        const externals = [];
        while (offset < externalTableEnd) {
            // Check for Offset/Type format (common in some binaries) vs Name/Type
            // Heuristic: If first byte is 0xFF, it's likely a negative offset (2 bytes) + Type (1 byte).
            // If it's a length, 0xFF would mean a 255-byte name, which is unlikely and would exceed table size.
            if (codeBlock[offset] === 0xFF) {
                const addr = readWord();
                const type = readByte();
                externals.push({ addr, type });
            } else {
                const len = readByte();
                const name = readString(len);
                const type = readByte();
                externals.push({ name, type });
            }
        }

        const stringFixupsSize = readWord();
        const stringFixupsEnd = offset + stringFixupsSize;
        const stringFixups = [];
        while (offset < stringFixupsEnd) {
            const addr = readWord();
            const len = readByte();
            stringFixups.push({ addr, len });
        }

        const arrayFixupsSize = readWord();
        const arrayFixupsEnd = offset + arrayFixupsSize;
        const arrayFixups = {};
        while (offset < arrayFixupsEnd) {
            const addr = readWord();
            const len = readWord();
            arrayFixups[addr] = len;
        }

        const qcodeStart = offset;
        let isLZ = false;
        let actualQCodeStart = qcodeStart;
        // Check for LZ signature (Org2 specific?)
        if (qcodeSize >= 2 && codeBlock[qcodeStart] === 0x59 && codeBlock[qcodeStart + 1] === 0xB2) {
            isLZ = true;
            actualQCodeStart += 2;
        }

        return {
            varSpaceSize, qcodeSize, numParams, paramTypes,
            globals, externals, stringFixups, arrayFixups,
            qcodeStart, actualQCodeStart, isLZ
        };
    }

    scanVariables(codeBlock, header) {
        const varMap = {};
        const { globals, externals, stringFixups, arrayFixups, actualQCodeStart, qcodeStart, qcodeSize, numParams, paramTypes } = header;

        // Map Globals
        globals.forEach(g => {
            let addr = g.addr;
            if (addr > 32767) addr -= 65536;
            varMap[addr] = { name: g.name, type: g.type, isGlobal: true };
            const fixup = stringFixups.find(f => f.addr === g.addr);
            if (fixup) {
                varMap[addr].maxLen = fixup.len;
                g.maxLen = fixup.len;
            }
            if (arrayFixups[g.addr]) {
                varMap[addr].arrayLen = arrayFixups[g.addr];
                g.arrayLen = arrayFixups[g.addr];
            }
        });

        const stringFixupsMap = {};
        stringFixups.forEach(f => {
            let addr = f.addr;
            if (addr > 32767) addr -= 65536;
            stringFixupsMap[addr] = f.len;
        });

        const accessedVars = new Set();
        const intVars = new Set();
        const floatVars = new Set();
        const stringVars = new Set();
        const arrayVars = new Set();

        let pc = actualQCodeStart;
        while (pc < qcodeStart + qcodeSize) {
            const op = codeBlock[pc];
            const def = this.opcodes[op];
            if (!def) { pc++; continue; }

            let addr = null;
            if (def.args.includes('v')) {
                // v is variable length: 1 byte, or 2 bytes if first is >= 0xFE
                let val = codeBlock[pc + 1];
                if (val >= 0xFE) {
                    addr = (val << 8) | codeBlock[pc + 2];
                } else {
                    // Sign extend 1-byte value
                    addr = (val & 0x80) ? val - 256 : val;
                }
            } else if (def.args.includes('V')) {
                // V is 2 bytes
                addr = (codeBlock[pc + 1] << 8) | codeBlock[pc + 2];
            }

            if (addr !== null) {
                if (addr > 32767) addr -= 65536;
                accessedVars.add(addr);

                // Mark as accessed if already in map (e.g. Globals)
                if (varMap[addr]) {
                    varMap[addr].accessed = true;
                }

                // Type detection
                if ([0x02, 0x05, 0x0F, 0x12, 0x81, 0x09, 0x0C, 0x16, 0x19].includes(op)) stringVars.add(addr);
                else if ([0x00, 0x03, 0x0D, 0x10, 0x7F, 0x07, 0x0A, 0x14, 0x17].includes(op)) intVars.add(addr);
                else if ([0x01, 0x04, 0x0E, 0x11, 0x80, 0x08, 0x0B, 0x15, 0x18].includes(op)) floatVars.add(addr);

                // Array detection
                if ([0x03, 0x04, 0x05, 0x10, 0x11, 0x12, 0x0A, 0x0B, 0x0C, 0x17, 0x18, 0x19].includes(op)) {
                    arrayVars.add(addr);
                }
            }

            pc += this.instHandler.getInstructionSize(codeBlock, pc, def);
        }

        // Identify Parameters (Heuristic: Highest offsets are usually params in OPL stack frame?)
        // Actually, let's use the numParams.
        // If we have params, they are usually at positive offsets relative to something, or specific offsets.
        // In OPL, params are pushed before call.
        // Let's assume the standard OPL convention: Params are at the top of the accessed vars?
        // Or maybe we can just map them if we know the offsets?
        // Without knowing the exact stack frame layout, we'll stick to the previous heuristic:
        // Sort accessed vars descending, take top 'numParams' as params.
        // But we must exclude Globals first.

        const potentialLocalsOrParams = Array.from(accessedVars).filter(addr => !varMap[addr]);
        // Sort Descending to separate Params (High) from Locals (Low)
        potentialLocalsOrParams.sort((a, b) => b - a);

        // Extract Params (p1 is Highest Offset)
        const params = potentialLocalsOrParams.slice(0, numParams);

        for (let i = 0; i < numParams; i++) {
            if (i < params.length) {
                const off = params[i];
                const type = paramTypes[i];
                const suffix = this.instHandler.getTypeSuffix(type);
                varMap[off] = { name: `p${i + 1}${suffix}`, type: type, isParam: true };
            }
        }

        // Handle Remaining (Locals or Externals)
        let localCounter = 1;
        // Sort by offset to ensure deterministic naming (descending for stack order?)
        potentialLocalsOrParams.sort((a, b) => b - a);

        potentialLocalsOrParams.forEach(off => {
            if (!varMap[off]) {
                // Check if it's in Externals list (by address)
                const ext = externals.find(e => e.addr === off); // If externals have addr

                let type = 1; // Default Float
                let suffix = '';
                if (stringVars.has(off)) { type = 2; suffix = '$'; }
                else if (intVars.has(off)) { type = 0; suffix = '%'; }

                if (ext) {
                    let name = ext.name || `L${Math.abs(off).toString(16).toUpperCase()}${suffix}`;
                    varMap[off] = { name: name, type: ext.type !== undefined ? ext.type : type, isExternal: true };
                } else {
                    // It's a Local
                    // Generate sequential name L1, L2, etc.
                    let name = `L${localCounter}${suffix}`;

                    // Ensure uniqueness
                    while (true) {
                        let collision = false;
                        for (const key in varMap) {
                            if (varMap[key].name === name) {
                                collision = true;
                                break;
                            }
                        }
                        if (!collision) break;
                        localCounter++;
                        name = `L${localCounter}${suffix}`;
                    }
                    localCounter++;

                    varMap[off] = { name: name, type: type, isLocal: true };

                    if (stringFixupsMap[off]) varMap[off].maxLen = stringFixupsMap[off];
                    if (arrayFixups[off]) varMap[off].arrayLen = arrayFixups[off];

                    // Infer size from stack layout
                    // potentialLocalsOrParams is sorted descending (b - a)
                    // e.g. -10, -20, -30
                    // Size of var at -20 is (-10) - (-20) = 10
                    // Size of var at -10 is (Start of Locals) - (-10)
                    // Start of locals is usually 0 (FP).

                    let nextOff = 0; // Default top of stack (FP)
                    const idx = potentialLocalsOrParams.indexOf(off);
                    if (idx > 0) {
                        nextOff = potentialLocalsOrParams[idx - 1];
                    }

                    const size = Math.abs(nextOff - off);

                    if (type === 2) { // String
                        if (!varMap[off].maxLen) {
                            // If no fixup, infer from size
                            // String takes maxLen + 1 bytes
                            const inferredLen = size - 1;
                            if (inferredLen > 0 && inferredLen < 256) {
                                varMap[off].maxLen = inferredLen;
                            } else {
                                varMap[off].maxLen = 255; // Fallback
                            }
                        }
                    } else if (varMap[off].isArray) {
                        // Array
                        // Int Array: 2 * len + 2 (size word)
                        // Float Array: 8 * len + 2
                        // String Array: (maxLen + 1) * len + 2
                        // We don't know maxLen for string array easily without fixup
                        // But for Int/Float:
                        if (type === 0) {
                            const len = Math.floor((size - 2) / 2);
                            if (len > 0) varMap[off].arrayLen = len;
                        } else if (type === 1) {
                            const len = Math.floor((size - 2) / 8);
                            if (len > 0) varMap[off].arrayLen = len;
                        }
                    }
                }
            }
        });

        return varMap;
    }

    analyzeControlFlow(codeBlock, start, size) {
        const flow = {
            starts: {}, targets: {}, jumps: {}, labels: new Set(), structureLabels: new Set(), forceLabels: new Set()
        };
        let pc = start;
        const instructions = [];
        while (pc < start + size) {
            const op = codeBlock[pc];
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
                    addStart(target, { type: 'DO', end: inst.pc });
                    addTarget(inst.pc, { type: 'UNTIL', start: target, condition: true });
                    flow.jumps[inst.pc] = { type: 'DO' };
                    flow.structureLabels.add(target);
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
                            if (gotoTarget === inst.pc) {
                                // It's a WHILE loop
                                addStart(inst.pc, { type: 'WHILE', end: target });
                                addTarget(prev.pc, { type: 'ENDWH', start: inst.pc });
                                flow.jumps[inst.pc] = { type: 'WHILE' };
                                flow.jumps[prev.pc] = { type: 'WHILE' };
                                flow.structureLabels.add(inst.pc);
                                flow.structureLabels.add(target);
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
                                flow.structureLabels.add(endifTarget);
                                isElse = true;
                            }
                        }
                    }

                    if (!isElse) {
                        // Simple IF ... ENDIF
                        addStart(inst.pc, { type: 'IF', end: target });
                        addTarget(target, { type: 'ENDIF', start: inst.pc });
                        flow.jumps[inst.pc] = { type: 'IF' };
                        flow.structureLabels.add(target);
                    }
                }
            }
        }
        return flow;
    }

    getControlFlow(codeBlock, procName) {
        const header = this.parseHeader(codeBlock, 0);
        const { actualQCodeStart, qcodeStart, qcodeSize } = header;

        const varMap = this.scanVariables(codeBlock, header);
        const flow = this.analyzeControlFlow(codeBlock, actualQCodeStart, qcodeStart + qcodeSize);

        const instructions = [];
        let pc = actualQCodeStart;
        const stack = new DecompilerStack();
        const labelMap = {}; // We might need to pre-calc labels like in decompile

        // Pre-calculate label names (simplified)
        const usedLabels = new Set();
        for (const target of flow.labels) {
            if (!flow.structureLabels.has(target)) usedLabels.add(target);
        }
        if (flow.forceLabels) {
            for (const target of flow.forceLabels) usedLabels.add(target);
        }
        const sortedLabels = Array.from(usedLabels).sort((a, b) => a - b);
        sortedLabels.forEach((target, index) => {
            labelMap[target] = `label_${index + 1}`;
        });

        while (pc < qcodeStart + qcodeSize) {
            const op = codeBlock[pc];
            const def = this.opcodes[op];

            if (!def) {
                instructions.push({ pc, text: `UNKNOWN ${op.toString(16)}`, size: 1 });
                pc++;
                continue;
            }

            const size = this.instHandler.getInstructionSize(codeBlock, pc, def);
            const args = this.instHandler.getArgs(codeBlock, pc, def);

            let text = "";
            try {
                // We use handleInstruction to get the text, but we need to manage the stack carefully.
                // handleInstruction modifies the stack.
                // This might be tricky if we want to visualize *state*, but for now just text is fine.
                const expr = this.instHandler.handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap);
                if (expr) text = expr;
                else text = def.desc; // Fallback or if it pushed to stack
            } catch (e) {
                text = `ERROR: ${e.message}`;
            }

            instructions.push({ pc, text, size, op: def.desc });
            pc += size;
        }

        return { instructions, flow, varMap };
    }
}

window.OPLDecompiler = new OPLDecompiler();
