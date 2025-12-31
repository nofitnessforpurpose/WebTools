'use strict';

/**
 * Parses an Intel HEX string into a Uint8Array representing the memory image.
 * Fills gaps with 0xFF.
 * @param {string} text - The Intel HEX file content.
 * @returns {Uint8Array} - The binary memory image.
 */
function parseIntelHexToBinary(text) {
    const lines = text.split(/\r?\n/);
    const records = [];

    let upperLinear = 0;
    let upperSegment = 0;
    let minAddr = Infinity;
    let maxAddr = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        if (line[0] !== ":") throw new Error(`Line ${i + 1}: Missing ':'`);

        line = line.slice(1);
        if (line.length < 10)
            throw new Error(`Line ${i + 1}: Too short`);

        const count = parseInt(line.slice(0, 2), 16);
        const addr = parseInt(line.slice(2, 6), 16);
        const type = parseInt(line.slice(6, 8), 16);

        const dataHex = line.slice(8, 8 + count * 2);
        const checksum = parseInt(line.slice(8 + count * 2, 10 + count * 2), 16);

        // Convert data
        const data = new Uint8Array(count);
        for (let b = 0; b < count; b++) {
            const byteStr = dataHex.slice(b * 2, b * 2 + 2);
            const val = parseInt(byteStr, 16);
            if (Number.isNaN(val)) throw new Error(`Line ${i + 1}: Bad hex`);
            data[b] = val;
        }

        // Validate checksum
        let sum = count + (addr >> 8) + (addr & 0xFF) + type;
        for (let b of data) sum += b;
        sum = (sum + checksum) & 0xFF;
        if (sum !== 0) throw new Error(`Line ${i + 1}: checksum error`);

        if (type === 0x00) {
            // DATA RECORD
            // Calculate absolute address based on current extended address
            const base = (upperLinear << 16) + (upperSegment << 4);
            const absolute = base + addr;

            records.push({ address: absolute, data });
            minAddr = Math.min(minAddr, absolute);
            maxAddr = Math.max(maxAddr, absolute + data.length);
        }
        else if (type === 0x01) {
            break; // EOF
        }
        else if (type === 0x02) {
            // Extended segment address
            upperSegment = parseInt(dataHex, 16);
            upperLinear = 0; // Reset linear offset when segment is used (though usually mutually exclusive)
        }
        else if (type === 0x04) {
            // Extended linear address
            upperLinear = parseInt(dataHex, 16);
            upperSegment = 0;
        }
    }

    if (minAddr === Infinity) return new Uint8Array(0);

    // Build binary image
    // Ideally minAddr should be 0 for a full EPROM image, but we'll respect the file.
    // However, for OPK purposes, we likely want the image to start at 0 if it's a pack.
    // The requirements say "Intel HEX files will contain only the EPROM memory image."
    // We will assume the file represents the memory starting at address 0 or the lowest address found.
    // Given it's an EPROM image, it likely starts at 0.
    // Let's normalize to 0 if minAddr > 0? Or just create a buffer large enough?
    // If we just return the data from minAddr to maxAddr, we might lose the offset if it's important.
    // But OPK files are just raw dumps. If the HEX starts at 0x0000, great.
    // If it starts at 0x8000, is that the start of the pack?
    // For safety, let's assume the output buffer starts at minAddr 0 if possible,
    // or we just return the contiguous block defined by the hex.
    // Re-reading requirements: "Map record data directly into the EPROM buffer used by the existing .opk logic."
    // The .opk logic expects a raw binary.
    // If I have a hex at 0x0000, it maps to index 0.
    // If I have a hex at 0x0100, index 0-0xFF should be 0xFF.

    const size = maxAddr; // Size must cover up to the last byte
    const out = new Uint8Array(size);
    out.fill(0xFF); // Fill gaps with 0xFF

    for (const r of records) {
        out.set(r.data, r.address);
    }

    return out;
}

/**
 * Converts a Uint8Array to an Intel HEX string.
 * @param {Uint8Array} binary - The binary data.
 * @returns {string} - The Intel HEX string.
 */
function createIntelHexFromBinary(binary) {
    let output = "";
    let currentUpperLinear = 0;
    const dataSize = 16; // Standard 16 bytes per line

    for (let addr = 0; addr < binary.length; addr += dataSize) {
        // Check if we need to emit an extended linear address record
        const upper = (addr >> 16) & 0xFFFF;
        if (upper !== currentUpperLinear) {
            currentUpperLinear = upper;
            output += createHexRecord(2, 0, 0x04, [(upper >> 8) & 0xFF, upper & 0xFF]);
        }

        const count = Math.min(dataSize, binary.length - addr);
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(binary[addr + i]);
        }

        output += createHexRecord(count, addr & 0xFFFF, 0x00, data);
    }

    // EOF Record
    output += ":00000001FF\r\n";

    return output;
}

function createHexRecord(count, addr, type, data) {
    let line = "";
    let sum = count + (addr >> 8) + (addr & 0xFF) + type;

    line += toHex(count, 2);
    line += toHex(addr, 4);
    line += toHex(type, 2);

    for (let b of data) {
        line += toHex(b, 2);
        sum += b;
    }

    const checksum = (0x100 - (sum & 0xFF)) & 0xFF;
    line += toHex(checksum, 2);

    return ":" + line + "\r\n";
}

function toHex(val, digits) {
    return val.toString(16).toUpperCase().padStart(digits, "0");
}
