'use strict';

/**
 * HPGLMultiModeParser
 * -------------------
 * A deterministic parsing engine for Hewlett-Packard Plotter languages (HP-GL, HP-GL/2, PCL 5).
 * It isolates legacy HP-GL syntax from modern HP-GL/2 syntax based on target context
 * and handles PCL 5 escape sequences.
 */
class HPGLMultiModeParser {
    /**
     * @param {Object} [options]
     * @param {string} [options.initialMode='PCL5'] - 'LEGACY_HPGL', 'PCL5', 'HPGL2_STANDALONE', 'HPGL2_ANCHORED'
     * @param {number} [options.pictureFrameWidth=16000] - Frame width in PLU (Plotter Units)
     * @param {number} [options.pictureFrameHeight=11400] - Frame height in PLU (Plotter Units)
     */
    constructor(options = {}) {
        this.initialMode = options.initialMode || 'PCL5';
        this.streamBuffer = '';
        this.reset();
        
        if (options.pictureFrameWidth !== undefined) this.pictureFrameWidth = options.pictureFrameWidth;
        if (options.pictureFrameHeight !== undefined) this.pictureFrameHeight = options.pictureFrameHeight;
    }

    /**
     * Resets the parser state to default.
     */
    reset() {
        this.currentMode = this.initialMode;
        this.pictureFrameWidth = 16000;  // Default width (PLU)
        this.pictureFrameHeight = 11400; // Default height (PLU)
        this.labelTerminator = '\x03';   // Default ETX
        
        // PCL Cursor positions in decipoints
        this.pclCursorX = 0;
        this.pclCursorY = 0;
        
        // Track errors or warning counts
        this.errors = [];
    }

    /**
     * Converts Decipoints to Plotter Units (PLU).
     * 1 decipoint = 1/720 inch = 0.0352778 mm
     * 1 plotter unit = 0.025 mm
     * Scale factor = 0.0352778 / 0.025 = 1.411111...
     * @param {number} decipoints
     * @returns {number} PLU
     */
    static decipointsToPLU(decipoints) {
        return decipoints * 1.41111111;
    }

    /**
     * Converts Plotter Units (PLU) to Decipoints.
     * @param {number} plu
     * @returns {number} decipoints
     */
    static pluToDecipoints(plu) {
        return plu / 1.41111111;
    }

    /**
     * Parses an incoming chunk of data stream.
     * @param {string} data - Stream of characters (PCL / HP-GL data)
     * @returns {Array<Object>} List of parsed token/command objects
     */
    parse(data) {
        if (this.streamBuffer === undefined) {
            this.streamBuffer = '';
        }
        this.streamBuffer += data;
        const tokens = [];
        let i = 0;
        const len = this.streamBuffer.length;
        let incompleteDetected = false;

        while (i < len) {
            const char = this.streamBuffer[i];

            // 1. Detect Escape Character (0x1B)
            if (char === '\x1B') {
                const escMatch = this._parseEscapeSequence(this.streamBuffer, i);
                if (escMatch) {
                    if (escMatch.incomplete) {
                        incompleteDetected = true;
                        break; // Stop parsing, keep remaining in buffer
                    }
                    tokens.push(escMatch);
                    i += escMatch.length;
                    
                    // Apply state/context change based on escape sequence
                    this._applyStateChange(escMatch);
                    continue;
                } else {
                    // Malformed escape, skip it
                    this.errors.push({ index: i, message: 'Malformed escape sequence' });
                    i++;
                    continue;
                }
            }

            // 2. Route parsing based on current mode
            if (this.currentMode === 'PCL5') {
                // In pure PCL 5 mode, ignore vector commands, consume text or standard whitespace
                i++;
            } else if (this.currentMode === 'LEGACY_HPGL' || this.currentMode === 'HPGL2_STANDALONE' || this.currentMode === 'HPGL2_ANCHORED') {
                // Skip separators/whitespace
                if (char === ' ' || char === ';' || char === '\r' || char === '\n' || char === ',') {
                    i++;
                    continue;
                }

                // Extract HP-GL command (first 2 alpha characters)
                if (i + 1 < len) {
                    const mnemonic = this.streamBuffer.substring(i, i + 2).toUpperCase();
                    if (/^[A-Z]{2}$/.test(mnemonic)) {
                        const hpglCmd = this._parseHPGLCommand(this.streamBuffer, i, mnemonic);
                        if (hpglCmd.incomplete) {
                            incompleteDetected = true;
                            break; // Stop parsing, keep remaining in buffer
                        }
                        tokens.push(hpglCmd);
                        i += hpglCmd.length;
                        continue;
                    }
                } else {
                    // Only 1 character at the end of the stream, could be start of mnemonic
                    incompleteDetected = true;
                    break;
                }

                // Unknown character in vector mode, skip it
                i++;
            } else {
                i++;
            }
        }

        // Consume processed characters from streamBuffer
        this.streamBuffer = this.streamBuffer.substring(i);

        return tokens;
    }

