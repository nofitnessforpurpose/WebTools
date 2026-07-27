import { ModbusCRC16 } from '../utils/crc16.js';

/**
 * LAYER 3 — ModbusParser
 * Parses an accumulated Modbus RTU frame byte buffer and returns a binary
 * response payload to be written to the serial port.
 */
export class ModbusParser {
    static FC_READ_HOLDING_REGISTERS     = 0x03;
    static FC_WRITE_SINGLE_REGISTER      = 0x06;
    static FC_WRITE_MULTIPLE_REGISTERS   = 0x10;

    static EX_ILLEGAL_FUNCTION           = 0x01;
    static EX_ILLEGAL_DATA_ADDRESS       = 0x02;
    static EX_ILLEGAL_DATA_VALUE         = 0x03;

    constructor(device, stationAddress, stats) {
        this._device = device;
        this._stationAddr = stationAddress;
        this._stats = stats;
        this._protocol = 'ascii';
    }

    processFrame(frame) {
        this._stats.totalRx++;

        if (this._protocol === 'ascii') {
            return this._processAsciiFrame(frame);
        }

        if (frame.length < 4) {
            return null;
        }

        const BYTE_ADDR = 0;
        const rxAddr = frame[BYTE_ADDR];
        if (rxAddr !== this._stationAddr) {
            return null;
        }

        if (!ModbusCRC16.validate(frame)) {
            this._stats.crcErrors++;
            return null;
        }

        this._stats.validFrames++;

        const BYTE_FC   = 1;
        const funcCode  = frame[BYTE_FC];

        switch (funcCode) {
            case ModbusParser.FC_READ_HOLDING_REGISTERS:
                return this._handleFC03(frame);
            case ModbusParser.FC_WRITE_SINGLE_REGISTER:
                return this._handleFC06(frame);
            case ModbusParser.FC_WRITE_MULTIPLE_REGISTERS:
                return this._handleFC10(frame);
            default:
                this._stats.unknownFC++;
                return this._buildException(rxAddr, funcCode, ModbusParser.EX_ILLEGAL_FUNCTION);
        }
    }

    _handleFC03(frame) {
        const BYTE_REG_HI  = 2;
        const BYTE_REG_LO  = 3;
        const BYTE_CNT_HI  = 4;
        const BYTE_CNT_LO  = 5;

        if (frame.length < 8) {
            return this._buildException(frame[0], 0x03, ModbusParser.EX_ILLEGAL_DATA_VALUE);
        }

        const startReg = (frame[BYTE_REG_HI] << 8) | frame[BYTE_REG_LO];
        const regCount = (frame[BYTE_CNT_HI] << 8) | frame[BYTE_CNT_LO];

        const registers = this._device.readRegisters(startReg, regCount);
        if (!registers) {
            this._stats.fc03++;
            return this._buildException(frame[0], 0x03, ModbusParser.EX_ILLEGAL_DATA_ADDRESS);
        }

        this._stats.fc03++;

        const byteCount  = regCount * 2;
        const RESP_OVERHEAD = 3;
        const response = new Uint8Array(RESP_OVERHEAD + byteCount + 2);
        let wi = 0;

        response[wi++] = frame[0];
        response[wi++] = 0x03;
        response[wi++] = byteCount;

        for (let i = 0; i < regCount; i++) {
            response[wi++] = (registers[i] >>> 8) & 0xFF;
            response[wi++] =  registers[i]        & 0xFF;
        }

        const crc = ModbusCRC16.compute(response, wi);
        response[wi++] = crc[0];
        response[wi++] = crc[1];

        return response;
    }

    _handleFC06(frame) {
        const BYTE_REG_HI  = 2;
        const BYTE_REG_LO  = 3;
        const BYTE_VAL_HI  = 4;
        const BYTE_VAL_LO  = 5;

        if (frame.length < 8) {
            return this._buildException(frame[0], 0x06, ModbusParser.EX_ILLEGAL_DATA_VALUE);
        }

        const regAddr = (frame[BYTE_REG_HI] << 8) | frame[BYTE_REG_LO];
        const value   = (frame[BYTE_VAL_HI] << 8) | frame[BYTE_VAL_LO];

        if (!this._device.writeSingleRegister(regAddr, value)) {
            return this._buildException(frame[0], 0x06, ModbusParser.EX_ILLEGAL_DATA_ADDRESS);
        }

        this._stats.fc06++;

        const response = new Uint8Array(8);
        response[0] = frame[0];
        response[1] = 0x06;
        response[2] = frame[2];
        response[3] = frame[3];
        response[4] = frame[4];
        response[5] = frame[5];
        const crc   = ModbusCRC16.compute(response, 6);
        response[6] = crc[0];
        response[7] = crc[1];

        return response;
    }

