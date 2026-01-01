
const { OPLDecompiler } = require('./main.js');

const hexString = `
09 83 44 53 31 38 42 32 30 54 00 02 80 05 46 00
B8 00 1E 00 AA 01 02 00 00 00 00 00 00 00 00 0E
FF EA 09 FF FC 22 00 02 22 00 01 C2 8B AB 22 01
00 86 3E 80 0E FF F2 09 FF FC 22 00 01 22 00 01
C2 8B 86 80 0E FF E2 01 FF EA 01 FF F2 3C 80 0D
FF FA 09 FF FC 22 00 05 22 00 01 C2 8B 22 00 60
34 7F 00 FF FA 22 00 60 2C 7E 00 12 0E FF E2 01
FF E2 23 03 50 62 FE 3E 80 51 00 4B 00 FF FA 22
00 40 2C 7E 00 12 0E FF E2 01 FF E2 23 03 50 12
FF 3E 80 51 00 31 00 FF FA 22 00 20 2C 7E 00 11
0E FF E2 01 FF E2 23 02 25 FF 3E 80 51 00 18 00
FF FA 22 00 00 2C 7E 00 0E 0E FF E2 01 FF E2 23
02 50 FF 3E 80 01 FF E2 79 04 8A 44 53 31 38 42
32 30 54 3A 28 53 50 24 29 00 52 45 4D 20 43 6F
6E 76 65 72 74 20 44 53 31 38 42 32 30 20 53 63
72 61 74 63 68 20 70 61 64 20 74 6F 20 74 65 6D
70 65 72 61 74 75 72 65 00 00 52 45 4D 20 42 79
74 65 20 34 20 6F 66 20 74 68 65 20 73 63 72 61
74 63 68 20 70 61 64 20 6D 65 6D 6F 72 79 20 63
6F 6E 74 61 69 6E 73 20 74 68 65 20 63 6F 6E 66
69 67 75 72 61 74 69 6F 6E 20 72 65 67 69 73 74
65 72 00 00 52 45 4D 20 28 63 29 20 43 6F 70 79
72 69 67 68 74 20 32 30 32 34 20 6E 6F 66 69 74
6E 65 73 73 66 6F 72 70 75 72 70 6F 73 65 20 41
6C 6C 20 52 69 67 68 74 73 20 52 65 73 65 72 76
65 64 00 52 45 4D 20 52 65 76 69 73 69 6F 6E 20
3A 20 30 2E 31 00 52 45 4D 20 4D 6F 64 69 66 69
65 64 20 3A 20 4E 6F 74 46 69 74 46 6F 72 50 75
72 70 6F 73 65 00 52 45 4D 20 44 61 74 65 20 20
20 20 20 3A 20 33 30 20 4E 6F 76 20 32 30 32 34
00 00 52 45 4D 20 2B 2D 2D 2D 2D 2B 2D 2D 2D 2D
2B 2D 2D 2D 2D 2B 2D 2D 2D 2D 2B 2D 2D 2D 2D 2B
2D 2D 2D 2D 2B 2D 2D 2D 2D 2B 2D 2D 2D 2D 2B 00
52 45 4D 20 3A 20 42 30 20 3A 20 42 31 20 3A 20
42 32 20 3A 20 42 33 20 3A 20 42 34 20 3A 20 42
35 20 3A 20 42 36 20 3A 20 42 37 20 3A 00 52 45
4D 20 2B 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D
2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2D
2D 2D 2D 2D 2D 2D 2D 2D 2D 2D 2B 00 52 45 4D 20
42 30 20 3D 20 54 65 6D 70 65 72 61 74 75 72 65
20 4C 53 42 00 52 45 4D 20 42 31 20 3D 20 54 65
6D 70 65 72 61 74 75 72 65 20 4D 53 42 00 52 45
4D 20 42 32 20 3D 20 74 68 20 52 65 67 69 73 74
65 72 20 00 52 45 4D 20 42 33 20 3D 20 74 6C 20
52 65 67 69 73 74 65 72 20 00 52 45 4D 20 42 34
20 3D 20 43 6F 6E 66 69 67 75 72 61 74 69 6F 6E
20 52 65 67 69 73 74 65 72 00 52 45 4D 20 42 35
20 3D 20 52 65 73 65 72 76 65 64 20 28 24 46 46
29 00 52 45 4D 20 42 36 20 3D 20 52 65 73 65 72
76 65 64 00 52 45 4D 20 42 37 20 3D 20 52 65 73
65 72 76 65 64 20 28 24 31 30 29 00 52 45 4D 20
42 38 20 3D 20 43 52 43 00 00 4C 4F 43 41 4C 20
62 25 20 3A 20 52 45 4D 20 53 63 61 6C 69 6E 67
20 73 65 74 74 69 6E 67 00 4C 4F 43 41 4C 20 6C
2C 20 6D 20 3A 20 52 45 4D 20 4C 53 42 20 2D 20
4D 53 42 00 4C 4F 43 41 4C 20 74 20 3A 20 52 45
4D 20 20 43 61 6C 63 75 6C 61 74 65 64 20 74 65
6D 70 65 72 61 74 75 72 65 00 00 52 45 4D 20 56
65 72 69 66 79 20 63 68 65 63 6B 73 75 6D 00 00
6D 20 3D 20 46 4C 54 28 41 53 43 28 4D 49 44 24
28 53 50 24 2C 20 32 2C 20 31 29 29 29 20 2A 20
32 35 36 00 6C 20 3D 20 41 53 43 28 4D 49 44 24
28 53 50 24 2C 20 31 2C 20 31 29 29 00 74 20 3D
20 6D 20 2B 20 6C 00 00 52 45 4D 20 47 65 74 20
72 65 73 6F 6C 75 74 69 6F 6E 20 66 72 6F 6D 20
42 34 20 6F 66 20 74 68 65 20 53 63 72 61 74 63
68 20 50 61 64 20 42 34 20 62 69 74 73 20 35 20
61 6E 64 20 36 00 62 25 20 3D 20 41 53 43 28 4D
49 44 24 28 53 50 24 2C 20 35 2C 20 31 29 29 20
41 4E 44 20 39 36 00 00 52 45 4D 20 53 63 61 6C
65 20 74 68 65 20 72 61 77 20 76 61 6C 75 65 73
20 74 6F 20 74 65 6D 70 65 72 61 74 75 72 65 20
69 6E 20 44 65 67 2E 20 43 00 49 46 20 62 25 20
3D 20 39 36 00 20 20 74 20 3D 20 74 20 2A 20 30
2E 30 36 32 35 20 3A 20 52 45 4D 20 20 20 20 31
32 20 42 69 74 00 45 4C 53 45 49 46 20 62 25 20
3D 20 36 34 00 20 20 74 20 3D 20 74 20 2A 20 30
2E 31 32 35 20 3A 20 52 45 4D 20 20 20 20 20 31
31 20 42 69 74 00 45 4C 53 45 49 46 20 62 25 20
3D 20 33 32 00 20 20 74 20 3D 20 74 20 2A 20 30
2E 32 35 30 20 3A 20 52 45 4D 20 20 20 20 20 31
30 20 42 69 74 00 45 4C 53 45 49 46 20 62 25 20
3D 20 30 00 20 20 74 20 3D 20 74 20 2A 20 30 2E
35 30 30 20 3A 20 52 45 4D 20 20 20 20 20 20 39
20 42 69 74 00 45 4E 44 49 46 00 00 52 45 54 55
52 4E 20 74 00`;

