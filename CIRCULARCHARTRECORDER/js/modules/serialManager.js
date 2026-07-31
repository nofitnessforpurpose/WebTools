/**
 * LAYER 4 — ChartRecorderEmulator
 * Top-level Web Serial manager & Modbus/ASCII frame orchestrator.
 */
class ChartRecorderEmulator {
    constructor(options = {}) {
        this._stationAddress   = (options.stationAddress !== undefined)   ? options.stationAddress   : 1;
        this._baudRate         = (options.baudRate !== undefined)         ? options.baudRate         : 9600;
        this._dataBits         = (options.dataBits !== undefined)         ? options.dataBits         : 8;
        this._stopBits         = (options.stopBits !== undefined)         ? options.stopBits         : 1;
        this._parity           = (options.parity !== undefined)           ? options.parity           : 'none';
        this._interFrameTimeout= (options.interFrameTimeout !== undefined)? options.interFrameTimeout: 10;

        this._onStateChange    = (options.onStateChange !== undefined)    ? options.onStateChange    : (() => {});
        this._onFrameProcessed = (options.onFrameProcessed !== undefined) ? options.onFrameProcessed : (() => {});

        this._stats = {
            totalRx:      0,
            validFrames:  0,
            crcErrors:    0,
            fc03:         0,
            fc06:         0,
            fc16:         0,
            unknownFC:    0,
        };

        this.device = new VirtualDevice();
        this._parser = new ModbusParser(this.device, this._stationAddress, this._stats);

        this._port   = null;
        this._reader = null;
        this._writer = null;

        this._running = false;
        this._rxBuffer    = new Uint8Array(512);
        this._rxBufLength = 0;

        this._flowControl = (options.flowControl !== undefined) ? options.flowControl : 'none';
        this._hwFlowControl = (options.hwFlowControl !== undefined) ? options.hwFlowControl : false;
        this._frameTimer  = null;
    }

    async connect() {
        if (!('serial' in navigator)) {
            this._onStateChange('unsupported');
            return;
        }

        if (this._running) {
            await this.disconnect();
            return;
        }

        try {
            this._port = await navigator.serial.requestPort();

            await this._port.open({
                baudRate: this._baudRate,
                dataBits: this._dataBits,
                stopBits: this._stopBits,
                parity:   this._parity,
                flowControl: (this._hwFlowControl ? 'hardware' : 'none'),
            });

            this._running = true;
            this._onStateChange('connected');

            this._writer = this._port.writable.getWriter();
            this._reader = this._port.readable.getReader();

            this._readLoop();

        } catch (err) {
            if (err.name !== 'NotFoundError') {
                console.error('[CR-EMU] connect() error:', err);
                this._onStateChange('error');
            } else {
                this._onStateChange('idle');
            }
            this._port   = null;
            this._reader = null;
            this._writer = null;
            this._running = false;
        }
    }

    async disconnect() {
        this._running = false;
        clearTimeout(this._frameTimer);
        this._frameTimer = null;

        try {
            if (this._reader) { this._reader.cancel(); this._reader.releaseLock(); }
        } catch (_) {}

        try {
            if (this._writer) { this._writer.releaseLock(); }
        } catch (_) {}

        try {
            if (this._port) { await this._port.close(); }
        } catch (_) {}

        this._reader = null;
        this._writer = null;
        this._port   = null;
        this._rxBufLength = 0;
        this._onStateChange('disconnected');
    }

    setStationAddress(addr) {
        this._stationAddress = Math.max(1, Math.min(247, addr));
        this._parser._stationAddr = this._stationAddress;
    }

    setInterFrameTimeout(ms) {
        this._interFrameTimeout = ms;
    }

    getStats() { return { ...this._stats }; }

    resetStats() {
        Object.keys(this._stats).forEach(k => { this._stats[k] = 0; });
    }

    injectHexFrame(inputStr) {
        const trimmed = inputStr.trim();
        let bytes;
        if (trimmed.startsWith('$')) {
            const text = trimmed.endsWith('\n') ? trimmed : (trimmed + '\r\n');
            bytes = new TextEncoder().encode(text);
        } else {
            bytes = new Uint8Array(trimmed.split(/\s+/)
                .filter(h => /^[0-9a-fA-F]{1,2}$/.test(h))
                .map(h => parseInt(h, 16)));
        }
        if (bytes.length > 0) {
            this._processAccumulatedBuffer(bytes);
        }
    }

