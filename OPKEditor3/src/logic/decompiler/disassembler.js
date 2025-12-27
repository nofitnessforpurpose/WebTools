/**
 * disassembler.js
 * 
 * HD6303 Disassembler for Inline Assembly blocks in OPL.
 * Decodes machine code instructions into readable assembly text.
 * Support for Psion Organiser II SWI calls and 6303 extensions (AIM/OIM/EIM/TIM).
 */

class HD6303Disassembler {
    constructor() {
        this.opcodes = this.buildOpcodeTable();
        this.swiNames = this.buildSwiTable();
    }

    disassemble(codeBlock, startPc = 0) {
        let output = [];
        let pc = 0;

        output.push("REM Inline Assembly (Start)");

        while (pc < codeBlock.length) {
            const op = codeBlock[pc];
            const def = this.opcodes[op];

            let line = `REM ${this.formatHex(pc + startPc, 4)}: ${this.formatHex(op, 2)}`;
            let instructionText = "";
            let bytes = 1;

            if (!def) {
                instructionText = `??? ($${this.formatHex(op, 2)})`;
            } else {
                instructionText = def.mnemonic;

                // Handle Addressing Modes
                if (def.mode === 'IMP') {
                    // Implicit, no args
                } else if (def.mode === 'IMM') {
                    if (pc + 1 < codeBlock.length) {
                        const val = codeBlock[pc + 1];
                        instructionText += ` #${this.formatHex(val, 2)}`;
                        line += ` ${this.formatHex(val, 2)}`;
                        bytes += 1;
                    }
                } else if (def.mode === 'IMM16') {
                    if (pc + 2 < codeBlock.length) {
                        const val = (codeBlock[pc + 1] << 8) | codeBlock[pc + 2];
                        instructionText += ` #${this.formatHex(val, 4)}`;
                        line += ` ${this.formatHex(codeBlock[pc + 1], 2)} ${this.formatHex(codeBlock[pc + 2], 2)}`;
                        bytes += 2;
                    }
                } else if (def.mode === 'DIR') {
                    if (pc + 1 < codeBlock.length) {
                        const val = codeBlock[pc + 1];
                        instructionText += ` $${this.formatHex(val, 2)}`;
                        line += ` ${this.formatHex(val, 2)}`;
                        bytes += 1;
                    }
                } else if (def.mode === 'EXT') {
                    if (pc + 2 < codeBlock.length) {
                        const val = (codeBlock[pc + 1] << 8) | codeBlock[pc + 2];
                        instructionText += ` $${this.formatHex(val, 4)}`;
                        line += ` ${this.formatHex(codeBlock[pc + 1], 2)} ${this.formatHex(codeBlock[pc + 2], 2)}`;
                        bytes += 2;
                    }
                } else if (def.mode === 'IND') { // Indexed (offset,X)
                    if (pc + 1 < codeBlock.length) {
                        const val = codeBlock[pc + 1];
                        instructionText += ` $${this.formatHex(val, 2)},X`;
                        line += ` ${this.formatHex(val, 2)}`;
                        bytes += 1;
                    }
                } else if (def.mode === 'REL') {
                    if (pc + 1 < codeBlock.length) {
                        const offset = codeBlock[pc + 1];
                        line += ` ${this.formatHex(offset, 2)}`;
                        bytes += 1;

                        // Calculate target address
                        let rel = offset;
                        if (rel >= 128) rel -= 256;
                        // Target is relative to PC AFTER the instruction (pc + 2)
                        const target = (pc + 2 + rel) & 0xFFFF;
                        instructionText += ` $${this.formatHex(target + startPc, 4)} (Rel ${rel})`;
                    }
                } else if (def.mode === 'SWI_VAL') {
                    // Psion Specific: SWI followed by routine ID
                    if (pc + 1 < codeBlock.length) {
                        const val = codeBlock[pc + 1];
                        const name = this.swiNames[val] || `$${this.formatHex(val, 2)}`;
                        instructionText += ` ${name}`;
                        line += ` ${this.formatHex(val, 2)}`;
                        bytes += 1;

                        // Special handling for ut$disp (111) - Inline String
                        if (val === 111) {
                            if (pc + 2 < codeBlock.length) {
                                const len = codeBlock[pc + 2];
                                line += ` ${this.formatHex(len, 2)}`;
                                bytes += 1; // Count length byte

                                let str = "";
                                if (pc + 2 + len < codeBlock.length) {
                                    for (let i = 0; i < len; i++) {
                                        const charCode = codeBlock[pc + 3 + i];
                                        // Simple ASCII check
                                        if (charCode >= 32 && charCode <= 126) {
                                            str += String.fromCharCode(charCode);
                                        } else {
                                            str += '.';
                                        }
                                        // Only add hex for first few chars to avoid huge lines
                                        if (i < 4) {
                                            line += ` ${this.formatHex(charCode, 2)}`;
                                        }
                                    }
                                    if (len > 4) line += ` ...`;
                                    bytes += len; // Count string bytes
                                    instructionText += `, "${str}"`;
                                } else {
                                    instructionText += `, "..." (Truncated)`;
                                    // consume safely
                                    bytes += (codeBlock.length - (pc + 3));
                                }
                            }
                        }
                    } else {
                        instructionText += ` ???`;
                    }
                } else if (def.mode === 'IMM_DIR') { // AIM/OIM/EIM/TIM #,dir (3 bytes)
                    if (pc + 2 < codeBlock.length) {
                        const imm = codeBlock[pc + 1];
                        const dir = codeBlock[pc + 2];
                        instructionText += ` #${this.formatHex(imm, 2)},$${this.formatHex(dir, 2)}`;
                        line += ` ${this.formatHex(imm, 2)} ${this.formatHex(dir, 2)}`;
                        bytes += 2;
                    }
                } else if (def.mode === 'IMM_IND') { // AIM/OIM/EIM/TIM #,off,X (3 bytes)
                    if (pc + 2 < codeBlock.length) {
                        const imm = codeBlock[pc + 1];
                        const off = codeBlock[pc + 2];
                        instructionText += ` #${this.formatHex(imm, 2)},$${this.formatHex(off, 2)},X`;
                        line += ` ${this.formatHex(imm, 2)} ${this.formatHex(off, 2)}`;
                        bytes += 2;
                    }
                }
            }

            // Align instruction text
            let padding = " ".repeat(Math.max(1, 14 - ((bytes * 3))));
            line += padding + instructionText;

            output.push(line);
            pc += bytes;
        }

        output.push("REM Inline Assembly (End)");
        return output.join("\n");
    }