// Clean up hex string and convert to buffer
const cleanHex = hexString.replace(/[\r\n\s]+/g, '');
const buffer = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

console.log(`Buffer created, size: ${buffer.length}`);

// Mimic CodeVisualizer slicing logic
function parseRec(d) {
    var off = 0; while (off < d.length && d[off] === 0) off++;
    var sync = -1; for (var i = off; i < d.length - 1; i++) { if (d[i] === 0x02 && d[i + 1] === 0x80) { sync = i; break; } }
    if (sync === -1) return (d.length >= 2 && (2 + ((d[0] << 8) | d[1]) <= d.length)) ? { valid: true, off: 0, len: (d[0] << 8) | d[1], base: 0 } : { valid: false };
    var lnOff = sync + 2; if (lnOff + 1 >= d.length) return { valid: false };
    return { valid: true, off: lnOff, len: (d[lnOff] << 8) | d[lnOff + 1], base: lnOff };
}

const struct = parseRec(buffer);
let slicedBuffer = buffer;

if (struct.valid) {
    console.log(`CodeVisualizer: Detected structure using sync at ${struct.base}`);
    const obLen = struct.len;
    const base = struct.base;
    // THIS is the suspicious slice:
    slicedBuffer = buffer.slice(base, base + obLen);
    console.log(`CodeVisualizer: Sliced buffer from ${base} length ${obLen}, first bytes:`, Array.from(slicedBuffer.slice(0, 5)).map(b => b.toString(16).padStart(2, '0')).join(' '));
} else {
    console.log("CodeVisualizer: Parse failed, using original");
}

// Initialize Decompiler
try {
    const decompiler = new OPLDecompiler();
    const result = decompiler.parseHeader(slicedBuffer, 0);
    // Mimic CodeVisualizer call to scanVariables
    decompiler.scanVariables(slicedBuffer, result);

    console.log("\n--- Header Info ---");
    console.log(`Global Table Size: ${result.globalTableSize}`);
    console.log(`Globals Array Length: ${result.globals ? result.globals.length : 'N/A'}`);

    if (result.globals && result.globals.length > 0) {
        console.log("\n--- Detected Globals ---");
        result.globals.forEach(g => {
            console.log(`Name: ${g.name}, Address: ${g.addr}, Type: ${g.type}`);
        });
    } else {
        console.log("\nNo explicitly defined globals found in header.");
    }

    if (result.externals && result.externals.length > 0) {
        console.log("\n--- Detected Externals ---");
        result.externals.forEach(e => {
            console.log(`Name: ${e.name}, Type: ${e.type}`);
        });
    } else {
        console.log("\nNo externals found in header.");
    }

} catch (e) {
    console.error("Decompiler error:", e);
}
