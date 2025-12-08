/**
 * source_generator.js
 * 
 * Source Generator
 * Generates OPL source code from the decompiled instructions and control flow.
 */

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
            const suffix = this.getTypeSuffix(paramTypes[i]);
            params.push(`p${i + 1}${suffix}`);
        }

        let source = "";

        source += `${procName}:`;
        if (params.length > 0) source += `(${params.join(', ')})`;
        source += "\n";

        const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        source += `  REM Decompiled Source - OPK - Editor ${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '3.0.3'} \n`;
        source += `  REM ${date} \n`;

        if (isLZ) source += "  REM LZ Variant QCode\n";
        else source += "  REM CM,XP,LA & LZ code\n";

        if (externals.length > 0) {
            source += "  REM GLOBAL " + externals.map(e => {
                const suffix = this.getTypeSuffix(e.type);
                return (e.name.endsWith(suffix) ? e.name : e.name + suffix);
            }).join(",") + "\n";
        }

        if (globals.length > 0) {
            source += "  GLOBAL " + globals.map(g => {
                const suffix = this.getTypeSuffix(g.type);
                let s = (g.name.endsWith(suffix) ? g.name : g.name + suffix);
                if (g.arrayLen) s += `(${g.arrayLen})`;
                else if (g.maxLen) s += `(${g.maxLen})`;
                return s;
            }).join(",") + "\n";
        }

        const locals = Object.values(varMap).filter(v => v.isLocal).sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        if (locals.length > 0) {
            source += "  LOCAL " + locals.map(l => {
                let s = l.name;
                if ((l.type === 2 || l.maxLen) && !s.endsWith('$')) s += '$';
                if (l.maxLen) s += `(${l.maxLen})`;
                else if (l.arrayLen) s += `(${l.arrayLen})`;
                else if (l.isArray) s += `(10)`; // Default size if detected as array but no fixup
                return s;
            }).join(",") + "\n";
        }

        source += "\n";

        let pc = actualQCodeStart;
        const stack = new DecompilerStack();
        let indentLevel = 1;
        let pendingElse = null;

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

        while (pc < qcodeStart + qcodeSize) {
            // ... (flow control logic unchanged)
            if (flow.starts[pc]) {
                for (const struct of flow.starts[pc]) {
                    if (struct.type === 'DO') {
                        source += this.indent(indentLevel) + "DO\n";
                        indentLevel++;
                    }
                }
            }
            if (flow.targets[pc]) {
                // Sort targets by start address descending (inner structures first)
                const structs = flow.targets[pc].sort((a, b) => b.start - a.start);
                for (const struct of structs) {
                    if (struct.type === 'DO') {
                        indentLevel--;
                    } else if (struct.type === 'ENDWH') {
                        indentLevel--;
                        source += this.indent(indentLevel) + "ENDWH\n";
                    } else if (struct.type === 'ENDIF') {
                        indentLevel--;
                        source += this.indent(indentLevel) + "ENDIF\n";
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

            if ((flow.labels.has(pc) && !flow.structureLabels.has(pc)) || (flow.forceLabels && flow.forceLabels.has(pc))) {
                if (pendingElse) {
                    source += this.indent(pendingElse.indent) + "ELSE\n";
                    indentLevel++;
                    pendingElse = null;
                }
                const labelName = labelMap[pc] || `Lab${pc}`;
                source += `${labelName}:: \n`;
            }

            const op = codeBlock[pc];
            const def = this.instHandler.opcodes[op];

            if (!def) {
                if (pendingElse) {
                    source += this.indent(pendingElse.indent) + "ELSE\n";
                    indentLevel++;
                    pendingElse = null;
                }
                if (pc < codeBlock.length) {
                    const hex = codeBlock[pc].toString(16).toUpperCase().padStart(2, '0');
                    source += `  REM Unknown QCode ${hex} \n`;
                    source += `  REM ${hex} \n`;
                } else {
                    source += `  REM Unknown QCode (EOF) \n`;
                }
                pc++;
                continue;
            }

            const size = this.instHandler.getInstructionSize(codeBlock, pc, def);
            if (pc + size > codeBlock.length) {
                source += `  REM Error: Instruction at ${pc.toString(16)} extends beyond code block \n`;
                break;
            }
            const args = this.instHandler.getArgs(codeBlock, pc, def);

            if (op === 0x7E) { // BranchIfFalse
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
                        source += this.indent(indentLevel) + `WHILE (${cond}) \n`;
                        indentLevel++;
                        pc += size;
                        continue;
                    } else if (struct.type === 'IF') {
                        const condObj = stack.pop();
                        const cond = condObj.text || '0';
                        if (pendingElse && struct.end === pendingElse.outerEnd) {
                            source += this.indent(pendingElse.indent) + `ELSEIF (${cond}) \n`;
                            indentLevel++;
                            pendingElse = null;
                        } else {
                            if (pendingElse) {
                                source += this.indent(pendingElse.indent) + "ELSE\n";
                                indentLevel++;
                                pendingElse = null;
                            }
                            source += this.indent(indentLevel) + `IF (${cond}) \n`;
                            indentLevel++;
                        }
                        pc += size;
                        continue;
                    } else if (struct.type === 'DO') {
                        if (pendingElse) {
                            source += this.indent(pendingElse.indent) + "ELSE\n";
                            indentLevel++;
                            pendingElse = null;
                        }
                        const condObj = stack.pop();
                        const cond = condObj.text || '0';
                        indentLevel--;
                        source += this.indent(indentLevel) + `UNTIL (${cond}) \n`;
                        pc += size;
                        continue;
                    }
                }
            } else if (op === 0x51) { // GOTO
                const struct = flow.jumps[pc];
                if (struct) {
                    if (struct.type === 'WHILE') { pc += size; continue; }
                    else if (struct.type === 'ELSE') { pc += size; continue; }
                }
            }

            try {
                const expr = this.instHandler.handleInstruction(op, def, args, stack, varMap, pc, size, codeBlock, labelMap, usedSystemVars);
                if (expr) {
                    if (pendingElse) {
                        source += this.indent(pendingElse.indent) + "ELSE\n";
                        indentLevel++;
                        pendingElse = null;
                    }
                    if (expr.trim() === 'TRAP') {
                        source += this.indent(indentLevel) + "TRAP ";
                    } else {
                        source += this.indent(indentLevel) + expr + "\n";
                    }

                    if (expr.includes('undefined')) {
                        const hexDump = Array.from(codeBlock.slice(pc, pc + size)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
                        source += `  REM ${hexDump} \n`;
                    }
                }
            } catch (e) {
                if (pendingElse) {
                    source += this.indent(pendingElse.indent) + "ELSE\n";
                    indentLevel++;
                    pendingElse = null;
                }
                const hexDump = Array.from(codeBlock.slice(pc, pc + size)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
                source += `  REM Error decompiling QCode ${op.toString(16).toUpperCase().padStart(2, '0')}: ${e.message} \n`;
                source += `  REM Stack: ${JSON.stringify(stack.stack)} \n`;
                source += `  REM ${hexDump} \n`;
            }

            // Suppress trailing RETURN
            if (pc + size >= qcodeStart + qcodeSize && def.desc === 'RETURN' && (!def.pops || def.pops === '?')) {
                break;
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

        return source;
    }
}

if (typeof window !== 'undefined') {
    window.SourceGenerator = SourceGenerator;
}