    _handleFC10(frame) {
        const BYTE_REG_HI  = 2;
        const BYTE_REG_LO  = 3;
        const BYTE_CNT_HI  = 4;
        const BYTE_CNT_LO  = 5;
        const BYTE_BYTECNT = 6;
        const DATA_START   = 7;

        if (frame.length < 9) {
            return this._buildException(frame[0], 0x10, ModbusParser.EX_ILLEGAL_DATA_VALUE);
        }

        const startReg  = (frame[BYTE_REG_HI]  << 8) | frame[BYTE_REG_LO];
        const regCount  = (frame[BYTE_CNT_HI]  << 8) | frame[BYTE_CNT_LO];
        const byteCount =  frame[BYTE_BYTECNT];

        if (byteCount !== regCount * 2 || frame.length < DATA_START + byteCount + 2) {
            return this._buildException(frame[0], 0x10, ModbusParser.EX_ILLEGAL_DATA_VALUE);
        }

        const values = new Uint16Array(regCount);
        for (let i = 0; i < regCount; i++) {
            const hi = frame[DATA_START + i * 2];
            const lo = frame[DATA_START + i * 2 + 1];
            values[i] = (hi << 8) | lo;
        }

        if (!this._device.writeMultipleRegisters(startReg, values)) {
            return this._buildException(frame[0], 0x10, ModbusParser.EX_ILLEGAL_DATA_ADDRESS);
        }

        this._stats.fc16++;

        const response = new Uint8Array(8);
        response[0] = frame[0];
        response[1] = 0x10;
        response[2] = frame[2];
        response[3] = frame[3];
        response[4] = frame[4];
        response[5] = frame[5];
        const crc   = ModbusCRC16.compute(response, 6);
        response[6] = crc[0];
        response[7] = crc[1];

        return response;
    }

    _processAsciiFrame(frame) {
        const rawText = new TextDecoder('utf-8').decode(frame);
        const dollarIdx = rawText.indexOf('$');
        if (dollarIdx === -1) return null;

        const text = rawText.substring(dollarIdx).trim();
        const d = this._device;
        const encodeText = (str) => new TextEncoder().encode(str + '\r\n');

        let cmd = text.substring(1).trim();

        const colonIdx = cmd.indexOf(':');
        if (colonIdx > 0 && colonIdx <= 3) {
            const addrNum = parseInt(cmd.substring(0, colonIdx), 10);
            if (!isNaN(addrNum) && addrNum !== this._stationAddr) {
                return null;
            }
            cmd = cmd.substring(colonIdx + 1).trim();
        }

        if (cmd.toUpperCase().startsWith('PV?')) {
            this._stats.validFrames++;
            this._stats.fc03++;
            const p1 = d.pen1PV.toFixed(2);
            const p2 = d.pen2PV.toFixed(2);
            const p3 = (d.pen3PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.55)).toFixed(2);
            const p4 = (d.pen4PV || (d.scaleLo + (d.scaleHi - d.scaleLo) * 0.75)).toFixed(2);
            return encodeText(`*PV:P1=${p1},P2=${p2},P3=${p3},P4=${p4}`);
        }

        if (cmd.includes('=')) {
            let updated = false;
            const pairs = cmd.split(',');
            for (const pair of pairs) {
                const parts = pair.split('=');
                if (parts.length === 2) {
                    const key = parts[0].trim().toUpperCase();
                    const val = parseFloat(parts[1].trim());
                    if (!isNaN(val)) {
                        if (key === 'P1' || key === 'PEN1') { d.pen1PV = val; updated = true; }
                        if (key === 'P2' || key === 'PEN2') { d.pen2PV = val; updated = true; }
                        if (key === 'P3' || key === 'PEN3') { d.pen3PV = val; updated = true; }
                        if (key === 'P4' || key === 'PEN4') { d.pen4PV = val; updated = true; }
                    }
                }
            }
            if (updated) {
                this._stats.validFrames++;
                this._stats.fc06++;
                return encodeText('*OK');
            }
        }

        this._stats.crcErrors++;
        return encodeText('*ERR:INVALID');
    }

    _buildException(address, funcCode, exceptionCode) {
        const response = new Uint8Array(5);
        response[0] = address;
        response[1] = funcCode | 0x80;
        response[2] = exceptionCode;
        const crc = ModbusCRC16.compute(response, 3);
        response[3] = crc[0];
        response[4] = crc[1];
        return response;
    }
}