    /**
     * Flush any remaining data in the buffer as a finalized command.
     * Useful when the stream is completed or EOF is reached.
     */
    flush() {
        const tokens = [];
        if (!this.streamBuffer || this.streamBuffer.length < 2) {
            this.streamBuffer = '';
            return tokens;
        }
        
        const data = this.streamBuffer;
        const len = data.length;
        
        let i = 0;
        // Skip separators/whitespace at start
        while (i < len) {
            const c = data[i];
            if (c === ' ' || c === ';' || c === '\r' || c === '\n' || c === ',') {
                i++;
            } else {
                break;
            }
        }
        
        if (i + 1 < len) {
            const mnemonic = data.substring(i, i + 2).toUpperCase();
            if (/^[A-Z]{2}$/.test(mnemonic)) {
                if (mnemonic === 'PE') {
                    const paramStr = data.substring(i + 2);
                    tokens.push({
                        type: 'HPGL_COMMAND',
                        name: 'Polyline Encoded',
                        mnemonic: 'PE',
                        raw: data.substring(i),
                        length: len - i,
                        params: [],
                        encodedData: paramStr
                    });
                } else if (mnemonic === 'LB') {
                    const paramStr = data.substring(i + 2);
                    tokens.push({
                        type: 'HPGL_COMMAND',
                        name: 'Label',
                        mnemonic: 'LB',
                        raw: data.substring(i),
                        length: len - i,
                        params: [],
                        labelText: paramStr
                    });
                } else {
                    const paramStr = data.substring(i + 2);
                    const params = this._parseNumericParams(paramStr);
                    const coordinates = this._processCoordinates(mnemonic, params);
                    tokens.push({
                        type: 'HPGL_COMMAND',
                        name: this._getHPGLCommandName(mnemonic),
                        mnemonic: mnemonic,
                        raw: data.substring(i),
                        length: len - i,
                        params: params,
                        ...(coordinates ? { coordinates } : {})
                    });
                }
            }
        }
        
        this.streamBuffer = '';
        return tokens;
    }