    async sendRawText(text) {
        if (!this._writer || !this._running) {
            return false;
        }
        try {
            const data = new TextEncoder().encode(text);
            await this._writer.write(data);
            return true;
        } catch (err) {
            console.error('[CR-EMU] sendRawText error:', err);
            return false;
        }
    }

    async transferTextChunks(text, onProgress) {
        if (!this._writer || !this._running) {
            return false;
        }
        const encoder = new TextEncoder();
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        let totalSent = 0;
        const totalBytes = encoder.encode(text).length + 1;

        for (let i = 0; i < lines.length; i++) {
            if (!this._running || !this._writer) return false;
            const line = lines[i] + '\r\n';
            const bytes = encoder.encode(line);
            try {
                await this._writer.write(bytes);
                totalSent += bytes.length;
                if (onProgress) onProgress(totalSent, totalBytes);
                await new Promise(r => setTimeout(r, 150));
            } catch (err) {
                console.error('[CR-EMU] transferTextChunks error:', err);
                return false;
            }
        }

        if (this._running && this._writer) {
            try {
                await this._writer.write(new Uint8Array([0x1A]));
                totalSent += 1;
                if (onProgress) onProgress(totalSent, totalBytes);
            } catch (err) {
                console.error('[CR-EMU] transferTextChunks CTRL-Z error:', err);
                return false;
            }
        }

        return true;
    }

    async _readLoop() {
        while (this._running) {
            let chunk;
            try {
                const result = await this._reader.read();
                if (result.done) {
                    this._handlePhysicalDisconnect();
                    return;
                }
                chunk = result.value;
            } catch (err) {
                if (this._running) {
                    console.warn('[CR-EMU] Read error:', err);
                    this._handlePhysicalDisconnect();
                }
                return;
            }

            this._onStateChange('rx');

            for (let i = 0; i < chunk.length; i++) {
                const b = chunk[i];
                if (this._flowControl === 'xonxoff') {
                    if (b === 0x13) {
                        this._xonFlowPaused = true;
                        continue;
                    }
                    if (b === 0x11) {
                        this._xonFlowPaused = false;
                        continue;
                    }
                }

                if (this._rxBufLength < this._rxBuffer.length) {
                    this._rxBuffer[this._rxBufLength++] = b;
                } else {
                    console.warn('[CR-EMU] RX buffer overrun — discarding buffer');
                    this._rxBufLength = 0;
                    this._stats.crcErrors++;
                    break;
                }

                if (this._parser._protocol === 'ascii' && (b === 0x0A || b === 0x0D)) {
                    if (this._rxBufLength > 0) {
                        const lineFrame = this._rxBuffer.slice(0, this._rxBufLength);
                        this._rxBufLength = 0;
                        clearTimeout(this._frameTimer);
                        this._processAccumulatedBuffer(lineFrame);
                    }
                }
            }

            if (this._parser._protocol !== 'ascii') {
                clearTimeout(this._frameTimer);
                this._frameTimer = setTimeout(() => {
                    if (this._rxBufLength > 0) {
                        const frame = this._rxBuffer.slice(0, this._rxBufLength);
                        this._rxBufLength = 0;
                        this._processAccumulatedBuffer(frame);
                    }
                }, this._interFrameTimeout);
            }
        }
    }

    async _processAccumulatedBuffer(frame) {
        const response = this._parser.processFrame(frame);
        this._onFrameProcessed(frame, response);

        if (response && this._writer) {
            if (this._xonFlowPaused) {
                let attempts = 0;
                while (this._xonFlowPaused && attempts < 50 && this._running) {
                    await new Promise(res => setTimeout(res, 100));
                    attempts++;
                }
            }

            try {
                this._onStateChange('tx');
                await this._writer.write(response);
            } catch (err) {
                console.warn('[CR-EMU] TX error:', err);
                if (this._running) this._handlePhysicalDisconnect();
            }
        }
    }

    _handlePhysicalDisconnect() {
        console.warn('[CR-EMU] Physical disconnect detected.');
        this.disconnect();
    }
}

if (typeof window !== 'undefined') {
    window.ChartRecorderEmulator = ChartRecorderEmulator;
}
