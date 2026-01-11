(function () {
    'use strict';

    /**
     * instruction_handler.js
     * 
     * Instruction Handler
     * Handles parsing and processing of individual QCode instructions.
     */

    const PRECEDENCE = {
        FUNC: 99,
        ATOM: 100,
        NOT: 8,
        UNARY_MINUS: 9,
        '**': 7,
        '*': 6, '/': 6,
        '+': 5, '-': 5,
        '=': 4, '<': 4, '>': 4, '<=': 4, '>=': 4, '<>': 4,
        AND: 3,
        OR: 2
    };

    class InstructionHandler {
        constructor(opcodes, floatSize, feOpcodes = {}) {
            this.opcodes = opcodes;
            this.feOpcodes = feOpcodes;
            this.floatSize = floatSize;
            this.trapNext = false;
            this.procMap = {}; // procedureName -> { paramCount, returnType }
        }

        resetTrap() {
            this.trapNext = false;
        }

        getInstructionDef(codeBlock, pc) {
            const op = codeBlock[pc];
            if (op === 0xFE && pc + 1 < codeBlock.length) {
                const extOp = codeBlock[pc + 1];
                return this.feOpcodes[extOp] || { desc: `Unknown FE_${extOp.toString(16).toUpperCase()}`, args: '' };
            }
            return this.opcodes[op];
        }

        getInstructionSize(codeBlock, pc, def) {
            let op = codeBlock[pc];
            if (op === undefined) return 1; // Robustness
            let size = (op === 0xFE) ? 2 : 1;
            const argPC = (op === 0xFE) ? pc + 1 : pc;

            // Re-fetch definition if it wasn't passed in properly for FE prefix
            if (op === 0xFE) {
                def = this.getInstructionDef(codeBlock, pc);
            }

            if (def && def.args) {
                const args = def.args.split(' ');
                for (const arg of args) {
                    if (!arg || arg === '-') continue;
                    else if (arg === 'v' || arg === 'V' || arg === 'W' || arg === 'I' || arg === 'D' || arg === 'm') {
                        size += 2;
                    }
                    else if (arg === 'B' || arg === 'b' || arg === 'O' || arg === 's' || arg === 'i' || arg === 'f') size += 1;
                    else if (arg === 'W' || arg === 'I' || arg === 'V' || arg === 'D' || arg === 'm') size += 2;
                    else if (arg === 'F') {
                        // Variable length float (Compact Form)
                        // First byte: Sign (bit 7) + Length (bits 0-6)
                        const firstByte = codeBlock[pc + size];
                        const len = firstByte & 0x7F;
                        size += 1 + len;
                    }
                    else if (arg === 'S') size += 1 + codeBlock[pc + size]; // Len + String
                    else if (arg === 'params') size += 1 + codeBlock[pc + size];
                    else if (arg === 'f+list') {
                        size += 1; // logicalFile
                        while ((pc + size) < codeBlock.length) {
                            const val = codeBlock[pc + size];
                            if (val === 0x88 || val === 0xFF) {
                                size += 1; // Terminator
                                break;
                            }
                            const len = codeBlock[pc + size + 1];
                            size += 1 + 1 + len;
                        }
                    }
                    else if (arg === 'code') {
                        // Smart Scan: Trace execution flow to find the true end of the block.
                        // Stops at RTS only if no pending branches go past it.
                        if (typeof HD6303Disassembler !== 'undefined') {
                            try {
                                const disassembler = new HD6303Disassembler();
                                const ops = disassembler.opcodes;
                                let offset = 0;
                                let maxTarget = 0; // Relative offset from standard pc

                                // Start scanning bytes after the 0x89 opcode
                                // pc points to 0x89 opcode.
                                // codeBlock[pc] is 0x89.
                                // Inline code starts at pc + size (which is pc+1 at this point).
                                // But wait, the existing loop used 'pc + size' as start.
                                // The `size` passed to start matching arg is already 1 (Ref lines 15-24).
                                // So we start scanning at pc + 1.

                                // Let's use 'tempOffset' relative to 'pc + 1'
                                let scanStart = pc + 1;
                                let currentScan = 0; // Offset from scanStart

                                while ((scanStart + currentScan) < codeBlock.length) {
                                    const op = codeBlock[scanStart + currentScan];
                                    const def = ops[op];

                                    if (!def) {
                                        currentScan++;
                                        continue;
                                    }

                                    let bytes = 1;
                                    if (def.mode === 'IMM' || def.mode === 'DIR' || def.mode === 'IND' || def.mode === 'REL' || def.mode === 'SWI_VAL') {
                                        bytes = 2;
                                    } else if (def.mode === 'IMM16' || def.mode === 'EXT' || def.mode === 'IMM_DIR' || def.mode === 'IMM_IND') {
                                        bytes = 3;
                                    } else if (def.mode === 'IMP') {
                                        bytes = 1;
                                    }

                                    // Branch Tracing
                                    if (def.mode === 'REL') {
                                        if ((scanStart + currentScan + 1) < codeBlock.length) {
                                            let rel = codeBlock[scanStart + currentScan + 1];
                                            if (rel >= 128) rel -= 256;
                                            const target = currentScan + 2 + rel;
                                            if (target > maxTarget) maxTarget = target;
                                        }
                                    }

                                    // Check for End Condition
                                    if (op === 0x39) { // RTS
                                        if (maxTarget <= currentScan) {
                                            // Found end
                                            size = (scanStart + currentScan + 1) - pc;
                                            break;
                                        }
                                    }

                                    if ((scanStart + currentScan + bytes) > codeBlock.length) {
                                        size = codeBlock.length - pc;
                                        break;
                                    }

                                    currentScan += bytes;
                                }
                                if (size === 1) size = codeBlock.length - pc; // Fallback if loop finishes without RTS

                            } catch (e) {
                                // console.error("Smart Scan failed, falling back", e);
                                // Fallback logic
                                let tempOffset = pc + size;
                                while (tempOffset < codeBlock.length) {
                                    if (codeBlock[tempOffset] === 0x39) {
                                        tempOffset++;
                                        break;
                                    }
                                    tempOffset++;
                                }
                                size = tempOffset - pc;
                            }
                        } else {
                            // Fallback logic (No disassembler)
                            let tempOffset = pc + size;
                            while (tempOffset < codeBlock.length) {
                                if (codeBlock[tempOffset] === 0x39) {
                                    tempOffset++; // Include RTS
                                    break;
                                }
                                tempOffset++;
                            }
                            size = tempOffset - pc;
                        }
                    }
                    else if (arg === 'fS') {
                        const len = codeBlock[pc + size + 1]; // +1 for logical file name
                        size += 1 + 1 + len;
                    }
                }
            }
            return size;
        }

        getArgs(codeBlock, pc, def) {
            const res = {};
            let op = codeBlock[pc];
            let offset = (op === 0xFE) ? pc + 2 : pc + 1;
            if (def.args) {
                const args = def.args.split(' ');
                for (const arg of args) {
                    if (!arg || arg === '-') continue;
                    if (offset >= codeBlock.length) break;
                    if (arg === 'V') {
                        let key = arg;
                        if (res[key] !== undefined) {
                            let i = 1;
                            while (res[key + '_' + i] !== undefined) i++;
                            key = key + '_' + i;
                        }
                        res[key] = (codeBlock[offset] << 8) | codeBlock[offset + 1];
                        offset += 2;
                    } else if (arg === 'v') {
                        let key = arg;
                        if (res[key] !== undefined) {
                            let i = 1;
                            while (res[key + '_' + i] !== undefined) i++;
                            key = key + '_' + i;
                        }
                        res[key] = (codeBlock[offset] << 8) | codeBlock[offset + 1];
                        offset += 2;
                    } else if (arg === 'V') {
                        let key = arg;
                        if (res[key] !== undefined) {
                            let i = 1;
                            while (res[key + '_' + i] !== undefined) i++;
                            key = key + '_' + i;
                        }
                        res[key] = (codeBlock[offset] << 8) | codeBlock[offset + 1];
                        offset += 2;
                    } else if (arg === 'B' || arg === 'O' || arg === 'b' || arg === 's' || arg === 'i' || arg === 'f') {
                        let key = arg;
                        if (res[key] !== undefined) {
                            let i = 1;
                            while (res[key + '_' + i] !== undefined) i++;
                            key = key + '_' + i;
                        }
                        res[key] = codeBlock[offset++];
                    } else if (arg === 'I' || arg === 'D') {
                        let val;
                        val = (codeBlock[offset] << 8) | codeBlock[offset + 1];
                        if (val > 32767) val -= 65536;
                        res[arg] = val;
                        offset += 2;
                    } else if (arg === 'F') {
                        // Variable length float
                        const firstByte = codeBlock[offset];
                        const len = firstByte & 0x7F;
                        // Pass the whole chunk including header
                        const buf = codeBlock.slice(offset, offset + 1 + len);
                        res[arg] = this.decodeFloat(buf);
                        offset += 1 + len;
                    } else if (arg === 'm') {
                        res[arg] = (codeBlock[offset] << 8) | codeBlock[offset + 1];
                        offset += 2;
                    } else if (arg === 'S') {
                        const len = codeBlock[offset++];
                        let s = "";
                        for (let i = 0; i < len; i++) s += String.fromCharCode(codeBlock[offset + i]);
                        res[arg] = s;
                        offset += len;
                    } else if (arg === 'fS') {
                        res.logicalFile = codeBlock[offset++];
                        const len = codeBlock[offset++];
                        let s = "";
                        for (let i = 0; i < len; i++) s += String.fromCharCode(codeBlock[offset + i]);
                        res.field = s;
                        offset += len;
                    } else if (arg === 'params') {
                        const nameLen = codeBlock[offset++];
                        let name = "";
                        for (let i = 0; i < nameLen; i++) name += String.fromCharCode(codeBlock[offset + i]);
                        offset += nameLen;
                        res[arg] = { name, numArgs: 0 };
                    } else if (arg === 'f+list') {
                        res.logicalFile = codeBlock[offset++];
                        res.fields = [];
                        while (offset < codeBlock.length) {
                            const type = codeBlock[offset++];
                            if (type === 0x88 || type === 0xFF) {
                                break;
                            }
                            const len = codeBlock[offset++];
                            let name = "";
                            for (let i = 0; i < len; i++) name += String.fromCharCode(codeBlock[offset + i]);
                            offset += len;
                            res.fields.push({ name, type });
                        }
                    } else if (arg === 'W') {
                        res[arg] = (codeBlock[offset] << 8) | codeBlock[offset + 1];
                        offset += 2;
                    }
                }
            }
            return res;
        }

        getTypeSuffix(type) {
            if (type === 0 || type === 3) return '%';
            if (type === 1 || type === 4) return '';
            if (type === 2 || type === 5) return '$';
            return '?';
        }

        formatAddress(val, usedSystemVars) {
            // Check if val is a simple integer literal string (positive or negative)
            if (typeof val === 'string' && /^-?\d+$/.test(val)) {
                let num = parseInt(val, 10);
                if (!isNaN(num)) {
                    // Normalize negative numbers for lookup (e.g. -24 -> 0xFFE8)
                    let lookupAddr = num;
                    if (lookupAddr < 0) lookupAddr += 65536;

                    const sysConsts = this.getSystemConstants();
                    if (usedSystemVars && sysConsts && sysConsts[lookupAddr]) {
                        usedSystemVars.add(lookupAddr);
                    }

                    // Convert to unsigned 16-bit for display
                    if (num < 0) num += 65536;

                    // Format as Hex
                    const hex = '$' + num.toString(16).toUpperCase(); // e.g. $FFFF
                    return hex;
                }
            }
            return val;
        }

        handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap, usedSystemVars) {
            // DEBUG: Trace execution
            if (def && (def.desc === 'BEEP' || def.desc === 'PRINT' || def.desc === 'AT')) {

            }

            const isLZ = (codeBlock && codeBlock[0x14] === 0x24); // Simple heuristic: Flag 0x24 is LZ

            // Push Variables
            // Push Variables
            if (def.args.includes('v') || def.args.includes('V')) {
                // Check if it's an Assign op, which uses 'v' in LZ but not CM/XP
                if ([0x7F, 0x80, 0x81].includes(op)) {
                    // Handled in Assignments block
                } else {
                    let addr = (codeBlock[pc + 1] << 8) | codeBlock[pc + 2];
                    if (addr > 32767) addr -= 65536;

                    let varName = varMap[addr] ? varMap[addr].name : `L${Math.abs(addr).toString(16).toUpperCase()}`;
                    const varInfo = varMap[addr];

                    if ([0x03, 0x04, 0x05, 0x0A, 0x0B, 0x0C, 0x10, 0x11, 0x12, 0x17, 0x18, 0x19].includes(op)) {
                        const indexObj = stack.pop();
                        const index = indexObj ? (indexObj.text || '0') : '0';
                        varName += `(${index})`;
                    }

                    stack.push({ text: varName.trim(), prec: PRECEDENCE.ATOM });
                    return null;
                }
            }

            let trap = this.trapNext;
            if (op === 0x5A) { // TRAP
                this.trapNext = true;
                return null;
            }
            // Do not reset trapNext here; only reset when a statement is emitted (in SourceGenerator)

            if (op === 0x20) { stack.push({ text: args.B.toString(), prec: PRECEDENCE.ATOM }); return null; }
            if (op === 0x21 || op === 0x22) { stack.push({ text: args.I.toString(), prec: PRECEDENCE.ATOM }); return null; }
            if (op === 0x23) { stack.push({ text: args.F.toString(), prec: PRECEDENCE.ATOM }); return null; }
            if (op === 0x24) { stack.push({ text: `"${args.S.replace(/"/g, '""')}"`, prec: PRECEDENCE.ATOM }); return null; }
            if (op === 0x06) { stack.push({ text: `M${args.W / 8}`, prec: PRECEDENCE.ATOM }); return null; }
            if (op === 0x13) { stack.push({ text: `M${args.W / 8}`, prec: PRECEDENCE.ATOM }); return null; }

            if (op >= 0x1A && op <= 0x1F) {
                const logical = String.fromCharCode(65 + args.B);
                let fieldObj = stack.pop();
                let field = fieldObj ? (fieldObj.text || '') : 'BAD_FIELD';
                if (typeof field === 'string') field = field.trim();
                if (field && field.startsWith('"') && field.endsWith('"')) {
                    field = field.slice(1, -1);
                } else if (field) {
                    field = `(${field})`;
                }
                stack.push({ text: `${logical}.${field}`, prec: PRECEDENCE.ATOM });
                return null;
            }

            if (def.desc === 'ADDR') {
                let opObj = stack.pop();
                if (!opObj) opObj = { text: 'BAD_STACK', prec: 0 };
                let txt = opObj.text || '';
                if (typeof txt === 'string') {
                    txt = txt.trim();
                    if (txt.match(/\(.+\)$/)) {
                        txt = txt.replace(/\(.+\)$/, '()');
                    }
                }
                stack.push({ text: `ADDR(${txt})`, prec: PRECEDENCE.FUNC });
                return null;
            }

            // Specific Command Handlers

            if (def.desc === 'PRINT' || def.desc === 'LPRINT') {
                const isL = def.desc === 'LPRINT';
                const prefix = isL ? 'LPRINT' : 'PRINT';
                if (op === 0x72 || op === 0x77) return prefix + " ,";
                if (op === 0x73 || op === 0x78) return prefix;
                const valObj = stack.pop();
                const val = valObj ? (valObj.text || '') : '';
                return `${prefix} ${val}`;
            }

            if (def.desc === 'DROP') {
                const valObj = stack.pop();
                const val = valObj ? (valObj.text || '') : '';
                if (typeof val === 'string' && /^[A-Z0-9_$]+$/.test(val) && !['GET', 'KEY', 'KEY$'].includes(val)) return val + ":";
                if (typeof val === 'string' && val.startsWith('USR(')) return val;
                if (typeof val === 'string' && /^[A-Z0-9_$]+\(.*\)$/.test(val)) return val;
                return val;
            }

            if (def.desc === 'AT') {
                const yObj = stack.pop();
                const xObj = stack.pop();
                const y = yObj ? (yObj.text || '1') : '1';
                const x = xObj ? (xObj.text || '1') : '1';
                return `AT ${x},${y}`;
            }

            if (def.desc === 'BEEP') {
                const yObj = stack.pop();
                const xObj = stack.pop();
                const y = yObj ? (yObj.text || '100') : '100';
                const x = xObj ? (xObj.text || '100') : '100';
                return `BEEP ${x},${y}`;
            }

            if (def.desc === 'PAUSE') {
                const xObj = stack.pop();
                const x = xObj ? (xObj.text || '10') : '10';
                return `PAUSE ${x}`;
            }

            if (def.desc === 'POKEB') {
                let valObj = stack.pop();
                let addrObj = stack.pop();
                let val = valObj ? (valObj.text || '0') : '0';
                let addr = addrObj ? (addrObj.text || '0') : '0';
                if (typeof val === 'number') val = '$' + val.toString(16).toUpperCase();
                addr = this.formatAddress(addr, usedSystemVars);
                return `POKEB ${addr},${val}`;
            }

            if (def.desc === 'POKEW') {
                let valObj = stack.pop();
                let addrObj = stack.pop();
                let val = valObj ? (valObj.text || '0') : '0';
                let addr = addrObj ? (addrObj.text || '0') : '0';
                if (typeof val === 'number') val = '$' + val.toString(16).toUpperCase();
                addr = this.formatAddress(addr, usedSystemVars);
                return `POKEW ${addr},${val}`;
            }

            if (def.desc === 'RANDOMIZE') {
                const seedObj = stack.pop();
                const seed = seedObj ? (seedObj.text || '0') : '0';
                return `RANDOMIZE ${seed}`;
            }

            if (def.desc === 'CHECK') {
                return null; // Ignore check byte
            }

            if (op === 0x4F) { // CURSOR
                // Force O-byte logic even if args missing in legacy defs? 
                // We rely on getArgs/getInstructionSize being correct (based on constants.js), 
                // which we verified. args.O should be present.
                return args.O === 0 ? 'CURSOR OFF' : 'CURSOR ON';
            }

            if (op === 0x50) { // ESCAPE
                return args.O === 0 ? 'ESCAPE OFF' : 'ESCAPE ON';
            }

            if (def.desc === 'GOTO') {
                const target = (pc + 1) + args.D;
                const labelName = (labelMap && labelMap[target]) ? labelMap[target] : `Lab${target}`;
                return `GOTO ${labelName}::`;
            }

            if (def.desc === 'ONERR') {
                if (args.D === 0) return `ONERR OFF`;
                const target = (pc + 1) + args.D;
                const labelName = (labelMap && labelMap[target]) ? labelMap[target] : `Lab${target}`;
                return `ONERR ${labelName}::`;
            }

            if (def.desc === 'PROC') {
                const { name } = args.params;

                // Pop the argument count pushed to the stack by the OPL compiler
                const countObj = stack.pop();
                let argCount = 0;
                if (countObj && countObj.text !== undefined && countObj.text !== "BAD_STACK_UNDERFLOW") {
                    argCount = parseInt(countObj.text, 10);
                } else {
                    // Fallback: check procMap if stack underflowed or count is missing
                    if (this.procMap && this.procMap[name.toUpperCase()]) {
                        argCount = this.procMap[name.toUpperCase()].paramCount;
                    }
                }

                const procArgs = [];
                for (let i = 0; i < argCount; i++) {
                    // User Procedures (0x7D) interleave Type bytes (0=%, 1=none, 2=$)
                    const typeObj = stack.pop();
                    const valObj = stack.pop();

                    if (valObj && valObj.text !== "BAD_STACK_UNDERFLOW") {
                        procArgs.unshift(valObj.text || '');
                    } else if (typeObj && typeObj.text !== "BAD_STACK_UNDERFLOW") {
                        // Resilience: if we underflowed, treat the type byte as the value
                        procArgs.unshift(typeObj.text);
                    } else {
                        procArgs.unshift('?');
                    }
                }

                let call = `${name}:`;
                if (procArgs.length > 0) {
                    call += `(${procArgs.join(', ')})`;
                }

                // Logic: Push to stack and return null.
                // If this is a statement, the subsequent DROP opcode will pop this text and return it.
                // If this is an expression, an operator will pop it.
                stack.push({ text: call, prec: PRECEDENCE.FUNC });
                return null;
            }

            if (def.desc === 'USE') {
                const logical = String.fromCharCode(65 + args.B);
                return (trap ? "TRAP " : "") + `USE ${logical}`;
            }

            if (def.desc === 'CREATE' || def.desc === 'OPEN') {
                const specObj = stack.pop();
                const spec = specObj ? (specObj.text || '""') : '""';
                const logName = String.fromCharCode(65 + args.logicalFile); // 0->A, 1->B...

                let res = `${def.desc} ${spec},${logName}`;

                if (args.fields && args.fields.length > 0) {
                    const fields = args.fields.map(f => {
                        const suffix = this.getTypeSuffix(f.type);
                        // Prevent double suffixing if name already contains it
                        if (f.name.endsWith(suffix)) return f.name;
                        return f.name + suffix;
                    });
                    res += "," + fields.join(",");
                }
                return (trap ? "TRAP " : "") + res;
            }

            if (op === 0xFB) { // ELSEIF using LZ structure
                const target = (pc + 1) + args.D;
                const condObj = stack.pop();
                const cond = condObj ? (condObj.text || '0') : '0';
                return `ELSEIF ${cond} : REM LZ`;
            }

            if (def.desc === 'EXT') {
                const subcode = args.b; // 1st byte arg
                const hex = subcode.toString(16).toUpperCase().padStart(2, '0');
                return `REM LZ_EXT ${hex}`;
            }

            if (op === 0xFE) return null; // Ignore Prefix

            if (op === 0xF8) return "PRINT ;";

            if (op === 0x89) {
                let asmOutput = "";
                if (typeof OptionsManager !== 'undefined' && OptionsManager.getOption('decompileInlineAssembly') && typeof HD6303Disassembler !== 'undefined') {
                    const disassembler = new HD6303Disassembler();
                    const codeBytes = codeBlock.slice(pc + 1, pc + size);
                    asmOutput = disassembler.disassemble(codeBytes);
                } else {
                    asmOutput = `REM Inline Assembly (${size} bytes)`;
                }
                return `REM **ASSEMBLER** - The following assembly language will not compile (in this version).\nREM __asm\n${asmOutput}`;
            }
            if (op === 0xCA) return `REM Debug Procedure Name: ${args.S}`;
            if (op === 0xCB) return `REM Debug Line: ${args.I}, Col: ${args.I_1}`;

            if (def.desc.startsWith('POKE_M_F')) {
                const page = op; // e.g. 0xF4
                const offset = args.b; // 1st byte arg
                const value = args.b_1; // 2nd byte arg
                const fullAddr = (page << 8) | offset;
                // Use unsigned address for System Constant lookup to match definition file
                const lookupAddr = fullAddr;

                let comment = "";
                let hexAddr = '$' + (fullAddr & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

                const sysConsts = this.getSystemConstants();
                if (sysConsts && sysConsts[lookupAddr]) {
                    comment = `: REM ${sysConsts[lookupAddr]}`;
                    if (usedSystemVars) usedSystemVars.add(lookupAddr);
                } else if (varMap[fullAddr] || varMap[lookupAddr] || (lookupAddr > 32767 && varMap[lookupAddr - 65536])) {
                    // Check varMap with both signed and unsigned? varMap keys are usually signed for locals but globals?
                    // varMap keys are signed 16-bit.
                    let vKey = (lookupAddr > 32767) ? lookupAddr - 65536 : lookupAddr;
                    if (varMap[vKey]) comment = `: REM ${varMap[vKey].name}`;
                }

                return `POKEB ${hexAddr},${value}${comment}`;
            }

            // Operators (Pops AND Pushes)
            if (def.pops && def.pushes) {
                // Intercept PEEKB/PEEKW/USR/USR$ here before generic handling?
                // PEEKB (0x9B), PEEKW (0x9C), USR (0x9F), USR$ (0xC8)
                if ([0x9B, 0x9C, 0x9F, 0xC8].includes(op)) {
                    if (op === 0x9B || op === 0x9C) { // PEEKB/PEEKW (Pop 1 arg: Addr)
                        const addrObj = stack.pop();
                        let addr = addrObj ? (addrObj.text || '0') : '0';
                        addr = this.formatAddress(addr, usedSystemVars);
                        stack.push({ text: `${def.desc}(${addr})`, prec: PRECEDENCE.FUNC });
                        return null;
                    }
                    if (op === 0x9F || op === 0xC8) { // USR/USR$ (Pop 2 args: Addr, AX)

                        const axObj = stack.pop();
                        const addrObj = stack.pop();
                        let ax = axObj ? (axObj.text || '0') : '0';
                        let addr = addrObj ? (addrObj.text || '0') : '0';
                        addr = this.formatAddress(addr, usedSystemVars);
                        const expr = `${def.desc}(${addr},${ax})`;

                        // Lookahead: If next instruction consumes stack (e.g. DROP, Assign, Operator), push and return null.
                        // If next instruction ignores stack (e.g. Statement start), treat this as a statement (Implicit Drop).
                        let nextOpConsumes = false;
                        if (codeBlock && pc + size < codeBlock.length) {
                            const nextOp = codeBlock[pc + size];
                            const nextDef = this.opcodes[nextOp];

                            if (nextDef && nextDef.pops && nextDef.pops.trim().length > 0) {
                                nextOpConsumes = true;
                            }

                            // Helper: Some generic ops might consume?
                            // If USR is followed by POKE_M (pops=''), nextOpConsumes = false.
                            // If USR is followed by DROP (pops='I'), nextOpConsumes = true.
                        }

                        if (nextOpConsumes) {
                            stack.push({ text: expr, prec: PRECEDENCE.FUNC });
                            return null;
                        } else {
                            return (trap ? "TRAP " : "") + expr;
                        }
                    }
                }

                // Generic Argument Popping for Expressions (Operators/Functions)
                // Only run this if the instruction pushes a result (is an expression).
                // Commands that don't push result should fall through to specific handlers or generic command fallback.
                if (def.pushes) {
                    const pops = (def.pops && def.pops.trim().length > 0) ? def.pops.split(' ').length : 0;
                    const operands = [];
                    for (let i = 0; i < pops; i++) {
                        let opObj = stack.pop();
                        // DecompilerStack ensures we get an object, but let's be safe
                        if (!opObj) opObj = { text: 'BAD_STACK', prec: 0 };
                        if (typeof opObj.text === 'string') opObj.text = opObj.text.trim();
                        operands.unshift(opObj);
                    }

                    const currentPrec = PRECEDENCE[def.desc] || PRECEDENCE.FUNC;

                    // Helper to check if we should force parentheses for clarity
                    const shouldWrapForClarity = (opPrec, operandPrec) => {
                        // Aggressive wrapping for Logical/Bitwise operators (AND, OR, NOT)
                        // Wrap anything that isn't an Atom or Function call (prec 99).
                        if (opPrec <= 3 && operandPrec < 99) return true;
                        return false;
                    };

                    if (pops === 1) { // Unary
                        let opText = operands[0].text;
                        const isPrefixOp = ['NOT', '-'].includes(def.desc);

                        if (isPrefixOp) {
                            const opPrec = (def.desc === '-') ? PRECEDENCE.UNARY_MINUS : currentPrec;
                            if (operands[0].prec < opPrec || shouldWrapForClarity(opPrec, operands[0].prec)) {
                                opText = `(${opText})`;
                            }
                        }

                        if (def.desc === 'NOT') stack.push({ text: `NOT ${opText}`, prec: PRECEDENCE.NOT });
                        else if (def.desc === '-') stack.push({ text: `-${opText}`, prec: PRECEDENCE.UNARY_MINUS });
                        else if (def.desc === 'ABS') stack.push({ text: `ABS(${opText})`, prec: PRECEDENCE.FUNC });
                        else if (def.desc === 'INT') {
                            if (opText.startsWith('FLT(') && opText.endsWith(')')) {
                                opText = opText.slice(4, -1);
                            }
                            stack.push({ text: `INT(${opText})`, prec: PRECEDENCE.FUNC });
                        }
                        else if (def.desc === 'FLT') stack.push({ text: `FLT(${opText})`, prec: PRECEDENCE.FUNC });
                        else if (def.desc === 'LEN') stack.push({ text: `LEN(${opText})`, prec: PRECEDENCE.FUNC });
                        else if (def.desc === 'ASC') stack.push({ text: `ASC(${opText})`, prec: PRECEDENCE.FUNC });
                        else if (def.desc === 'VAL') stack.push({ text: `VAL(${opText})`, prec: PRECEDENCE.FUNC });
                        else stack.push({ text: `${def.desc}(${opText})`, prec: PRECEDENCE.FUNC });
                    } else if (pops === 2) { // Binary
                        const infixOps = ['+', '-', '*', '/', '**', '=', '<', '>', '<=', '>=', '<>', 'AND', 'OR'];
                        if (infixOps.includes(def.desc)) {
                            let left = operands[0].text;
                            let right = operands[1].text;

                            // Float Operator Optimization: Strip FLT() if redundant
                            if (op >= 0x3C && op <= 0x40) {
                                const isSafeFloat = (txt) => {
                                    if (/^M\d+$/.test(txt)) return true;
                                    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(txt)) return true;
                                    if (/\d+\.\d+/.test(txt)) return true;
                                    if (/^(SIN|COS|TAN|ATAN|SQR|LN|LOG|EXP|RND|ABS)\(/.test(txt)) return true;
                                    return false;
                                };

                                const isFltWrapper = (txt) => txt && txt.startsWith('FLT(') && txt.endsWith(')');

                                if (isSafeFloat(left) && isFltWrapper(right)) {
                                    right = right.slice(4, -1);
                                } else if (isSafeFloat(right) && isFltWrapper(left)) {
                                    left = left.slice(4, -1);
                                }
                            }

                            if (operands[0].prec < currentPrec || shouldWrapForClarity(currentPrec, operands[0].prec)) {
                                left = `(${left})`;
                            }
                            if (operands[1].prec < currentPrec || (operands[1].prec === currentPrec && ['-', '/', '**'].includes(def.desc)) || shouldWrapForClarity(currentPrec, operands[1].prec)) {
                                right = `(${right})`;
                            }

                            stack.push({ text: `${left} ${def.desc} ${right}`, prec: currentPrec });
                        } else {
                            const args = operands.map(o => o.text).join(',');
                            stack.push({ text: `${def.desc}(${args})`, prec: PRECEDENCE.FUNC });
                        }
                    } else {
                        const args = operands.map(o => o.text).join(',');
                        stack.push({ text: `${def.desc}(${args})`, prec: PRECEDENCE.FUNC });
                    }
                    return null;
                }
            }

            // EDIT
            if (def.desc === 'EDIT') {
                const varObj = stack.pop();
                let variable = varObj ? (varObj.text || '') : 'BAD_VAR';
                if (variable.startsWith('ADDR(') && variable.endsWith(')')) {
                    variable = variable.slice(5, -1);
                }
                return `EDIT ${variable}`;
            }

            // INPUT
            if (def.desc === 'INPUT') {
                const varObj = stack.pop();
                let variable = varObj ? (varObj.text || '') : 'BAD_VAR';
                if (variable.startsWith('ADDR(') && variable.endsWith(')')) {
                    variable = variable.slice(5, -1);
                }
                return `INPUT ${variable}`;
            }

            // Assignments (POKE-like or Assign)
            if ([0x7F, 0x80, 0x81].includes(op)) { // Assign Int/Float/String
                const valObj = stack.pop();
                let val = valObj ? (valObj.text || '0') : '0';

                let variable = '';
                const isLZ = (codeBlock && codeBlock[0x14] === 0x24);
                if (args && args.v !== undefined && isLZ) {
                    // Variable is an argument (offset) in LZ
                    const addr = args.v;
                    if (varMap[addr]) {
                        variable = varMap[addr].name;
                    } else {
                        variable = `L${Math.abs(addr)}`;
                    }
                } else {
                    // Fallback to popping ref from stack (CM/XP or if v=0)
                    let varObj = stack.pop();
                    variable = varObj ? (varObj.text || '') : 'BAD_VAR';
                }

                // Suppress FLT() wrapper for Float Assignment (0x80)
                // If we are assigning to a float, and the value is explicitly cast with FLT(),
                // we can hide it because OPL does implicit casting.
                if (op === 0x80 && typeof val === 'string' && val.startsWith('FLT(') && val.endsWith(')')) {
                    // Check if parens are balanced for the *entire* content to ensure it's a wrapper
                    let depth = 1;
                    let isWrapped = true;
                    // Start after 'FLT(' (index 4) and go until before last ')'
                    for (let i = 4; i < val.length - 1; i++) {
                        if (val[i] === '(') depth++;
                        else if (val[i] === ')') depth--;

                        if (depth === 0) {
                            isWrapped = false;
                            break;
                        }
                    }
                    if (isWrapped) {
                        val = val.slice(4, -1);
                    }
                }

                // Fix for 0 = MODTYPE$() issue
                // If variable is 0 (literal) and val is a function call, assume 0 was an arg
                // and the real variable is underneath.
                if (variable === 0 || variable === '0') {
                    // Check if val looks like a function call
                    if (typeof val === 'string' && /^[A-Z0-9_$]+\(.*\)$/.test(val)) {
                        // Pop the real variable
                        const realVarObj = stack.pop();
                        if (realVarObj) variable = realVarObj.text || '';
                    }
                }

                return `${variable} = ${val}`;
            }

            if (def.desc === 'CREATE' || def.desc === 'OPEN') {
                // ... (unchanged)
                // args: f+list S
                // S is popped (filename)
                // f+list is in args (logicalFile, fields)
                const filenameObj = stack.pop();
                const filename = filenameObj.text || '""';
                const logicalFile = String.fromCharCode(65 + args.logicalFile); // 0->A, 1->B...
                const fields = args.fields ? args.fields.map(f => {
                    const suffix = (f.type === 0 ? '%' : f.type === 2 ? '$' : '');
                    return f.name.endsWith(suffix) ? f.name : f.name + suffix;
                }) : [];
                const fieldStr = fields.join(',');
                let res = `${def.desc} ${filename},${logicalFile},${fieldStr}`;
                if (codeBlock) {
                    // Check for empty fields or debug
                    if (!fieldStr) {
                        const hex = Array.from(codeBlock.slice(pc, pc + size)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
                        res += ` REM Missing Fields? Hex: ${hex}`;
                    }
                }
                return res;
            }

            if (def.desc === 'RETURN') {
                if (def.pops === '?') {
                    const valObj = stack.pop();
                    const val = valObj ? (valObj.text || '') : '';
                    return `RETURN ${val}`;
                }
            }

            // Generic Command/Function fallback
            if (def.desc) {
                let operands = [];
                if (def.pops === 'Flist') {
                    // Variable number of float arguments
                    // The count is the first thing popped (pushed last)
                    const countObj = stack.pop();
                    const count = countObj ? (countObj.text || 0) : 0;
                    for (let i = 0; i < count; i++) {
                        const opObj = stack.pop();
                        operands.unshift(opObj ? (opObj.text || '') : '');
                    }
                } else if (def.pops) {
                    const pops = def.pops.split(' ').length;
                    for (let i = 0; i < pops; i++) {
                        const opObj = stack.pop();
                        operands.unshift(opObj ? (opObj.text || '') : '');
                    }
                }

                if (def.pushes) {
                    // Function style
                    if (operands.length === 0) {
                        stack.push({ text: `${def.desc}`, prec: PRECEDENCE.FUNC });
                    } else {
                        stack.push({ text: `${def.desc}(${operands.join(',')})`, prec: PRECEDENCE.FUNC });
                    }
                    return null;
                } else {
                    // Command style
                    let res = `${def.desc} ${operands.join(',')}`;
                    // trap already captured at top of function

                    // Whitelist for TRAP support (User Requested)
                    const allowedTrap = ['APPEND', 'BACK', 'CLOSE', 'COPY', 'CREATE', 'DELETE', 'ERASE', 'EDIT', 'FIRST', 'INPUT', 'LAST', 'NEXT', 'OPEN', 'POSITION', 'RENAME', 'UPDATE', 'USE'];

                    // Check if current opcode is one of them?
                    // def.desc might have suffixes or args? No, generic commands are cleaner.
                    if (trap && allowedTrap.includes(def.desc)) {
                        res = "TRAP " + res;
                    }
                    return res;
                }
            }
        }


        getSystemConstants() {
            if (typeof SYSTEM_CONSTANTS !== 'undefined') return SYSTEM_CONSTANTS;
            if (typeof window !== 'undefined' && window.SYSTEM_CONSTANTS) return window.SYSTEM_CONSTANTS;
            if (typeof global !== 'undefined' && global.SYSTEM_CONSTANTS) return global.SYSTEM_CONSTANTS;
            return null;
        }

        decodeFloat(buf) {
            if (buf.length < 2) return "0.0";

            const header = buf[0];
            const isNegative = (header & 0x80) !== 0;
            const len = header & 0x7F;

            if (buf.length < 1 + len) return "0.0";

            const exponentByte = buf[len];
            let exponent = exponentByte;
            if (exponent > 127) exponent -= 256;

            const mantissaBytes = buf.slice(1, len);
            const reversedMantissa = Array.from(mantissaBytes).reverse();

            let mantissaStr = "";
            for (const b of reversedMantissa) {
                mantissaStr += (b >> 4).toString(16);
                mantissaStr += (b & 0x0F).toString(16);
            }

            if (mantissaStr.length === 0) return "0.0";

            let res = mantissaStr;
            const dotPos = 1 + exponent;

            if (dotPos <= 0) {
                res = "0." + "0".repeat(-dotPos) + res;
            } else if (dotPos >= res.length) {
                res = res + "0".repeat(dotPos - res.length) + ".0";
            } else {
                res = res.slice(0, dotPos) + "." + res.slice(dotPos);
            }

            if (res.includes('.')) {
                while (res.endsWith('0') && !res.endsWith('.0')) {
                    res = res.slice(0, -1);
                }
            }
            return (isNegative ? "-" : "") + res;
        }
    }

    if (typeof window !== 'undefined') {
        window.InstructionHandler = InstructionHandler;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { InstructionHandler };
    }
})();