    /**
     * Parse an Escape Sequence starting at index `start`.
     * Handles PCL 5, UEL, DCI, and Mode Switches.
     * @private
     */
    _parseEscapeSequence(data, start) {
        const len = data.length;
        if (data[start] !== '\x1B') return null;

        // Check Universal Exit Language (UEL)
        if (len - start < 9) {
            if ('\x1B%-12345X'.startsWith(data.substring(start))) {
                return { incomplete: true };
            }
        } else if (data.substring(start, start + 9) === '\x1B%-12345X') {
            return {
                type: 'PCL_ESCAPE',
                name: 'Universal Exit Language',
                mnemonic: 'Esc%-12345X',
                raw: '\x1B%-12345X',
                length: 9,
                params: []
            };
        }

        // Check DCI Escape Sequences (Esc.)
        if (start + 1 < len) {
            if (data[start + 1] === '.') {
                if (start + 2 < len) {
                    const code = data[start + 2];
                    if (['(', 'I', 'O', 'R', 'S'].includes(code)) {
                        let i = start + 3;
                        let foundTerminator = false;
                        while (i < len) {
                            if (data[i] === ';') {
                                foundTerminator = true;
                                i++;
                                break;
                            }
                            if (data[i] === '\x1B') {
                                // Implicit terminator by next escape sequence
                                break;
                            }
                            i++;
                        }
                        if (i >= len && !foundTerminator) {
                            return { incomplete: true };
                        }
                        const raw = data.substring(start, i);
                        const paramStr = raw.substring(3, foundTerminator ? raw.length - 1 : raw.length);
                        const params = this._parseNumericParams(paramStr);
                        
                        let name = 'DCI Command';
                        if (code === '(') name = 'Handshake Configuration';
                        else if (code === 'I') name = 'Intercharacter Delay';
                        else if (code === 'O') name = 'Output Status';
                        else if (code === 'R') name = 'Hard Reset';
                        else if (code === 'S') name = 'Set Output Handshake';

                        return {
                            type: 'DCI_ESCAPE',
                            name: name,
                            mnemonic: `Esc.${code}`,
                            raw: raw,
                            length: raw.length,
                            params: params
                        };
                    }
                } else {
                    return { incomplete: true };
                }
            }
        } else {
            return { incomplete: true };
        }

        // Check Mode Switches (Esc%...)
        if (start + 1 < len && data[start + 1] === '%') {
            let i = start + 2;
            let paramStr = '';
            let termFound = false;
            while (i < len) {
                if (/[a-zA-Z]/.test(data[i])) {
                    termFound = true;
                    break;
                }
                paramStr += data[i];
                i++;
            }
            if (!termFound) {
                return { incomplete: true };
            }
            const termChar = data[i];
            const raw = data.substring(start, i + 1);
            const fullMnemonic = `Esc%${paramStr}${termChar}`;
            
            let name = 'Mode Switch';
            if (paramStr === '-1' && termChar === 'B') name = 'Enter Standalone HP-GL/2';
            else if (paramStr === '1' && termChar === 'B') name = 'Enter Anchored HP-GL/2';
            else if (paramStr === '0' && termChar === 'A') name = 'Return to Text/PCL Mode';

            return {
                type: 'PCL_ESCAPE',
                name: name,
                mnemonic: fullMnemonic,
                raw: raw,
                length: raw.length,
                params: this._parseNumericParams(paramStr)
            };
        }

        // Check standard PCL 5 Escape Sequences
        if (start + 1 < len) {
            const next = data[start + 1];
            if (/[a-zA-Z]/.test(next)) {
                return {
                    type: 'PCL_ESCAPE',
                    name: next === 'E' ? 'Printer Reset' : 'Two-character Escape',
                    mnemonic: `Esc${next}`,
                    raw: data.substring(start, start + 2),
                    length: 2,
                    params: []
                };
            }

            if (['&', '*', '(', ')'].includes(next)) {
                if (start + 2 < len) {
                    const groupChar = data[start + 2];
                    let i = start + 3;
                    let valueStr = '';
                    let termFound = false;
                    while (i < len) {
                        const c = data[i];
                        if (/[a-zA-Z]/.test(c)) {
                            termFound = true;
                            break;
                        }
                        if (/[0-9.+-]/.test(c)) {
                            valueStr += c;
                        }
                        i++;
                    }
                    if (!termFound) {
                        return { incomplete: true };
                    }
                    const termChar = data[i];
                    const raw = data.substring(start, i + 1);
                    const valueNum = parseFloat(valueStr) || 0;
                    const mnemonic = `Esc${next}${groupChar}#${termChar}`;

                    let name = 'Parameterized Escape';
                    if (next === '*' && groupChar === 'c' && termChar === 'X') name = 'Picture Frame Width';
                    else if (next === '*' && groupChar === 'c' && termChar === 'Y') name = 'Picture Frame Height';

                    return {
                        type: 'PCL_ESCAPE',
                        name: name,
                        mnemonic: mnemonic,
                        raw: raw,
                        length: raw.length,
                        params: [valueNum]
                    };
                } else {
                    return { incomplete: true };
                }
            }
        } else {
            return { incomplete: true };
        }

        return null;
    }