    formatHex(val, digits) {
        return val.toString(16).toUpperCase().padStart(digits, '0');
    }

    buildSwiTable() {
        return {
            0: 'al$free', 1: 'al$grab', 2: 'al$grow', 3: 'al$repl', 4: 'al$shnk', 5: 'al$size', 6: 'al$zero',
            7: 'bt$nmdn', 8: 'bt$nmen', 9: 'bt$nof', 10: 'bt$non', 11: 'bt$pprg', 12: 'bt$swof',
            13: 'bz$alrm', 14: 'bz$bell', 15: 'bz$tone',
            16: 'dp$emit', 17: 'dp$prnt', 18: 'dp$rest', 19: 'dp$save', 20: 'dp$stat', 21: 'dp$view', 22: 'dp$wrdy',
            23: 'dv$boot', 24: 'dv$cler', 25: 'dv$lkup', 26: 'dv$load', 27: 'dv$vect',
            28: 'ed$edit', 29: 'ed$epos', 30: 'ed$view',
            31: 'er$lkup', 32: 'er$mess',
            33: 'fl$back', 34: 'fl$bcat', 35: 'fl$bdel', 36: 'fl$bopn', 37: 'fl$bsav', 38: 'fl$catl', 39: 'fl$copy',
            40: 'fl$cret', 41: 'fl$deln', 42: 'fl$eras', 43: 'fl$ffnd', 44: 'fl$find', 45: 'fl$frec', 46: 'fl$next',
            47: 'fl$open', 48: 'fl$pars', 49: 'fl$read', 50: 'fl$rect', 51: 'fl$renm', 52: 'fl$rset', 53: 'fl$setp',
            54: 'fl$size', 55: 'fl$writ',
            56: 'fn$atan', 57: 'fn$cos', 58: 'fn$exp', 59: 'fn$ln', 60: 'fn$log', 61: 'fn$powr', 62: 'fn$rnd',
            63: 'fn$sin', 64: 'fn$sqrt', 65: 'fn$tan',
            66: 'it$gval', 67: 'it$radd', 68: 'it$strt', 69: 'it$tadd',
            70: 'kb$brek', 71: 'kb$flsh', 72: 'kb$getk', 73: 'kb$init', 74: 'kb$stat', 75: 'kb$test', 76: 'kb$uget',
            77: 'lg$newp', 78: 'lg$rled', 79: 'ln$strt',
            80: 'mn$disp',
            81: 'mt$btof', 82: 'mt$fadd', 83: 'mt$fbdc', 84: 'mt$fbex', 85: 'mt$fbgn', 86: 'mt$fbin', 87: 'mt$fdiv',
            88: 'mt$fmul', 89: 'mt$fngt', 90: 'mt$fsub',
            91: 'pk$pkof', 92: 'pk$qadd', 93: 'pk$rbyt', 94: 'pk$read', 95: 'pk$rwrd', 96: 'pk$sadd', 97: 'pk$save',
            98: 'pk$setp', 99: 'pk$skip',
            100: 'rm$runp',
            101: 'tl$addi', 102: 'tl$cpyx', 103: 'tl$deli', 104: 'tl$xxmd',
            105: 'tm$dayv', 106: 'tm$tget', 107: 'tm$updt', 108: 'tm$wait',
            109: 'ut$cpyb', 110: 'ut$ddsp', 111: 'ut$disp', 112: 'ut$entr', 113: 'ut$fill', 114: 'ut$icpb', 115: 'ut$isbf',
            116: 'ut$leav', 117: 'ut$sdiv', 118: 'ut$smul', 119: 'ut$splt', 120: 'ut$udiv', 121: 'ut$umul', 122: 'ut$utob',
            123: 'ut$xcat', 124: 'ut$xtob', 125: 'ut$ysno',
            126: 'ut$cdsp', 127: 'tl$rstr'
        };
    }

