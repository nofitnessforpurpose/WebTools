/**
 * instruction_handler.js
 * 
 * Instruction Handler
 * Handles parsing and processing of individual QCode instructions.
 */

class InstructionHandler {
    constructor(opcodes, floatSize) {
        this.opcodes = opcodes;
        this.floatSize = floatSize;
    }

    getInstructionSize(codeBlock, pc, def) {
        let size = 1; // Opcode
        if (def.args) {
            const args = def.args.split(' ');
            for (const arg of args) {
                if (!arg || arg === '-') continue;
                else if (arg === 'v') {
                    const val = codeBlock[pc + size];
                    if (val >= 0xFD || val === 0xED) size += 2;
                    else size += 1;
                }
                else if (arg === 'B') size += 1;
                else if (arg === 'b') size += 1;
                else if (arg === 'W') size += 2;
                else if (arg === 'I') size += 2;
                else if (arg === 'F') {
                    // Variable length float (Compact Form)
                    // First byte: Sign (bit 7) + Length (bits 0-6)
                    const firstByte = codeBlock[pc + size];
                    const len = firstByte & 0x7F;
                    size += 1 + len;
                }
                else if (arg === 'S') size += 1 + codeBlock[pc + size]; // Len + String
                else if (arg === 'V') size += 2;
                else if (arg === 'O') size += 1; // Byte
                else if (arg === 'D') size += 2; // Offset
                else if (arg === 'm') size += 2; // Word (Calculator Memory Offset)
                else if (arg === 's') size += 1; // Byte
                else if (arg === 'i') size += 1; // Byte
                else if (arg === 'f') size += 1; // Byte
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
        let offset = pc + 1;
        if (def.args) {
            const args = def.args.split(' ');
            for (const arg of args) {
                if (!arg || arg === '-') continue;
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
                    const b1 = codeBlock[offset++];
                    let val;
                    if (b1 >= 0xFD) {
                        const b2 = codeBlock[offset++];
                        val = (b1 << 8) | b2;
                    } else if (b1 === 0xED) {
                        const b2 = codeBlock[offset++];
                        val = (b1 << 8) | b2;
                    } else {
                        // Sign extend 1-byte value
                        val = (b1 & 0x80) ? b1 - 256 : b1;
                    }

                    let key = arg;
                    if (res[key] !== undefined) {
                        let i = 1;
                        while (res[key + '_' + i] !== undefined) i++;
                        key = key + '_' + i;
                    }
                    res[key] = val;
                } else if (arg === 'B' || arg === 'O' || arg === 'b' || arg === 's' || arg === 'i' || arg === 'f') {
                    res[arg] = codeBlock[offset++];
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
        // Check if val is a simple integer literal string
        if (typeof val === 'string' && /^\d+$/.test(val)) {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
                // Format as Hex
                const hex = '$' + num.toString(16).toUpperCase(); // e.g. $180

                // Track usage if it's a known system constant
                if (usedSystemVars && typeof SYSTEM_CONSTANTS !== 'undefined' && SYSTEM_CONSTANTS[num]) {
                    usedSystemVars.add(num);
                }
                return hex;
            }
        }
        return val;
    }

    handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap, usedSystemVars) {
        // Push Variables
        if (def.args.includes('v') || def.args.includes('V')) {
            // ... (unchanged)
            // Check if it's an Assign op, which uses 'v' but doesn't push
            if ([0x7F, 0x80, 0x81].includes(op)) {
                // Handled in Assignments block
            } else {
                const addr = args.v !== undefined ? args.v : args.V;
                let signedAddr = addr;
                if ((def.args.includes('V') || def.args.includes('v')) && signedAddr > 32767) signedAddr -= 65536;

                let varName = varMap[signedAddr] ? varMap[signedAddr].name : (def.args.includes('V') ? `L${Math.abs(signedAddr).toString(16).toUpperCase()} ` : `L${Math.abs(signedAddr).toString(16).toUpperCase()} `);

                // Array access
                if ([0x03, 0x04, 0x05, 0x0A, 0x0B, 0x0C, 0x10, 0x11, 0x12, 0x17, 0x18, 0x19].includes(op)) {
                    const indexObj = stack.pop();
                    const index = indexObj.text || '0';
                    varName += `(${index})`;
                }

                // Push Reference
                if ([0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19].includes(op)) {
                    // Address of variable? Usually handled implicitly in OPL source
                    // But if it's a push ref, maybe it's for a BYREF arg?
                    // We'll just push the name.
                }

                stack.push({ text: varName.trim(), prec: PRECEDENCE.ATOM });
                return null;
            }
        }

        // Push Literals
        if (op === 0x20) { stack.push({ text: args.B.toString(), prec: PRECEDENCE.ATOM }); return null; }
        if (op === 0x21 || op === 0x22) { stack.push({ text: args.I.toString(), prec: PRECEDENCE.ATOM }); return null; }
        if (op === 0x23) { stack.push({ text: args.F.toString(), prec: PRECEDENCE.ATOM }); return null; }
        if (op === 0x24) { stack.push({ text: `"${args.S}"`, prec: PRECEDENCE.ATOM }); return null; }

        // Calculator Memory (0x06)
        if (op === 0x06) {
            stack.push({ text: `M${args.W / 8}`, prec: PRECEDENCE.ATOM });
            return null;
        }

        // Calculator Memory Reference (0x13)
        if (op === 0x13) {
            stack.push({ text: `M${args.W / 8}`, prec: PRECEDENCE.ATOM });
            return null;
        }

        // Field Access (0x1A - 0x1F)
        if (op >= 0x1A && op <= 0x1F) {
            const logical = String.fromCharCode(65 + args.B);
            let fieldObj = stack.pop();
            let field = fieldObj.text || '';
            if (typeof field === 'string') field = field.trim();
            // Field name is usually a string literal, strip quotes if present
            if (field && field.startsWith('"') && field.endsWith('"')) {
                field = field.slice(1, -1);
            } else if (field) {
                // Dynamic field name? Wrap in parens if needed, though OPL usually uses A.(A$)
                // If it's a variable, it might be just the name.
                // We'll assume if it's not a literal, it's an expression.
                field = `(${field})`;
            }
            stack.push({ text: `${logical}.${field}`, prec: PRECEDENCE.ATOM });
            return null;
        }

        // Operators
        if (def.pops && def.pushes) {
            // Intercept PEEKB/PEEKW/USR/USR$ here before generic handling?
            // PEEKB (0x9B), PEEKW (0x9C), USR (0x9F), USR$ (0xC8)
            if ([0x9B, 0x9C, 0x9F, 0xC8].includes(op)) {
                if (op === 0x9B || op === 0x9C) { // PEEKB/PEEKW (Pop 1 arg: Addr)
                    const addrObj = stack.pop();
                    let addr = addrObj.text || '0';
                    addr = this.formatAddress(addr, usedSystemVars);
                    stack.push({ text: `${def.desc}(${addr})`, prec: PRECEDENCE.FUNC });
                    return null;
                }
                if (op === 0x9F || op === 0xC8) { // USR/USR$ (Pop 2 args: Addr, AX)
                    // USR(addr, ax) -> Pops AX, then Addr?
                    // "The arguments are pushed onto the stack... The address of the machine code routine is pushed last."
                    // Wait, standard calling convention: Args pushed left to right?
                    // USR(addr, ax)
                    // Push addr. Push ax.
                    // Opcode USR.
                    // Pops ax. Pops addr.
                    // So 1st pop is AX. 2nd pop is Addr.
                    const axObj = stack.pop();
                    const addrObj = stack.pop();
                    let ax = axObj.text || '0';
                    let addr = addrObj.text || '0';
                    addr = this.formatAddress(addr, usedSystemVars);
                    stack.push({ text: `${def.desc}(${addr},${ax})`, prec: PRECEDENCE.FUNC });
                    return null;
                }
            }

            const pops = def.pops.split(' ').length;
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
            // User wants comparisons inside AND/OR/NOT to be wrapped, e.g. IF ((A=1) AND (B=2))
            // Also wants bitwise/logical ops wrapped for clarity, e.g. ((NOT b%) AND a%)
            const shouldWrapForClarity = (opPrec, operandPrec) => {
                // Aggressive wrapping for Logical/Bitwise operators (AND, OR, NOT)
                // Wrap anything that isn't an Atom or Function call (prec 99).
                if (opPrec <= 3 && operandPrec < 99) return true;
                return false;
            };

            if (pops === 1) { // Unary
                let opText = operands[0].text;
                const isPrefixOp = ['NOT', '-'].includes(def.desc);

                // Only wrap if it's a prefix operator (NOT, -)
                // Functions (ABS, CHR$, etc.) have their own parens so we don't wrap the argument
                if (isPrefixOp) {
                    const opPrec = (def.desc === '-') ? PRECEDENCE.UNARY_MINUS : currentPrec;
                    if (operands[0].prec < opPrec || shouldWrapForClarity(opPrec, operands[0].prec)) {
                        opText = `(${opText})`;
                    }
                }

                if (def.desc === 'NOT') stack.push({ text: `NOT ${opText}`, prec: PRECEDENCE.NOT });
                else if (def.desc === '-') stack.push({ text: `- ${opText}`, prec: PRECEDENCE.UNARY_MINUS });
                else if (def.desc === 'ABS') stack.push({ text: `ABS(${opText})`, prec: PRECEDENCE.FUNC });
                else if (def.desc === 'INT') {
                    // Suppress FLT inside INT
                    if (opText.startsWith('FLT(') && opText.endsWith(')')) {
                        opText = opText.slice(4, -1);
                    }
                    stack.push({ text: `INT(${opText})`, prec: PRECEDENCE.FUNC });
                }
                else if (def.desc === 'FLT') stack.push({ text: `FLT(${opText})`, prec: PRECEDENCE.FUNC });
                else if (def.desc === 'LEN') stack.push({ text: `LEN(${opText})`, prec: PRECEDENCE.FUNC });
                else if (def.desc === 'ASC') stack.push({ text: `ASC(${opText})`, prec: PRECEDENCE.FUNC });
                else if (def.desc === 'VAL') stack.push({ text: `VAL(${opText})`, prec: PRECEDENCE.FUNC });
                // ... other unary functions
                else stack.push({ text: `${def.desc}(${opText})`, prec: PRECEDENCE.FUNC });
            } else if (pops === 2) { // Binary
                const infixOps = ['+', '-', '*', '/', '**', '=', '<', '>', '<=', '>=', '<>', 'AND', 'OR'];
                if (infixOps.includes(def.desc)) {
                    let left = operands[0].text;
                    let right = operands[1].text;

                    // Float Operator Optimization: Strip FLT() if redundant
                    // Float Ops: 0x3C (+), 0x3D (-), 0x3E (*), 0x3F (/), 0x40 (**)
                    if (op >= 0x3C && op <= 0x40) {
                        const isSafeFloat = (txt) => {
                            // M variables (M0-M9)
                            if (/^M\d+$/.test(txt)) return true;
                            // Variables without % or $ suffix (e.g. L1, p1, myVar)
                            // Exclude function calls (contain '(') unless known float func?
                            // Simple var: start with letter, alphanumeric, no %, no $, no (
                            if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(txt)) return true;
                            // Float literals (contain .)
                            if (/\d+\.\d+/.test(txt)) return true;
                            // Known Float functions (SIN, COS, etc)
                            if (/^(SIN|COS|TAN|ATAN|SQR|LN|LOG|EXP|RND|ABS)\(/.test(txt)) return true;
                            return false;
                        };

                        const isFltWrapper = (txt) => txt.startsWith('FLT(') && txt.endsWith(')');

                        if (isSafeFloat(left) && isFltWrapper(right)) {
                            right = right.slice(4, -1);
                        } else if (isSafeFloat(right) && isFltWrapper(left)) {
                            left = left.slice(4, -1);
                        }
                    }

                    // Wrap left if lower precedence OR clarity needed
                    if (operands[0].prec < currentPrec || shouldWrapForClarity(currentPrec, operands[0].prec)) {
                        left = `(${left})`;
                    }
                    // Wrap right if lower precedence OR same precedence and right-associative (like **) or non-associative
                    // For standard left-associative ops (+, -, *, /), if right has same precedence, we usually wrap to be safe/clear
                    // e.g. a - (b - c) vs a - b - c
                    if (operands[1].prec < currentPrec || (operands[1].prec === currentPrec && ['-', '/', '**'].includes(def.desc)) || shouldWrapForClarity(currentPrec, operands[1].prec)) {
                        right = `(${right})`;
                    }

                    stack.push({ text: `${left} ${def.desc} ${right}`, prec: currentPrec });
                } else {
                    // Function style (LOC, LEFT$, RIGHT$, etc.)
                    const args = operands.map(o => o.text).join(',');
                    stack.push({ text: `${def.desc}(${args})`, prec: PRECEDENCE.FUNC });
                }
            } else {
                // n-ary functions (MID$, etc.)
                const args = operands.map(o => o.text).join(',');
                stack.push({ text: `${def.desc}(${args})`, prec: PRECEDENCE.FUNC });
            }
            return null;
        }

        // Assignments (POKE-like or Assign)
        if ([0x7F, 0x80, 0x81].includes(op)) { // Assign Int/Float/String
            const valObj = stack.pop();
            let val = valObj.text || '0';

            let variable = '';
            if (args && args.v !== undefined) {
                // Variable is an argument (offset)
                const addr = args.v;
                if (varMap[addr]) {
                    variable = varMap[addr].name;
                } else {
                    // Fallback if not found (shouldn't happen if scanVariables works)
                    variable = `L${Math.abs(addr)}`;
                }
            } else {
                // Fallback to popping (shouldn't happen with new constants)
                let varObj = stack.pop();
                variable = varObj.text || '';
            }

            // Suppress FLT() wrapper for Float Assignment (0x80)
            if (op === 0x80 && typeof val === 'string' && val.startsWith('FLT(') && val.endsWith(')')) {
                val = val.slice(4, -1);
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
                const val = valObj.text || '';
                return `RETURN ${val}`;
            }
            // ... other RETURNs handled by generic fallback or specific cases if needed
        }
        if (def.desc === 'PRINT') {
            if (!def.pops) return 'PRINT';
            const valObj = stack.pop();
            const val = valObj.text || '';
            return `PRINT ${val}`;
        }
        if (def.desc === 'LPRINT') {
            if (!def.pops) return 'LPRINT';
            const valObj = stack.pop();
            const val = valObj.text || '';
            return `LPRINT ${val}`;
        }
        if (def.desc === 'DROP') {
            const valObj = stack.pop();
            const val = valObj.text || '';
            // If val is a procedure call (simple identifier), append colon
            // But NOT for USR
            if (typeof val === 'string' && /^[A-Z0-9_$]+$/.test(val)) {
                return val + ":";
            }
            // For USR(...) which might look like a function call
            if (typeof val === 'string' && val.startsWith('USR(')) {
                return val; // No colon for USR
            }
            // Generic function call used as statement
            if (typeof val === 'string' && /^[A-Z0-9_$]+\(.*\)$/.test(val)) {
                return val; // Usually no colon needed if it looks like func(...)
            }
            return val;
        }
        if (def.desc === 'AT') {
            const yObj = stack.pop();
            const xObj = stack.pop();
            const y = yObj.text || '1';
            const x = xObj.text || '1';
            return `AT ${x},${y}`;
        }
        if (def.desc === 'BEEP') {
            const yObj = stack.pop();
            const xObj = stack.pop();
            const y = yObj.text || '100';
            const x = xObj.text || '100';
            return `BEEP ${x},${y}`;
        }
        if (def.desc === 'PAUSE') {
            const xObj = stack.pop();
            const x = xObj.text || '10';
            return `PAUSE ${x}`;
        }
        if (def.desc === 'POKEB') {
            let valObj = stack.pop();
            let addrObj = stack.pop();
            let val = valObj.text || '0';
            let addr = addrObj.text || '0';
            if (typeof val === 'number') val = '$' + val.toString(16).toUpperCase();
            // Use formatAddress for addr
            addr = this.formatAddress(addr, usedSystemVars);
            return `POKEB ${addr},${val}`;
        }
        if (def.desc === 'POKEW') {
            let valObj = stack.pop();
            let addrObj = stack.pop();
            let val = valObj.text || '0';
            let addr = addrObj.text || '0';
            if (typeof val === 'number') val = '$' + val.toString(16).toUpperCase();
            // Use formatAddress for addr
            addr = this.formatAddress(addr, usedSystemVars);
            return `POKEW ${addr},${val}`;
        }
        if (def.desc === 'RANDOMIZE') {
            const seedObj = stack.pop();
            const seed = seedObj.text || '0';
            return `RANDOMIZE ${seed}`;
        }
        if (def.desc === 'CHECK') {
            return null; // Ignore check byte
        }
        if (def.desc === 'CURSOR') {
            return `CURSOR ${args.O}`; // O is byte
        }
        if (def.desc === 'ESCAPE') {
            return args.O === 0 ? 'ESCAPE OFF' : 'ESCAPE ON';
        }
        if (def.desc === 'GOTO') {
            const target = (pc + 1) + args.D;
            const labelName = (labelMap && labelMap[target]) ? labelMap[target] : `Lab${target}`;
            return `GOTO ${labelName}::`;
        }
        if (def.desc === 'ONERR') {
            if (args.D === 0) {
                return `ONERR OFF`;
            }
            const target = (pc + 1) + args.D;
            const labelName = (labelMap && labelMap[target]) ? labelMap[target] : `Lab${target}`;
            return `ONERR ${labelName}::`;
        }

        if (def.desc === 'PROC') {
            const { name } = args.params;

            // Pop argument count (pushed before PROC)
            const argCountObj = stack.pop();
            const argCount = argCountObj.text || 0;

            // Pop Type Signature (pushed before Arg Count, e.g. 0) - Discard it
            // Only present if there are arguments?
            // Trace: 
            // 0 args: Push 0 (Count). PROC. -> Stack has 0.
            // 1 arg: Push Arg, Push 0 (Type), Push 1 (Count). PROC. -> Stack has Arg, 0, 1.
            // So if argCount > 0, we pop the Type Signature.
            if (argCount > 0) {
                stack.pop();
            }

            // Pop arguments
            const procArgs = [];
            if (argCount > 0) {
                for (let i = 0; i < argCount; i++) {
                    const argObj = stack.pop();
                    procArgs.unshift(argObj.text || '');
                }
            }

            let call = `${name}:`;
            if (procArgs.length > 0) {
                call += `(${procArgs.join(', ')})`;
            }

            // Always push the call to the stack.
            // If it's a statement, DROP will pop it and output it.
            // If it's a function call (e.g. in RETURN), it will be used there.
            stack.push({ text: call, prec: PRECEDENCE.FUNC });
            return null;
        }

        if (def.desc === 'USE') {
            const logical = String.fromCharCode(65 + args.B);
            return `USE ${logical}`;
        }

        if (op === 0xFB) {
            // LZ Specific ELSEIF
            // args.D is the offset to jump to if condition is false (next ELSEIF or ELSE/ENDIF)
            // It behaves like BranchIfFalse but semantically it's ELSEIF
            const target = (pc + 1) + args.D;
            const labelName = (labelMap && labelMap[target]) ? labelMap[target] : `label_${target}`;
            // The condition is on the stack (popped by BranchIfFalse logic usually, but here handled explicitly?)
            // Standard IF uses BranchIfFalse.
            // ELSEIF likely pops a value too.
            // Let's assume it pops 1 value (Integer/Boolean).
            const condObj = stack.pop();
            const cond = condObj ? (condObj.text || '0') : '0';
            return `ELSEIF ${cond} : REM LZ`;
        }

        if (def.desc === 'EXT') {
            const subcode = args.b;
            const hex = subcode.toString(16).toUpperCase().padStart(2, '0');

            // Known LZ Extended Opcodes (Speculative mapping based on context)
            // E6: Start of statement / Line marker?
            // EA: PAUSE (Variable duration?)
            // EE: PAUSE?
            // F0: PAUSE?
            // E8: PAUSE?

            // For now, just output a clearer REM
            return `REM LZ_EXT ${hex}`;
        }

        if (op === 0xFE) {
            // Extended Opcode Prefix
            // The next byte is the actual opcode?
            // But getInstructionSize/getArgs would have needed to know this.
            // If FE is just a prefix, then the "Opcode" passed to handleInstruction is FE.
            // We need to look ahead or store state?
            // Actually, if FE is defined as args='', then it consumes nothing.
            // But the next instruction will be processed separately.
            // However, the user hex shows FE FB.
            // If FE is processed as "EXT", it does nothing.
            // Then FB is processed next.
            // If FB is defined, it works.
            return null; // Just ignore the prefix?
        }

        // Handle F8 (Print Separator / Semicolon)
        // It's not in QCODE_DEFS yet, let's assume it's a no-op that affects PRINT state?
        // Or maybe it pushes a special marker?
        // If it appears in a sequence of PRINT args, it might be a separator.
        // But PRINT usually takes a count or consumes stack.
        // If F8 is an instruction, it runs between PRINTs?
        // No, PRINT is a single instruction usually.
        // Unless it's the "Print Item" style where multiple instructions print things.
        // Opcodes 0x6F-0x73 are PRINT variants.
        // 0x72 is PRINT , (comma). 0x73 is PRINT (newline).
        // Maybe F8 is PRINT ; (semicolon)?
        // If so, it should just output ";".
        // But where does it output it?
        // If it's a statement, "PRINT ;" is valid?
        // Or maybe it's used inside a PRINT list?
        // If the decompiler sees F8, it returns ";".
        // But the previous instruction might have been a PRINT.
        // If we return ";", it becomes a statement.
        // We might need to merge it with the previous PRINT.
        // For now, let's return "PRINT ;" or just ";" if possible.
        if (op === 0xF8) {
            return "PRINT ;";
        }

        if (op === 0x89) {
            return `REM Inline Assembly (${size} bytes)`;
        }
        if (op === 0xCA) {
            return `REM Debug Procedure Name: ${args.S}`;
        }
        if (op === 0xCB) {
            // args.I is Line, args.I_1 is Column
            return `REM Debug Line: ${args.I}, Col: ${args.I_1}`;
        }

        // Generic Command/Function fallback
        if (def.desc) {
            let operands = [];
            if (def.pops === 'Flist') {
                // Variable number of float arguments
                // The count is the first thing popped (pushed last)
                const countObj = stack.pop();
                const count = countObj.text || 0;
                // But wait, in OPL, the count is pushed last?
                // "The number of arguments is pushed onto the stack as an integer."
                // So yes, pop count first.
                // Then pop 'count' number of floats.
                for (let i = 0; i < count; i++) {
                    const opObj = stack.pop();
                    operands.unshift(opObj.text || '');
                }
            } else if (def.pops) {
                const pops = def.pops.split(' ').length;
                for (let i = 0; i < pops; i++) {
                    const opObj = stack.pop();
                    operands.unshift(opObj.text || '');
                }
            }

            if (def.pushes) {
                // Function style
                if (operands.length === 0) {
                    stack.push({ text: `${def.desc}`, prec: PRECEDENCE.FUNC }); // No brackets for zero-arg functions
                } else {
                    stack.push({ text: `${def.desc}(${operands.join(',')})`, prec: PRECEDENCE.FUNC });
                }
                return null;
            } else {
                // Command style
                return `${def.desc} ${operands.join(',')}`;
            }
        }

        return `REM Unhandled Opcode ${op.toString(16)} `;
    }

    decodeFloat(buf) {
        if (buf.length < 2) return "0.0";

        const header = buf[0];
        const isNegative = (header & 0x80) !== 0;
        const len = header & 0x7F;

        if (buf.length < 1 + len) return "0.0"; // Should not happen if parsed correctly

        // Exponent is the last byte of the chunk
        const exponentByte = buf[len]; // buf is [Header, Data...] so index 'len' is the last byte?
        // No, length is "number of bytes following".
        // So chunk is Header + Data.
        // Data size is 'len'.
        // Data is buf[1] to buf[len].
        // Exponent is the last byte of Data -> buf[len].

        let exponent = exponentByte;
        if (exponent > 127) exponent -= 256; // Signed byte

        // Mantissa bytes are buf[1] ... buf[len-1]
        const mantissaBytes = buf.slice(1, len);

        // Reverse Mantissa Bytes
        // 67 45 23 -> 23 45 67
        const reversedMantissa = Array.from(mantissaBytes).reverse();

        let mantissaStr = "";
        for (const b of reversedMantissa) {
            mantissaStr += (b >> 4).toString(16);
            mantissaStr += (b & 0x0F).toString(16);
        }

        if (mantissaStr.length === 0) return "0.0";

        // Implicit decimal point after first digit
        // 234567 -> 2.34567
        // 1530 -> 1.530

        // Apply Exponent
        // Value = Mantissa * 10^Exponent
        // If Exponent is 0, value is X.XXXX
        // If Exponent is -2, value is 0.0X...

        // We can construct the string by moving the dot
        // Initial dot position is after index 0 (1st digit)
        // New dot position = 1 + Exponent

        let res = mantissaStr;
        const dotPos = 1 + exponent;

        if (dotPos <= 0) {
            res = "0." + "0".repeat(-dotPos) + res;
        } else if (dotPos >= res.length) {
            res = res + "0".repeat(dotPos - res.length) + ".0";
        } else {
            res = res.slice(0, dotPos) + "." + res.slice(dotPos);
        }

        // Trim trailing zeros if it has a decimal point
        if (res.includes('.')) {
            while (res.endsWith('0') && !res.endsWith('.0')) {
                res = res.slice(0, -1);
            }
            if (res.endsWith('.')) res += '0'; // Should not happen due to .0 check
        }

        return (isNegative ? "-" : "") + res;
    }
}

if (typeof window !== 'undefined') {
    window.InstructionHandler = InstructionHandler;
}
