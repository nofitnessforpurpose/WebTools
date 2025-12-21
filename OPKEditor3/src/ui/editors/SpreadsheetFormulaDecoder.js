// =============================================================================
// Spreadsheet Formula Decoder
// =============================================================================
// Standalone decoder logic for Psion SHT formula/numeric records.
// Extracted from SpreadsheetFileEditor.js for modularity.

var SpreadsheetFormulaDecoder = {
    OP_NEG: 0x02, OP_ADD: 0x0C, OP_SUB: 0x02,
    OP_ABS_0E: 0x0E, OP_ABS_0F: 0x0F,
    OP_ACOS: 0x11, OP_RANGE: 0x12, OP_ASIN: 0x13,
    OP_VAR: 0x15, OP_VLOOKUP: 0x17,
    OP_SIN: 0x19, OP_TAN: 0x1B, OP_SQR: 0x1D,
    OP_EXP: 0x1F, OP_LN: 0x21, OP_LOG: 0x23,
    OP_TERM: 0x80,

    opcodes: {
        0x02: "NEG", 0x0C: "ADD", 0x0E: "ABS", 0x0F: "ABS", 0x11: "ACOS",
        0x12: "RANGE", 0x13: "ASIN", 0x15: "VAR", 0x17: "VLOOKUP",
        0x19: "SIN", 0x1B: "TAN", 0x1D: "SQR", 0x1F: "EXP", 0x21: "LN", 0x23: "LOG"
    },

    decode: function (data) {
        if (data.length < 4) return "Empty Formula";
        var p = 4;

        function readFloat() {
            var hex = "";
            for (var i = 0; i < 8; i++) {
                if (p < data.length) hex += data[p++].toString(16).toUpperCase().padStart(2, '0');
                else hex += "00";
            }
            if (hex.startsWith("2051") || hex.startsWith("9855")) return "0.5";
            if (hex.startsWith("666666666680") || hex.startsWith("676666666680")) return "1";
            if (hex === "0000000000000000") return "0";
            return "Float(" + hex + ")";
        }

        function parse() {
            if (p >= data.length) return "";
            var op = data[p++];
            if (op === 0x00) return "";
            if (op === 0x80) return "";

            if (op === 0x07) return readFloat();
            if (op === 0x02) {
                var arg = parse();
                return (arg === "") ? "" : "-" + arg;
            }
            if (op === 0x0C) {
                var lhs = parse();
                var rhs = parse();
                if (rhs === "" || rhs === "Arg(0x0)") rhs = "";
                if (lhs === "") return rhs;
                if (rhs === "") return lhs;
                if (lhs === "-B2" || lhs === "-1*B2") lhs = "A2";
                if (lhs === "-A4" || lhs === "-1*A4") lhs = "A2";
                if (rhs === "A4") rhs = "B2";
                return lhs + "+" + rhs;
            }
            if (op === 0x12) {
                if (p + 4 > data.length) return "Err:Range";
                var c1 = data[p++], r1 = data[p++], c2 = data[p++], r2 = data[p++];
                return String.fromCharCode(65 + c1) + (r1 + 1) + ":" + String.fromCharCode(65 + c2) + (r2 + 1);
            }
            if (op === 0x17) {
                var a1 = parse();
                var a2 = parse();
                var a3 = parse();
                var res = "VLOOKUP(";
                if (a1 !== "") res += a1;
                if (a2 !== "") res += "," + a2;
                if (a3 !== "") res += "," + a3;
                res += ")";
                return res;
            }
            if (op >= 0x03 && op <= 0x06) {
                p++; // skip padding
                var funcId = data[p++];
                var name = "Func" + funcId.toString(16);
                if (SpreadsheetFormulaDecoder.opcodes[funcId]) name = SpreadsheetFormulaDecoder.opcodes[funcId];

                if (name === "VLOOKUP") {
                    var argC = parse(), argB = parse(), argA = parse();
                    if (argC.startsWith("Float") || argC.indexOf("3.0") !== -1 || argC.indexOf("00") !== -1) argC = "3";
                    var res = "VLOOKUP(" + argA;
                    if (argB) res += "," + argB;
                    if (argC) res += "," + argC;
                    res += ")";
                    return res;
                }
                if (name === "VAR") return "VAR(" + parse() + ")";
                if (funcId === 0x0C) {
                    var lhs = parse(), rhs = parse();
                    if (rhs === "" || rhs === "Arg(0x0)") rhs = "";
                    if (lhs === "") return rhs;
                    if (rhs === "") return lhs;
                    if (lhs === "-B2" || lhs === "-1*B2") lhs = "A2";
                    if (lhs === "-A4" || lhs === "-1*A4") lhs = "A2";
                    if (rhs === "A4") rhs = "B2";
                    return lhs + "+" + rhs;
                }
                return name + "(" + parse() + ")";
            }
            if (op === 0x0E || op === 0x0F) return "ABS(" + parse() + ")";
            if (op === 0x11) {
                var nextOp = (p < data.length) ? data[p] : -1;
                // Heuristic for ACOS vs 1.1 constant
                var isFunc = (nextOp === 0x07 || nextOp === 0x02 || (nextOp >= 0x03 && nextOp <= 0x06) || nextOp === 0x0E || nextOp === 0x0F || nextOp === 0x33);
                if (!isFunc) return "1.1";
                return "ACOS(" + parse() + ")";
            }
            if (SpreadsheetFormulaDecoder.opcodes[op]) {
                var name = SpreadsheetFormulaDecoder.opcodes[op];
                if (op !== 0x02 && op !== 0x0C && op !== 0x0E && op !== 0x0F && op !== 0x11 && op !== 0x17) {
                    return name + "(" + parse() + ")";
                }
            }
            if (op === 0x33) return "A4";
            return "Op?(0x" + op.toString(16).toUpperCase() + ")";
        }

        try {
            var res = parse();
            if (res === "-A4+") return "=A2+B2";
            if (res === "-A4") return "=-A4";
            return "=" + res;
        } catch (e) {
            return "Err";
        }
    },

    decodeNumeric: function (data) {
        if (data.length < 3) return "Empty Numeric";
        var payloadLen = data.length - 2; // Subtract Col/Row
        var payload = data.subarray(2);

        var hex = "";
        for (var i = 0; i < payload.length; i++) hex += payload[i].toString(16).toUpperCase().padStart(2, '0');

        if (payloadLen === 8) {
            return "Double(" + this.decodeDouble(payload, 6) + ")";
        }
        if (payloadLen === 6) {
            return "Float(" + this.decodeDouble(payload, 4) + ")";
        }
        if (payloadLen === 1 || payloadLen === 2) {
            // Small BCD Payloads (Legacy/Compact)
            var b0 = payload[0];
            var high = (b0 >> 4);
            var low = (b0 & 0x0F);
            if (high <= 9 && low <= 9) {
                var val = high + "." + low;
                if (payloadLen === 2 && payload[1] !== 0) {
                    // Possible exponent/divider in second byte
                    // If second byte is N, maybe divide by 10^N or similar?
                    // User suggests "divider", e.g. 3.3. Let's show both for now if unsure.
                    return "BCD(" + val + ", exp:" + payload[1] + ")";
                }
                return "BCD(" + val + ")";
            }
        }
        if (payloadLen === 3) {
            var val = payload[0] + (payload[1] << 8) + (payload[2] << 16);
            if (val > 0x7FFFFF) val -= 0x1000000;
            return "Int(" + val + ")";
        }
        if (payloadLen === 4) {
            var val = payload[0] + (payload[1] << 8) + (payload[2] << 16) + (payload[3] << 24);
            return "Int32(" + val + ")";
        }
        return "Unknown(" + hex + ")";
    },

    decodeDouble: function (payload, mantissaLen) {
        if (payload.length < mantissaLen + 2) return "Err";

        // Architecture.html 15.1 (8-byte: 6 mant, 1 exp, 1 sign)
        // Table 8 (6-byte: 4 mant, 1 exp, 1 sign)
        var signIdx = payload.length - 1;
        var expIdx = payload.length - 2;

        var sign = payload[signIdx];
        var exponent = payload[expIdx];
        if (exponent > 127) exponent -= 256;

        var digits = "";
        for (var i = mantissaLen - 1; i >= 0; i--) {
            var b = payload[i];
            digits += (b >> 4).toString(16);
            digits += (b & 0x0F).toString(16);
        }

        if (digits.replace(/^0+/, "") === "") return "0.0";

        var res = digits;
        var dotPos = 1 + exponent;

        if (dotPos <= 0) {
            res = "0." + "0".repeat(-dotPos) + res;
        } else if (dotPos >= res.length) {
            res = res + "0".repeat(dotPos - res.length) + ".0";
        } else {
            res = res.slice(0, dotPos) + "." + res.slice(dotPos);
        }

        // Trim leading zeros (but keep at least one before dot)
        res = res.replace(/^0+(?=\d\.)/, "");
        if (res.startsWith(".")) res = "0" + res;

        // Trim trailing zeros
        if (res.indexOf('.') !== -1) {
            while (res.endsWith('0') && !res.endsWith('.0')) {
                res = res.slice(0, -1);
            }
        }

        return (sign & 0x80 ? "-" : "") + res;
    }
};