    /**
     * Parse an HP-GL / HP-GL/2 command starting at `start` with the given `mnemonic`.
     * @private
     */
    _parseHPGLCommand(data, start, mnemonic) {
        const len = data.length;
        let i = start + 2;
        let paramStr = '';

        if (mnemonic === 'PE') {
            let foundSemicolon = false;
            while (i < len) {
                if (data[i] === ';') {
                    foundSemicolon = true;
                    i++;
                    break;
                }
                paramStr += data[i];
                i++;
            }
            if (!foundSemicolon) {
                return { incomplete: true };
            }
            const raw = data.substring(start, i);
            return {
                type: 'HPGL_COMMAND',
                name: 'Polyline Encoded',
                mnemonic: 'PE',
                raw: raw,
                length: raw.length,
                params: [],
                encodedData: paramStr
            };
        }

        if (mnemonic === 'LB') {
            let termFound = false;
            while (i < len) {
                // Support both literal byte 0x03 and common text escape representations of ETX
                if (this.labelTerminator === '\x03') {
                    if (data.startsWith('\\x03', i)) {
                        termFound = true;
                        i += 4;
                        break;
                    }
                    if (data.startsWith('\\u0003', i)) {
                        termFound = true;
                        i += 6;
                        break;
                    }
                    if (data.startsWith('\\03', i)) {
                        termFound = true;
                        i += 3;
                        break;
                    }
                }
                
                const char = data[i];
                if (char === this.labelTerminator || (this.labelTerminator === '\x03' && char === ';')) {
                    termFound = true;
                    i++;
                    break;
                }
                paramStr += char;
                i++;
            }
            if (!termFound) {
                return { incomplete: true };
            }
            const raw = data.substring(start, i);
            return {
                type: 'HPGL_COMMAND',
                name: 'Label',
                mnemonic: 'LB',
                raw: raw,
                length: raw.length,
                params: [],
                labelText: paramStr
            };
        }

        let foundTerminator = false;
        while (i < len) {
            const char = data[i];
            if (char === ';') {
                foundTerminator = true;
                i++;
                break;
            }

            if (i + 1 < len) {
                const nextTwo = data.substring(i, i + 2).toUpperCase();
                if (/^[A-Z]{2}$/.test(nextTwo)) {
                    foundTerminator = true;
                    break;
                }
            }

            paramStr += char;
            i++;
        }

        if (i >= len && !foundTerminator) {
            return { incomplete: true };
        }

        const raw = data.substring(start, i);
        const params = this._parseNumericParams(paramStr);
        const coordinates = this._processCoordinates(mnemonic, params);

        if (mnemonic === 'DT') {
            const cleanParam = paramStr.trim();
            if (cleanParam.length > 0) {
                this.labelTerminator = cleanParam[0];
            } else {
                this.labelTerminator = '\x03'; // Reset to default ETX
            }
        }

        return {
            type: 'HPGL_COMMAND',
            name: this._getHPGLCommandName(mnemonic),
            mnemonic: mnemonic,
            raw: raw,
            length: raw.length,
            params: params,
            ...(coordinates ? { coordinates } : {})
        };
    }

    /**
     * Process coordinates for plot commands (PA, PR, PD, PU) and perform Y-axis inversion.
     * @private
     */
    _processCoordinates(mnemonic, params) {
        if (!['PA', 'PR', 'PD', 'PU'].includes(mnemonic)) {
            return null;
        }

        const coords = [];
        const isRelative = (mnemonic === 'PR');

        for (let j = 0; j < params.length; j += 2) {
            if (j + 1 < params.length) {
                let x = params[j];
                let y = params[j + 1];

                // Coordinate transformation:
                // Under HP-GL/2 Standalone/Anchored modes, +Y goes UP.
                // If it is absolute plotting, we reverse the Y-axis calculation.
                // Reverse calculation flips Y relative to the picture frame height.
                if (!isRelative && (this.currentMode === 'HPGL2_STANDALONE' || this.currentMode === 'HPGL2_ANCHORED')) {
                    y = this.pictureFrameHeight - y;
                }

                coords.push({ x: Math.round(x), y: Math.round(y) });
            }
        }

        return coords;
    }

