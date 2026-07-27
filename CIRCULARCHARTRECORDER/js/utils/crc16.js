/**
 * ModbusCRC16 — Standalone, stateless CRC-16/ARC engine.
 * Polynomial: 0xA001 (reflected form of 0x8005, used by Modbus RTU).
 */
export class ModbusCRC16 {
    static _table = ModbusCRC16._buildTable();

    static _buildTable() {
        const table = new Uint16Array(256);
        for (let byteVal = 0; byteVal < 256; byteVal++) {
            let crc = byteVal;
            for (let bit = 0; bit < 8; bit++) {
                if (crc & 0x0001) {
                    crc = (crc >>> 1) ^ 0xA001;
                } else {
                    crc = crc >>> 1;
                }
            }
            table[byteVal] = crc;
        }
        return table;
    }

    /**
     * Compute the Modbus RTU CRC-16 over a byte array.
     * @param {Uint8Array|number[]} data
     * @param {number} [length]
     * @returns {Uint8Array} 2-byte result: [CRC_LO, CRC_HI]
     */
    static compute(data, length) {
        const byteCount = (length !== undefined) ? length : data.length;
        let crc = 0xFFFF;
        for (let i = 0; i < byteCount; i++) {
            const tableIndex = (crc ^ data[i]) & 0xFF;
            crc = (crc >>> 8) ^ ModbusCRC16._table[tableIndex];
        }
        return new Uint8Array([crc & 0xFF, (crc >>> 8) & 0xFF]);
    }

    /**
     * Validate trailing CRC bytes of a frame.
     * @param {Uint8Array} frame
     * @returns {boolean}
     */
    static validate(frame) {
        if (frame.length < 4) return false;
        const dataLength = frame.length - 2;
        const computed   = ModbusCRC16.compute(frame, dataLength);
        const rxCrcLo    = frame[dataLength];
        const rxCrcHi    = frame[dataLength + 1];
        return (computed[0] === rxCrcLo) && (computed[1] === rxCrcHi);
    }
}