    buildOpcodeTable() {
        const ops = {};
        const add = (code, mnemonic, mode) => { ops[code] = { mnemonic, mode }; };

        add(0x00, 'TRAP', 'IMP');
        add(0x01, 'NOP', 'IMP');
        add(0x04, 'LSRD', 'IMP');
        add(0x05, 'ASLD', 'IMP');
        add(0x06, 'TAP', 'IMP');
        add(0x07, 'TPA', 'IMP');
        add(0x08, 'INX', 'IMP');
        add(0x09, 'DEX', 'IMP');
        add(0x0A, 'CLV', 'IMP');
        add(0x0B, 'SEV', 'IMP');
        add(0x0C, 'CLC', 'IMP');
        add(0x0D, 'SEC', 'IMP');
        add(0x0E, 'CLI', 'IMP');
        add(0x0F, 'SEI', 'IMP');
        add(0x10, 'SBA', 'IMP');
        add(0x11, 'CBA', 'IMP');
        add(0x16, 'TAB', 'IMP');
        add(0x17, 'TBA', 'IMP');
        add(0x18, 'XGDX', 'IMP');
        add(0x19, 'DAA', 'IMP');
        add(0x1A, 'SLP', 'IMP'); // Sleep
        add(0x1B, 'ABA', 'IMP'); // Add B to A

        add(0x20, 'BRA', 'REL');
        add(0x21, 'BRN', 'REL'); // Branch Never
        add(0x22, 'BHI', 'REL');
        add(0x23, 'BLS', 'REL');
        add(0x24, 'BCC', 'REL');
        add(0x25, 'BCS', 'REL');
        add(0x26, 'BNE', 'REL');
        add(0x27, 'BEQ', 'REL');
        add(0x28, 'BVC', 'REL');
        add(0x29, 'BVS', 'REL');
        add(0x2A, 'BPL', 'REL');
        add(0x2B, 'BMI', 'REL');
        add(0x2C, 'BGE', 'REL');
        add(0x2D, 'BLT', 'REL');
        add(0x2E, 'BGT', 'REL');
        add(0x2F, 'BLE', 'REL');

        add(0x30, 'TSX', 'IMP');
        add(0x31, 'INS', 'IMP');
        add(0x32, 'PULA', 'IMP');
        add(0x33, 'PULB', 'IMP');
        add(0x34, 'DES', 'IMP');
        add(0x35, 'TXS', 'IMP');
        add(0x36, 'PSHA', 'IMP');
        add(0x37, 'PSHB', 'IMP');
        add(0x38, 'PULX', 'IMP');
        add(0x39, 'RTS', 'IMP');
        add(0x3A, 'ABX', 'IMP');
        add(0x3B, 'RTI', 'IMP');
        add(0x3C, 'PSHX', 'IMP');
        add(0x3D, 'MUL', 'IMP');
        add(0x3E, 'WAI', 'IMP');
        add(0x3F, 'SWI', 'SWI_VAL');

        add(0x40, 'NEGA', 'IMP');
        add(0x43, 'COMA', 'IMP');
        add(0x44, 'LSRA', 'IMP');
        add(0x46, 'RORA', 'IMP');
        add(0x47, 'ASRA', 'IMP');
        add(0x48, 'ASLA', 'IMP');
        add(0x49, 'ROLA', 'IMP');
        add(0x4A, 'DECA', 'IMP');
        add(0x4C, 'INCA', 'IMP');
        add(0x4D, 'TSTA', 'IMP');
        add(0x4F, 'CLRA', 'IMP');

        add(0x50, 'NEGB', 'IMP');
        add(0x53, 'COMB', 'IMP');
        add(0x54, 'LSRB', 'IMP');
        add(0x56, 'RORB', 'IMP');
        add(0x57, 'ASRB', 'IMP');
        add(0x58, 'ASLB', 'IMP');
        add(0x59, 'ROLB', 'IMP');
        add(0x5A, 'DECB', 'IMP');
        add(0x5C, 'INCB', 'IMP');
        add(0x5D, 'TSTB', 'IMP');
        add(0x5F, 'CLRB', 'IMP');

        add(0x60, 'NEG', 'IND');
        add(0x61, 'AIM', 'IMM_IND'); // 6303: AIM #,d,X
        add(0x62, 'OIM', 'IMM_IND'); // 6303: OIM #,d,X
        add(0x63, 'COM', 'IND');
        add(0x64, 'LSR', 'IND');
        add(0x65, 'EIM', 'IMM_IND'); // 6303: EIM #,d,X
        add(0x66, 'ROR', 'IND');
        add(0x67, 'ASR', 'IND');
        add(0x68, 'ASL', 'IND');
        add(0x69, 'ROL', 'IND');
        add(0x6A, 'DEC', 'IND');
        add(0x6B, 'TIM', 'IMM_IND'); // 6303: TIM #,d,X
        add(0x6C, 'INC', 'IND');
        add(0x6D, 'TST', 'IND');
        add(0x6E, 'JMP', 'IND');
        add(0x6F, 'JSR', 'IND');

        add(0x70, 'NEG', 'EXT'); // NEG extended? User list says NEG mm is 0x70 (3,6)
        add(0x71, 'AIM', 'IMM_DIR'); // 6303: AIM #,0m
        add(0x72, 'OIM', 'IMM_DIR'); // 6303: OIM #,0m
        add(0x73, 'COM', 'EXT'); // EXT? User list says 73 COM mm is EXT. 
        // Wait, standard 6800:
        // 60-6F: Indexed
        // 70-7F: Extended (Usually)
        // But AIM/OIM/EIM/TIM supplant some existing ops in 6303?
        // User list:
        // 0x70 NEG mm (NEG EXT) - Correct
        // 0x71 AIM #,0m (AIM DIR) - 3 bytes (Op, Imm, Dir) - Correct
        // 0x72 OIM #,0m (OIM DIR) - Correct
        // 0x73 COM mm (COM EXT) - Correct
        // 0x74 LSR mm (LSR EXT) - Correct
        // 0x75 EIM #,0m (EIM DIR) - Correct
        // 0x76 ROR mm (ROR EXT) - Correct
        // 0x77 ASR mm (ASR EXT) - Correct
        // 0x78 ASL mm (ASL EXT) - Correct
        // 0x79 ROL mm (ROL EXT) - Correct
        // 0x7A DEC mm (DEC EXT) - Correct
        // 0x7B TIM #,0m (TIM DIR) - Correct
        // 0x7C INC mm (INC EXT) - Correct
        // 0x7D TST mm (TST EXT) - Correct
        // 0x7E JMP mm (JMP EXT) - Correct
        // 0x7F CLR mm (CLR EXT) - Correct
        add(0x74, 'LSR', 'EXT');
        add(0x75, 'EIM', 'IMM_DIR');
        add(0x76, 'ROR', 'EXT');
        add(0x77, 'ASR', 'EXT');
        add(0x78, 'ASL', 'EXT');
        add(0x79, 'ROL', 'EXT');
        add(0x7A, 'DEC', 'EXT');
        add(0x7B, 'TIM', 'IMM_DIR');
        add(0x7C, 'INC', 'EXT');
        add(0x7D, 'TST', 'EXT');
        add(0x7E, 'JMP', 'EXT');
        add(0x7F, 'CLR', 'EXT');

        add(0x80, 'SUBA', 'IMM');
        add(0x81, 'CMPA', 'IMM');
        add(0x82, 'SBCA', 'IMM');
        add(0x83, 'SUBD', 'IMM16');
        add(0x84, 'ANDA', 'IMM');
        add(0x85, 'BITA', 'IMM');
        add(0x86, 'LDAA', 'IMM');
        add(0x88, 'EORA', 'IMM');
        add(0x89, 'ADCA', 'IMM');
        add(0x8A, 'ORAA', 'IMM');
        add(0x8B, 'ADDA', 'IMM');
        add(0x8C, 'CPX', 'IMM16');
        add(0x8D, 'BSR', 'REL');
        add(0x8E, 'LDS', 'IMM16');

        add(0x90, 'SUBA', 'DIR');
        add(0x91, 'CMPA', 'DIR');
        add(0x92, 'SBCA', 'DIR');
        add(0x93, 'SUBD', 'DIR');
        add(0x94, 'ANDA', 'DIR');
        add(0x95, 'BITA', 'DIR');
        add(0x96, 'LDAA', 'DIR');
        add(0x97, 'STAA', 'DIR');
        add(0x98, 'EORA', 'DIR');
        add(0x99, 'ADCA', 'DIR');
        add(0x9A, 'ORAA', 'DIR');
        add(0x9B, 'ADDA', 'DIR');
        add(0x9C, 'CPX', 'DIR');
        add(0x9D, 'JSR', 'DIR');
        add(0x9E, 'LDS', 'DIR');
        add(0x9F, 'STS', 'DIR');

        add(0xA0, 'SUBA', 'IND');
        add(0xA1, 'CMPA', 'IND');
        add(0xA2, 'SBCA', 'IND');
        add(0xA3, 'SUBD', 'IND');
        add(0xA4, 'ANDA', 'IND');
        add(0xA5, 'BITA', 'IND');
        add(0xA6, 'LDAA', 'IND');
        add(0xA7, 'STAA', 'IND');
        add(0xA8, 'EORA', 'IND');
        add(0xA9, 'ADCA', 'IND');
        add(0xAA, 'ORAA', 'IND');
        add(0xAB, 'ADDA', 'IND');
        add(0xAC, 'CPX', 'IND');
        add(0xAD, 'JSR', 'IND');
        add(0xAE, 'LDS', 'IND');
        add(0xAF, 'STS', 'IND');

        add(0xB0, 'SUBA', 'EXT');
        add(0xB1, 'CMPA', 'EXT');
        add(0xB2, 'SBCA', 'EXT');
        add(0xB3, 'SUBD', 'EXT');
        add(0xB4, 'ANDA', 'EXT');
        add(0xB5, 'BITA', 'EXT');
        add(0xB6, 'LDAA', 'EXT');
        add(0xB7, 'STAA', 'EXT');
        add(0xB8, 'EORA', 'EXT');
        add(0xB9, 'ADCA', 'EXT');
        add(0xBA, 'ORAA', 'EXT');
        add(0xBB, 'ADDA', 'EXT');
        add(0xBC, 'CPX', 'EXT');
        add(0xBD, 'JSR', 'EXT');
        add(0xBE, 'LDS', 'EXT');
        add(0xBF, 'STS', 'EXT');

        add(0xC0, 'SUBB', 'IMM');
        add(0xC1, 'CMPB', 'IMM');
        add(0xC2, 'SBCB', 'IMM');
        add(0xC3, 'ADDD', 'IMM16');
        add(0xC4, 'ANDB', 'IMM');
        add(0xC5, 'BITB', 'IMM');
        add(0xC6, 'LDAB', 'IMM');
        add(0xC8, 'EORB', 'IMM');
        add(0xC9, 'ADCB', 'IMM');
        add(0xCA, 'ORAB', 'IMM');
        add(0xCB, 'ADDB', 'IMM');
        add(0xCC, 'LDD', 'IMM16');
        add(0xCD, 'STD', 'DIR'); // User list 221 DD STD 0m. What about CD?
        // 204 CC LDD ##.
        // User list doesn't show CD.
        // User list shows 221 (DD) STD 0m.
        // User list shows 237 (ED) STD d,X.
        // User list shows 253 (FD) STD mm.
        // CD is missing from user list -> Likely Undefined/Illegal.
        // remove CD
        add(0xCE, 'LDX', 'IMM16');
        // CF STX DIR is NOT in user list. 
        // User list: 223 DF STX 0m. 
        // 239 EF STX d,X.
        // 255 FF STX mm.
        // CF missing.

        add(0xD0, 'SUBB', 'DIR');
        add(0xD1, 'CMPB', 'DIR');
        add(0xD2, 'SBCB', 'DIR');
        add(0xD3, 'ADDD', 'DIR');
        add(0xD4, 'ANDB', 'DIR');
        add(0xD5, 'BITB', 'DIR');
        add(0xD6, 'LDAB', 'DIR');
        add(0xD7, 'STAB', 'DIR');
        add(0xD8, 'EORB', 'DIR');
        add(0xD9, 'ADCB', 'DIR');
        add(0xDA, 'ORAB', 'DIR');
        add(0xDB, 'ADDB', 'DIR');
        add(0xDC, 'LDD', 'DIR');
        add(0xDD, 'STD', 'DIR');
        add(0xDE, 'LDX', 'DIR');
        add(0xDF, 'STX', 'DIR');

        add(0xE0, 'SUBB', 'IND');
        add(0xE1, 'CMPB', 'IND');
        add(0xE2, 'SBCB', 'IND');
        add(0xE3, 'ADDD', 'IND');
        add(0xE4, 'ANDB', 'IND');
        add(0xE5, 'BITB', 'IND');
        add(0xE6, 'LDAB', 'IND');
        add(0xE7, 'STAB', 'IND');
        add(0xE8, 'EORB', 'IND');
        add(0xE9, 'ADCB', 'IND');
        add(0xEA, 'ORAB', 'IND');
        add(0xEB, 'ADDB', 'IND');
        add(0xEC, 'LDD', 'IND');
        add(0xED, 'STD', 'IND');
        add(0xEE, 'LDX', 'IND');
        add(0xEF, 'STX', 'IND');

        add(0xF0, 'SUBB', 'EXT');
        add(0xF1, 'CMPB', 'EXT');
        add(0xF2, 'SBCB', 'EXT');
        add(0xF3, 'ADDD', 'EXT');
        add(0xF4, 'ANDB', 'EXT');
        add(0xF5, 'BITB', 'EXT');
        add(0xF6, 'LDAB', 'EXT');
        add(0xF7, 'STAB', 'EXT');
        add(0xF8, 'EORB', 'EXT');
        add(0xF9, 'ADCB', 'EXT');
        add(0xFA, 'ORAB', 'EXT');
        add(0xFB, 'ADDB', 'EXT');
        add(0xFC, 'LDD', 'EXT');
        add(0xFD, 'STD', 'EXT');
        add(0xFE, 'LDX', 'EXT');
        add(0xFF, 'STX', 'EXT');

        return ops;
    }
}
