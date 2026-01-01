
const { OPLDecompiler } = require('./main.js');

const hexString = `
09 83 44 49 52 50 43 20 20 20 00 02 80 04 77 04
73 00 20 04 04 00 00 00 00 62 03 50 43 25 00 07
50 46 41 44 50 43 24 02 07 52 45 4D 4F 54 45 24
02 06 41 4D 4F 44 45 25 00 06 46 54 59 50 45 25
00 05 44 49 52 41 24 02 03 49 4E 24 02 05 53 49
43 48 25 00 05 50 43 57 52 25 00 06 44 49 52 50
43 24 02 06 44 49 52 50 41 24 02 05 44 49 53 4B
24 02 04 4C 57 4D 25 00 02 4D 25 00 00 00 00 00
53 00 00 22 25 80 20 00 22 00 00 20 00 22 00 08
20 00 22 00 01 20 00 22 00 00 20 00 22 00 01 20
00 22 00 01 32 20 00 22 00 01 32 20 00 22 00 01
32 20 00 22 00 01 32 20 00 22 00 01 32 20 00 22
00 01 32 20 00 22 00 01 32 20 00 22 00 01 20 00
22 00 02 20 00 20 0F 7D 04 4C 53 45 54 84 14 FF
FC 22 00 01 7F 4E 22 00 01 22 00 01 4C 24 0F 20
20 20 20 4C 45 53 45 20 50 43 2D 20 20 20 71 22
00 01 22 00 02 4C 09 FF FA 09 FF F8 4B 24 06 20
20 20 20 20 20 4B 22 00 10 C0 71 73 53 02 F3 20
00 7D 07 58 46 43 4C 4F 53 45 84 09 FF FA 09 FF
F8 4B 20 02 07 FF F6 20 00 07 FF F4 20 00 20 03
7D 06 58 46 4F 50 45 4E 84 20 00 7D 05 58 46 45
4F 46 23 02 00 00 3A 7E 00 05 51 02 A6 16 FF F2
22 00 0C 20 00 20 01 7D 06 58 46 47 45 54 24 81
09 FF F2 24 00 4A 7E 00 4E 00 FF E0 22 00 00 2C
7E 00 41 22 00 01 22 00 01 4C 24 10 20 20 20 20
20 20 44 41 54 45 49 20 20 20 20 20 71 22 00 01
22 00 02 4C 24 10 20 6E 69 63 68 74 20 67 65 66
75 6E 64 65 6E 20 71 22 00 14 32 54 51 02 44 51
00 05 51 00 31 0D FF E0 22 00 01 7F 22 00 01 22
00 01 4C 24 04 4E 41 4D 3D 71 09 FF F2 24 0F 20
20 20 20 20 20 20 20 20 20 20 20 20 20 4B 22
00 10 C0 71 22 00 01 22 00 02 4C 24 10 57 41 45
48 4C 45 20 46 2C 50 2C 20 20 45 58 45 71 22 00
64 32 54 16 FF F0 91 B8 81 09 FF F0 24 01 50 4A
7E 00 97 14 FF EE 22 00 01 7F 14 FF EC 22 00 01
7F 16 FF EA 09 FF F2 81 16 FF E8 09 FF E6 09 FF
F2 09 FF F2 96 22 00 04 2E C0 4B 81 20 00 7D 07
58 46 43 4C 4F 53 45 84 14 FF E4 22 00 01 7F 20
00 7D 08 4C 41 55 46 57 45 52 4B 84 20 00 7D 06
57 52 52 44 50 43 84 07 FF E2 22 00 FF 2C 7E 00
05 51 01 7F 20 00 7D 07 58 46 43 4C 4F 53 45 84
09 FF FA 09 FF F8 4B 20 02 07 FF F6 20 00 07 FF
F4 20 00 20 03 7D 06 58 46 4F 50 45 4E 84 16 FF
F0 09 FF EA 81 51 00 64 09 FF F0 24 01 46 4A 7E
01 00 22 00 01 22 00 01 4C 24 0F 46 49 4E 44 45
20 50 52 4F 47 52 41 4D 4D 20 71 22 00 01 22 00
02 4C 24 05 4E 41 4D 45 3D 71 16 FF F0 09 FF F2
81 22 00 06 22 00 02 4C 22 00 01 6A 16 FF F0 5A
6B 09 FF F0 24 00 4A 7E 00 09 22 00 01 6A 51 00
DB 09 FF F0 24 00 49 7E 00 A8 20 00 7D 07 58 46
43 4C 4F 53 45 84 09 FF FA 09 FF F8 4B 20 02 07
FF F6 20 00 07 FF F4 20 00 20 03 7D 06 58 46 4F
50 45 4E 84 20 00 7D 05 58 46 45 4F 46 23 02 00
00 3A 7E 00 34 4E 22 00 01 22 00 01 4C 09 FF F0
71 22 00 01 22 00 02 4C 24 10 4E 49 43 48 54 20
20 47 45 46 55 4E 44 45 4E 20 71 22 00 96 32 54
22 00 01 6A 51 FD 59 16 FF F2 22 00 0C 20 00 20
01 7D 06 58 46 47 45 54 24 81 09 FF F2 24 00 4A
7E 00 05 51 FF B1 09 FF F2 09 FF F0 09 FF F2 96
C0 4A 7E 00 0A 4E 22 00 01 6A 51 FD B5 51 FF 86
09 FF F0 8B 22 00 01 2C 7E 00 0C 14 FF E2 22 00
FF 7F 51 00 2E 09 FF F0 8B 22 00 02 2C 7E 00 0C
14 FF E2 22 00 FF 7F 51 00 19 20 00 7D 05 58 46
45 4F 46 23 02 00 00 3A 7E 00 05 51 FD 20 51 FD
4A 20 00 7D 07 58 46 43 4C 4F 53 45 84 5A 5C 7B
53 00 00 22 00 32 32 54 22 00 01 22 00 01 4C 24
07 46 45 48 4C 45 52 3D 71 8E 6F 8E 22 00 C1 2C
8E 22 00 BC 2C 35 8E 22 00 BA 2C 35 7E 00 37 22
00 01 22 00 01 4C 24 10 20 20 20 20 20 46 65 68
6C 65 72 20 20 20 20 20 71 22 00 01 22 00 02 4C
24 10 50 43 20 6E 69 63 68 74 20 62 65 72 65 69
74 2E 71 73 14 FF E2 22 00 FF 7F 22 00 32 32 54
51 FF 80 7B 00 00`;

// Clean up hex string and convert to buffer
const cleanHex = hexString.replace(/[\r\n\s]+/g, '');
const buffer = new Uint8Array(cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

console.log(`Buffer created, size: ${buffer.length}`);

// Initialize Decompiler
try {
    const decompiler = new OPLDecompiler();
    const result = decompiler.getRawAnalysis(buffer, "DIRPC");

    console.log("\n--- Header Info ---");
    console.log(`Global Table Size: ${result.header ? result.header.globalTableSize : 'N/A'}`);
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
