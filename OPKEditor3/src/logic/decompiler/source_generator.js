/**
 * source_generator.js
 * 
 * Source Generator
 * Generates OPL source code from the decompiled instructions and control flow.
 */

(function () {
    let DecompilerStack;
    if (typeof window !== 'undefined' && window.DecompilerStack) {
        DecompilerStack = window.DecompilerStack;
    } else if (typeof require !== 'undefined') {
        try {
            const stackDeps = require('./stack.js');
            DecompilerStack = stackDeps.DecompilerStack;
        } catch (e) { }
    }

    class SourceGenerator {
        constructor(instructionHandler) {
            this.instHandler = instructionHandler;
        }

        indent(level) {
            return "  ".repeat(Math.max(0, level));
        }

        getTypeSuffix(type) {
            return this.instHandler.getTypeSuffix(type);
        }

        generateSource(header, varMap, flow, codeBlock, procName, options = {}) {
            const { globals, externals, isLZ, actualQCodeStart, qcodeStart, qcodeSize, numParams, paramTypes } = header;

            const params = [];
            for (let i = 0; i < numParams; i++) {
                const t = paramTypes[i];
                const suffix = t === 0 ? "%" : t === 1 ? "" : t === 2 ? "$" : "";
                params.push(`P${i + 1}${suffix}`);
            }

            let source = "";

            source += `${procName}:`;
            if (params.length > 0) source += `(${params.join(', ')})`;
            source += "\n";

            const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            source += `  REM Decompiled Source - OPK - Editor ${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '3.0.3'} \n`;
            source += `  REM ${date} \n`;

            if (isLZ) source += "  REM LZ Variant QCode (Decompilation Incomplete)\n";
            else source += "  REM CM,XP,LA & LZ code\n";

            if (externals.length > 0) {
                let currentLine = "  REM EXTERNAL ";
                const maxLineLen = 220;

                for (let i = 0; i < externals.length; i++) {
                    const e = externals[i];
                    const suffix = this.getTypeSuffix(e.type);
                    let s = (e.name.endsWith(suffix) ? e.name : e.name + suffix);

                    const sep = (currentLine.trim() === "REM EXTERNAL") ? "" : ",";

                    if (currentLine.length + sep.length + s.length > maxLineLen) {
                        source += currentLine + "\n";
                        currentLine = "  REM EXTERNAL " + s;
                    } else {
                        currentLine += sep + s;
                    }
                }
                if (currentLine.trim() !== "REM EXTERNAL") {
                    source += currentLine + "\n";
                }
            }

            if (globals.length > 0) {
                let currentLine = "  GLOBAL ";
                const maxLineLen = 220;

                for (let i = 0; i < globals.length; i++) {
                    const g = globals[i];
                    if (!g.name) continue; // Skip empty names to prevent formatting errors
                    const suffix = this.getTypeSuffix(g.type);
                    let s = (g.name.endsWith(suffix) ? g.name : g.name + suffix);
                    if (g.arrayLen && g.maxLen && suffix === '$') s += `(${g.arrayLen},${g.maxLen})`;
                    else if (g.maxLen) s += `(${g.maxLen})`;
                    else if (g.arrayLen) s += `(${g.arrayLen})`;

                    // Determine separator (none for first item on line)
                    const sep = (currentLine.trim() === "GLOBAL") ? "" : ",";

                    if (currentLine.length + sep.length + s.length > maxLineLen) {
                        source += currentLine + "\n";
                        currentLine = "  GLOBAL " + s;
                    } else {
                        currentLine += sep + s;
                    }
                }
                if (currentLine.trim() !== "GLOBAL") {
                    source += currentLine + "\n";
                }
            }

            const locals = Object.values(varMap).filter(v => v.isLocal).sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            if (locals.length > 0) {
                source += "  LOCAL " + locals.map(l => {
                    let s = l.name;
                    if ((l.type === 2 || l.maxLen) && !s.endsWith('$')) s += '$';

                    // Validate dimensions to prevent (-1) or junk
                    const isValid = (d) => (d > 0 && d < 32768);
                    const aLen = (l.arrayLen && isValid(l.arrayLen)) ? l.arrayLen : null;
                    const mLen = (l.maxLen && isValid(l.maxLen)) ? l.maxLen : null;

                    if (aLen && mLen && l.type === 2) s += `(${aLen},${mLen})`;
                    else if (mLen) s += `(${mLen})`;
                    else if (aLen) s += `(${aLen})`;
                    else if (l.isArray) s += `(10)`;
                    return s;
                }).join(",") + "\n";
            }

            source += "\n";

            let indentLevel = 1;
            let pendingElse = null;
            let pendingPrint = null;

            // Pre-calculate label names
            const usedLabels = new Set();
            for (const target of flow.labels) {
                if (!flow.structureLabels.has(target)) usedLabels.add(target);
            }
            if (flow.forceLabels) {
                for (const target of flow.forceLabels) usedLabels.add(target);
            }

            const sortedLabels = Array.from(usedLabels).sort((a, b) => a - b);
            const labelMap = {};
            sortedLabels.forEach((target, index) => {
                labelMap[target] = `Lab${index + 1}`;
            });

            const usedSystemVars = (options.annotateSystemVars !== false) ? new Set() : null;

            let pc = (header.qcodeInstructionStart !== undefined) ? header.qcodeInstructionStart : ((actualQCodeStart !== undefined) ? actualQCodeStart : qcodeStart);
            const stack = new DecompilerStack();
            const loopStack = [];

            const endPC = (header.qcodeInstructionStart !== undefined ? header.qcodeInstructionStart : qcodeStart) + qcodeSize;

            // Log LZ "Stop Sign" Signature if present and skipped
            if (isLZ && pc >= 2 && codeBlock[pc - 2] === 0x59 && codeBlock[pc - 1] === 0xB2) {
                if (options.logCallback) {
                    // Calculate relative PC for previous 2 bytes
                    const relPC = (pc - 2) - (options.oplBase || 0);
                    options.logCallback({
                        pc: relPC.toString(16).toUpperCase().padStart(4, '0'),
                        bytes: "59B2",
                        opName: "LZ Procedure Header (STOP + SIN)",
                        comment: "Skipped (LZ Marker)"
                    });
                }
            }

            while (pc < endPC) {
                let op = codeBlock[pc];

                if (op === undefined) break; // Robustness
                // Handle Flow Structures (DO, WHILE, IF)
                if (flow.starts[pc]) {
                    for (const struct of flow.starts[pc]) {
                        if (struct.type === 'DO') {
                            source += this.indent(indentLevel) + "DO\n";
                            indentLevel++;
                            loopStack.push({ type: 'DO', top: pc, cond: struct.cond, end: struct.end });
                        } else if (struct.type === 'WHILE') {
                            loopStack.push({ type: 'WHILE', top: pc, end: struct.end });
                        }
                    }
                }
                if (flow.targets[pc]) {
                    if (pendingPrint !== null) {
                        source += this.indent(indentLevel) + pendingPrint + ";\n";
                        pendingPrint = null;
                    }
                    const structs = flow.targets[pc].sort((a, b) => b.start - a.start);
                    for (const struct of structs) {
                        if (struct.type === 'DO') {
                            // Struct for DO target (UNTIL) handled at instruction level
                        } else if (struct.type === 'UNTIL') {
                            indentLevel--;
                            loopStack.pop();
                        } else if (struct.type === 'ENDWH') {
                            indentLevel--;
                            source += this.indent(indentLevel) + "ENDWH\n";
                            loopStack.pop();
                        } else if (struct.type === 'ENDIF') {
                            const startStructs = flow.starts[struct.start];
                            const originIF = startStructs && startStructs.find(s => s.type === 'IF');
                            if (originIF && originIF.isElseIf) {
                                // Suppress ENDIF for IFs that were promoted to ELSEIF
                            } else {
                                indentLevel--;
                                source += this.indent(indentLevel) + "ENDIF\n";
                            }
                        } else if (struct.type === 'ELSE') {
                            indentLevel--;
                            const outerIF = flow.starts[struct.start] && flow.starts[struct.start].find(s => s.type === 'IF');
                            if (outerIF) {
                                pendingElse = { outerEnd: outerIF.end, indent: indentLevel };
                            } else {
                                source += this.indent(indentLevel) + "ELSE\n";
                                indentLevel++;
                            }
                        }
                    }
                }

                // Handle Labels
                if ((flow.labels.has(pc) && !flow.structureLabels.has(pc)) || (flow.forceLabels && flow.forceLabels.has(pc))) {
                    if (pendingPrint !== null) {
                        source += this.indent(indentLevel) + pendingPrint + ";\n";
                        pendingPrint = null;
                    }

                    if (pendingElse) {
                        source += this.indent(pendingElse.indent) + "ELSE\n";
                        indentLevel++;
                        pendingElse = null;
                    }
                    const labelName = labelMap[pc] || `Lab${pc}`;
                    source += `${labelName}:: \n`;
                }

                const def = this.instHandler.getInstructionDef(codeBlock, pc);

                if (!def) {
                    if (pendingElse) {
                        source += this.indent(pendingElse.indent) + "ELSE\n";
                        indentLevel++;
                        pendingElse = null;
                    }
                    if (pc < codeBlock.length) {
                        const hex = codeBlock[pc].toString(16).toUpperCase().padStart(2, '0');
                        source += `  REM Unknown QCode ${hex} \n`;
                    } else {
                        source += `  REM Unknown QCode (EOF) \n`;
                    }
                    pc++;
                    continue;
                }

                const size = this.instHandler.getInstructionSize(codeBlock, pc, def);
                const args = this.instHandler.getArgs(codeBlock, pc, def);
                let expr = null;

                try {
                    if (op === 0x7E) { // BranchIfFalse
                        if (pendingPrint !== null) {
                            source += this.indent(indentLevel) + pendingPrint + ";\n";
                            pendingPrint = null;
                        }
                        const struct = flow.jumps[pc];
                        if (struct) {
                            if (struct.type === 'WHILE') {
                                if (pendingElse) {
                                    source += this.indent(pendingElse.indent) + "ELSE\n";
                                    indentLevel++;
                                    pendingElse = null;
                                }
                                const condObj = stack.pop();
                                const cond = condObj.text || '0';
                                expr = `WHILE (${cond})`;
                                source += this.indent(indentLevel) + expr + "\n";
                                indentLevel++;
                            } else if (struct.type === 'IF') {
                                const condObj = stack.pop();
                                const cond = condObj.text || '0';
                                // More lenient ELSEIF: If this IF's end points to same place as outer ELSE 
                                // or within a small instruction gap.
                                let innerIF = null;
                                if (flow.starts[pc]) {
                                    innerIF = flow.starts[pc].find(s => s.type === 'IF');
                                }

                                if (pendingElse && innerIF && (innerIF.end === pendingElse.outerEnd || (innerIF.end > pendingElse.outerEnd && innerIF.end <= pendingElse.outerEnd + 3))) {
                                    innerIF.isElseIf = true; // Mark this IF as merged
                                    expr = `ELSEIF (${cond})`;
                                    // Use the same indent level as the pendingElse (which is outer indent)
                                    source += this.indent(pendingElse.indent) + expr + "\n";
                                    // IMPORTANT: ELSEIF body is nested, so we MUST increment indentLevel
                                    // But since we are consuming the pendingElse's indent, we effectively start at outer indent.
                                    // We need to set indentLevel to be formatted correctly for the body.
                                    indentLevel = pendingElse.indent + 1;
                                    pendingElse = null;
                                } else {
                                    if (pendingElse) {
                                        source += this.indent(pendingElse.indent) + "ELSE\n";
                                        indentLevel++;
                                        pendingElse = null;
                                    }
                                    expr = `IF (${cond})`;
                                    source += this.indent(indentLevel) + expr + "\n";
                                    indentLevel++;
                                }
                            } else if (struct.type === 'DO') {
                                if (pendingElse) {
                                    source += this.indent(pendingElse.indent) + "ELSE\n";
                                    indentLevel++;
                                    pendingElse = null;
                                }
                                const condObj = stack.pop();
                                const cond = condObj.text || '0';
                                expr = `UNTIL (${cond})`;
                                source += this.indent(indentLevel) + expr + "\n";
                            }
                        } else {
                            const condObj = stack.pop();
                            const rel = args.D;
                            const target = (pc + 1) + rel;
                            const labelName = labelMap[target] || `Lab${target}`;
                            expr = `IF NOT (${condObj.text || '?'}) GOTO ${labelName}`;
                            source += this.indent(indentLevel) + expr + "\n";
                        }
                    } else if (op === 0x51) { // GOTO
                        if (pendingPrint !== null) {
                            source += this.indent(indentLevel) + pendingPrint + ";\n";
                            pendingPrint = null;
                        }
                        const struct = flow.jumps[pc];
                        if (struct && (struct.type === 'WHILE' || struct.type === 'ELSE' || struct.type === 'WHILE_TOP')) {
                            expr = null; // These are structural jumps handled elsewhere
                        } else {
                            // Check for BREAK/CONTINUE patterns
                            const target = (pc + 1) + args.D;
                            if (loopStack.length > 0) {
                                // Debug logging removed
                            }
                            let foundBreakContinue = false;
                            if (loopStack.length > 0) {
                                const currentLoop = loopStack[loopStack.length - 1];
                                const loopTop = (currentLoop.type === 'DO' && currentLoop.cond) ? currentLoop.cond : currentLoop.top;

                                if (target === loopTop) {
                                    source += this.indent(indentLevel) + "CONTINUE\n";
                                    foundBreakContinue = true;
                                } else if (target === currentLoop.end) {
                                    source += this.indent(indentLevel) + "BREAK\n";
                                    foundBreakContinue = true;
                                }
                            }

                            if (!foundBreakContinue) {
                                expr = this.instHandler.handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap, usedSystemVars);
                                if (expr) {
                                    source += this.indent(indentLevel) + expr + "\n";
                                    this.instHandler.resetTrap();
                                }
                            }
                        }
                    } else {
                        // Check for PRINT related opcodes
                        let isPrintVal = (op >= 0x6F && op <= 0x71);
                        let isLPrintVal = (op >= 0x74 && op <= 0x76);
                        let isPrintComma = (op === 0x72);
                        let isLPrintComma = (op === 0x77);
                        let isPrintNL = (op === 0x73);
                        let isLPrintNL = (op === 0x78);

                        if (isPrintVal || isLPrintVal) {
                            const keyword = (isLPrintVal) ? 'LPRINT' : 'PRINT';
                            if (pendingPrint !== null && !pendingPrint.startsWith(keyword)) {
                                source += this.indent(indentLevel) + pendingPrint + ";\n";
                                pendingPrint = null;
                            }
                            expr = this.instHandler.handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap, usedSystemVars);
                            if (expr && expr.startsWith(keyword)) {
                                let val = expr.substring(keyword.length).trim();
                                if (pendingPrint === null) pendingPrint = `${keyword} ${val}`;
                                else pendingPrint += (pendingPrint.trim().endsWith(',') ? `${val}` : `;${val}`);
                                this.instHandler.resetTrap();
                            }
                        } else if (isPrintComma || isLPrintComma) {
                            const keyword = (isLPrintComma) ? 'LPRINT' : 'PRINT';
                            expr = keyword + " ,";
                            if (pendingPrint !== null && !pendingPrint.startsWith(keyword)) {
                                source += this.indent(indentLevel) + pendingPrint + ";\n";
                                pendingPrint = `${keyword} `;
                            } else if (pendingPrint === null) {
                                pendingPrint = `${keyword} `;
                            }
                            pendingPrint += ",";
                        } else if (isPrintNL || isLPrintNL) {
                            const keyword = (isLPrintNL) ? 'LPRINT' : 'PRINT';
                            expr = keyword + " (newline)";
                            if (pendingPrint !== null && !pendingPrint.startsWith(keyword)) {
                                source += this.indent(indentLevel) + pendingPrint + ";\n";
                                pendingPrint = null;
                            }
                            if (pendingElse) {
                                source += this.indent(pendingElse.indent) + "ELSE\n";
                                indentLevel++;
                                pendingElse = null;
                            }
                            source += this.indent(indentLevel) + (pendingPrint === null ? `${keyword}\n` : `${pendingPrint}\n`);
                            pendingPrint = null;
                        } else {
                            expr = this.instHandler.handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap, usedSystemVars);
                            if (expr) {
                                if (pendingPrint !== null) {
                                    if (pendingElse) {
                                        source += this.indent(pendingElse.indent) + "ELSE\n";
                                        indentLevel++;
                                        pendingElse = null;
                                    }
                                    source += this.indent(indentLevel) + pendingPrint + ";\n";
                                    pendingPrint = null;
                                }
                                if (pendingElse) {
                                    source += this.indent(pendingElse.indent) + "ELSE\n";
                                    indentLevel++;
                                    pendingElse = null;
                                }
                                if (expr.trim() === 'TRAP') source += this.indent(indentLevel) + "TRAP ";
                                else source += this.indent(indentLevel) + expr + "\n";
                                this.instHandler.resetTrap(); // Consume trap state
                            }
                        }
                    }

                    // Call log callback for EVERY instruction
                    if (options.logCallback) {
                        let argsStr = "";
                        try {
                            if (args && typeof args === 'object') {
                                const parts = [];
                                for (let k in args) {
                                    let val = args[k];
                                    if (typeof val === 'number') val = val.toString(16).toUpperCase();
                                    parts.push(`${k}:${val}`);
                                }
                                argsStr = parts.join(' ');
                            }
                        } catch (err) { argsStr = "err"; }

                        const getHexBytes = (start, count) => {
                            let hex = "";
                            for (let i = 0; i < count; i++) {
                                if (start + i >= codeBlock.length) break;
                                hex += codeBlock[start + i].toString(16).toUpperCase().padStart(2, '0');
                            }
                            return hex;
                        };

                        const stackStr = stack.stack.map(s => s.text || '?').join(', ');
                        const relativePC = pc - (options.oplBase || 0);
                        options.logCallback({
                            pc: relativePC.toString(16).toUpperCase().padStart(4, '0'),
                            bytes: getHexBytes(pc, size),
                            opName: def.desc + (argsStr && argsStr !== 'None' ? " " + argsStr : ""),
                            comment: `Stack: ${stackStr}`
                        });
                    }
                } catch (e) {
                    if (pendingElse) {
                        source += this.indent(pendingElse.indent) + "ELSE\n";
                        indentLevel++;
                        pendingElse = null;
                    }
                    const opStr = (op !== undefined) ? op.toString(16).toUpperCase().padStart(2, '0') : '??';
                    source += `  REM Error decompiling QCode ${opStr}: ${e.message} \n`;
                }


                pc += size;
            }

            // Append System Locations Summary
            if (usedSystemVars && usedSystemVars.size > 0 && typeof SYSTEM_CONSTANTS !== 'undefined') {
                source += "\n";
                source += "  REM System Locations\n";
                const sortedVars = Array.from(usedSystemVars).sort((a, b) => a - b);
                for (const addr of sortedVars) {
                    const hex = '$' + addr.toString(16).toUpperCase().padStart(4, '0');
                    const name = SYSTEM_CONSTANTS[addr] || 'Unknown';
                    source += `  REM ${hex} - ${name}\n`;
                }
            }


            if (pendingPrint !== null) {
                source += `  ${pendingPrint};\n`;
            }

            return source;
        }
    }

    if (typeof window !== 'undefined') {
        window.SourceGenerator = SourceGenerator;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SourceGenerator };
    }
})();
