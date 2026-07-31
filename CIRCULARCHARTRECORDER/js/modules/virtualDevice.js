/**
 * LAYER 1 — VirtualDevice
 * Represents the internal state of the emulated chart recorder.
 * All data is held in a flat Uint16Array.
 */

class VirtualDevice {
    static REG = Object.freeze({
        DEVICE_STATUS:    0,
        PEN1_PV_HI:       1,
        PEN1_PV_LO:       2,
        PEN2_PV_HI:       3,
        PEN2_PV_LO:       4,
        CHART_SPEED:      5,
        PEN1_ALARM_HI:    6,
        PEN1_ALARM_LO:    7,
        PEN2_ALARM_HI:    8,
        PEN2_ALARM_LO:    9,
        ENG_UNITS:       10,
        SCALE_HI:        11,
        SCALE_LO:        12,
        PEN1_ALM_STATUS: 13,
        PEN2_ALM_STATUS: 14,
    });

    static REGISTER_COUNT = 15;
    static MAX_READ_COUNT = 64;

    constructor() {
        this._bank = new Uint16Array(VirtualDevice.REGISTER_COUNT);
        this._applyDefaults();
    }

    _readFloat32(idx) {
        const buf = new ArrayBuffer(4);
        const view = new DataView(buf);
        view.setUint16(0, this._bank[idx],     false);
        view.setUint16(2, this._bank[idx + 1], false);
        return view.getFloat32(0, false);
    }

    _writeFloat32(idx, value) {
        const buf = new ArrayBuffer(4);
        const view = new DataView(buf);
        view.setFloat32(0, value, false);
        this._bank[idx]     = view.getUint16(0, false);
        this._bank[idx + 1] = view.getUint16(2, false);
    }

    _applyDefaults() {
        const R = VirtualDevice.REG;
        this._bank[R.DEVICE_STATUS] = 0x0001;
        this._writeFloat32(R.PEN1_PV_HI, 25.0);
        this._writeFloat32(R.PEN2_PV_HI, 60.0);
        this._bank[R.CHART_SPEED]    = 20;
        this._bank[R.PEN1_ALARM_HI]  = 1500;
        this._bank[R.PEN1_ALARM_LO]  = 50;
        this._bank[R.PEN2_ALARM_HI]  = 1500;
        this._bank[R.PEN2_ALARM_LO]  = 50;
        this._bank[R.ENG_UNITS]      = 0;
        this._bank[R.SCALE_HI]       = 2000;
        this._bank[R.SCALE_LO]       = 0;
        this._bank[R.PEN1_ALM_STATUS]= 0;
        this._bank[R.PEN2_ALM_STATUS]= 0;
    }

    get pen1PV() { return this._readFloat32(VirtualDevice.REG.PEN1_PV_HI); }
    set pen1PV(v) { this._writeFloat32(VirtualDevice.REG.PEN1_PV_HI, v); this._updateAlarmStatus(); }

    get pen2PV() { return this._readFloat32(VirtualDevice.REG.PEN2_PV_HI); }
    set pen2PV(v) { this._writeFloat32(VirtualDevice.REG.PEN2_PV_HI, v); this._updateAlarmStatus(); }

    get chartSpeed() { return this._bank[VirtualDevice.REG.CHART_SPEED]; }
    set chartSpeed(v) { this._bank[VirtualDevice.REG.CHART_SPEED] = Math.max(0, Math.min(65535, Math.round(v))); }

    get engUnits() { return this._bank[VirtualDevice.REG.ENG_UNITS]; }
    set engUnits(v) { this._bank[VirtualDevice.REG.ENG_UNITS] = Math.max(0, Math.min(65535, Math.round(v))); }

    get scaleHi() { return this._bank[VirtualDevice.REG.SCALE_HI] / 10; }
    set scaleHi(v) { this._bank[VirtualDevice.REG.SCALE_HI] = Math.round(v * 10); }

    get scaleLo() { return this._bank[VirtualDevice.REG.SCALE_LO] / 10; }
    set scaleLo(v) { this._bank[VirtualDevice.REG.SCALE_LO] = Math.round(v * 10); }

    get anyAlarmActive() {
        return (this._bank[VirtualDevice.REG.PEN1_ALM_STATUS] !== 0) ||
               (this._bank[VirtualDevice.REG.PEN2_ALM_STATUS] !== 0);
    }

    _updateAlarmStatus() {
        const R = VirtualDevice.REG;
        const p1 = this.pen1PV;
        const p2 = this.pen2PV;
        const p1hi = this._bank[R.PEN1_ALARM_HI] / 10;
        const p1lo = this._bank[R.PEN1_ALARM_LO] / 10;
        const p2hi = this._bank[R.PEN2_ALARM_HI] / 10;
        const p2lo = this._bank[R.PEN2_ALARM_LO] / 10;

        let s1 = 0;
        if (p1 >= p1hi) s1 |= 0x01;
        if (p1 <= p1lo) s1 |= 0x02;
        this._bank[R.PEN1_ALM_STATUS] = s1;

        let s2 = 0;
        if (p2 >= p2hi) s2 |= 0x01;
        if (p2 <= p2lo) s2 |= 0x02;
        this._bank[R.PEN2_ALM_STATUS] = s2;
    }

    readRegisters(startReg, count) {
        if (startReg < 0 || count < 1 ||
            (startReg + count) > VirtualDevice.REGISTER_COUNT ||
            count > VirtualDevice.MAX_READ_COUNT) {
            return null;
        }
        return this._bank.slice(startReg, startReg + count);
    }

    writeSingleRegister(regAddr, value) {
        if (regAddr < 0 || regAddr >= VirtualDevice.REGISTER_COUNT) return false;
        this._bank[regAddr] = value & 0xFFFF;
        this._updateAlarmStatus();
        return true;
    }

    writeMultipleRegisters(startReg, values) {
        if (startReg < 0 || (startReg + values.length) > VirtualDevice.REGISTER_COUNT) return false;
        for (let i = 0; i < values.length; i++) {
            this._bank[startReg + i] = values[i] & 0xFFFF;
        }
        this._updateAlarmStatus();
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.VirtualDevice = VirtualDevice;
}
