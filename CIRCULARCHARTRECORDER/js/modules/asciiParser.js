/**
 * AsciiProtocolParser — Decoupled parser for Simple ASCII Line Protocol
 * and Organiser II OPL text commands.
 */
export class AsciiProtocolParser {
    static parse(rawText, device, stationAddress = 1) {
        const dollarIdx = rawText.indexOf('$');
        if (dollarIdx === -1) return null;

        const text = rawText.substring(dollarIdx).trim();
        let cmd = text.substring(1).trim();

        const colonIdx = cmd.indexOf(':');
        if (colonIdx > 0 && colonIdx <= 3) {
            const addrNum = parseInt(cmd.substring(0, colonIdx), 10);
            if (!isNaN(addrNum) && addrNum !== stationAddress) {
                return null;
            }
            cmd = cmd.substring(colonIdx + 1).trim();
        }

        if (cmd.toUpperCase().startsWith('PV?')) {
            const p1 = device.pen1PV.toFixed(2);
            const p2 = device.pen2PV.toFixed(2);
            const p3 = (device.pen3PV || (device.scaleLo + (device.scaleHi - device.scaleLo) * 0.55)).toFixed(2);
            const p4 = (device.pen4PV || (device.scaleLo + (device.scaleHi - device.scaleLo) * 0.75)).toFixed(2);
            return `*PV:P1=${p1},P2=${p2},P3=${p3},P4=${p4}\r\n`;
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
                        if (key === 'P1' || key === 'PEN1') { device.pen1PV = val; updated = true; }
                        if (key === 'P2' || key === 'PEN2') { device.pen2PV = val; updated = true; }
                        if (key === 'P3' || key === 'PEN3') { device.pen3PV = val; updated = true; }
                        if (key === 'P4' || key === 'PEN4') { device.pen4PV = val; updated = true; }
                    }
                }
            }
            if (updated) {
                return `*OK\r\n`;
            }
        }

        return `*ERR:INVALID\r\n`;
    }
}