    /**
     * Parses a string containing comma/space delimited numbers.
     * @private
     */
    _parseNumericParams(str) {
        const params = [];
        const regex = /[-+]?[0-9]*\.?[0-9]+/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
            params.push(parseFloat(match[0]));
        }
        return params;
    }

    /**
     * Updates parser state in response to context/escape commands.
     * @private
     */
    _applyStateChange(escToken) {
        const m = escToken.mnemonic;
        if (m === 'EscE') {
            // Printer Reset
            this.reset();
        } else if (m === 'Esc%-1B') {
            // Enter Standalone HP-GL/2
            this.currentMode = 'HPGL2_STANDALONE';
        } else if (m === 'Esc%1B') {
            // Enter Anchored HP-GL/2
            this.currentMode = 'HPGL2_ANCHORED';
        } else if (m === 'Esc%0A') {
            // Return to Text/PCL Mode
            this.currentMode = 'PCL5';
        } else if (m === 'Esc%-12345X') {
            // Universal Exit Language
            this.currentMode = 'PCL5';
        } else if (m === 'Esc*c#X') {
            // Picture Frame Width (in decipoints)
            // Convert decipoints to PLUs
            const widthDecipoints = escToken.params[0] || 0;
            this.pictureFrameWidth = Math.round(HPGLMultiModeParser.decipointsToPLU(widthDecipoints));
        } else if (m === 'Esc*c#Y') {
            // Picture Frame Height (in decipoints)
            // Convert decipoints to PLUs
            const heightDecipoints = escToken.params[0] || 0;
            this.pictureFrameHeight = Math.round(HPGLMultiModeParser.decipointsToPLU(heightDecipoints));
        }
    }

    /**
     * Helper to return human-readable names for standard HP-GL commands.
     * @private
     */
    _getHPGLCommandName(mnemonic) {
        const names = {
            'IN': 'Initialize',
            'DF': 'Default Settings',
            'SP': 'Select Pen',
            'PU': 'Pen Up',
            'PD': 'Pen Down',
            'PA': 'Plot Absolute',
            'PR': 'Plot Relative',
            'IP': 'Input Scaling Points',
            'SC': 'Scale',
            'IW': 'Input Window',
            'CI': 'Circle',
            'AA': 'Arc Absolute',
            'AR': 'Arc Relative',
            'LB': 'Label',
            'DT': 'Define Terminator',
            'SI': 'Character Size Absolute',
            'SR': 'Character Size Relative',
            'DI': 'Character Direction Absolute',
            'DR': 'Character Direction Relative',
            'LT': 'Line Type',
            'VS': 'Velocity Select',
            'RO': 'Rotate Coordinate System',
            'FT': 'Fill Type',
            'LO': 'Label Origin',
            'ES': 'Extra Space',
            'WU': 'Width Unit',
            'CT': 'Chord Tolerance',
            'SM': 'Symbol Mode',
            'DP': 'Digitize Point',
            'OD': 'Output Digitized Point',
            'AC': 'Anchor Corner',
            'AP': 'Automatic Pen Operations',
            'BL': 'Buffer Label',
            'BP': 'Begin Plot',
            'BR': 'Bezier Relative',
            'BZ': 'Bezier Absolute',
            'CA': 'Designate Alternate Character Set',
            'CS': 'Designate Standard Character Set',
            'CC': 'Character Chord Angle',
            'CF': 'Character Fill Mode',
            'CP': 'Character Plot',
            'CR': 'Color Range',
            'DL': 'Define Downloadable Character',
            'DV': 'Vertical Label Direction',
            'FI': 'Select Primary Font',
            'FN': 'Select Secondary Font',
            'IR': 'Input Relative Scaling Points',
            'LA': 'Line Attribute',
            'LD': 'Language Definition',
            'LM': 'Label Mode',
            'PE': 'Polyline Encoded',
            'PG': 'Page Feed',
            'PP': 'Pixel Placement',
            'PS': 'Plot Size',
            'RF': 'Raster Fill Definition',
            'RP': 'Replot',
            'SB': 'Scalable or Bitmap Fonts',
            'SV': 'Screened Vectors',
            'OW': 'Output Window',
            'OL': 'Output Label Length',
            'OO': 'Output Options',
            'OF': 'Output Factors',
            'OG': 'Output Group',
            'OK': 'Output Key',
            'OT': 'Output Tool'
        };
        return names[mnemonic] || `HP-GL Mnemonic ${mnemonic}`;
    }
}

if (typeof window !== 'undefined') {
    window.HPGLMultiModeParser = HPGLMultiModeParser;
}
if (typeof module !== 'undefined') {
    module.exports = HPGLMultiModeParser;
}
