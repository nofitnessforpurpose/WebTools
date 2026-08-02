/**
 * qr.js — Minimal QR Code Generator (Byte Mode, Level M)
 * Self-contained, no dependencies. Loaded as a local asset to avoid CORS.
 * Exposes: window.QRCanvas(text, canvasElement, cellSize = 4)
 * Supports: Versions 1-10 (up to 216 bytes), Level M error correction.
 */
(function (global) {
    'use strict';

    // GF(256) Arithmetic (primitive polynomial 0x11D)
    const GF_EXP = new Uint8Array(512);
    const GF_LOG = new Uint8Array(256);
    (function () {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            GF_EXP[i] = x; GF_LOG[x] = i;
            x = x << 1 ^ (x & 0x80 ? 0x11d : 0);
        }
        for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
    })();

    function gfMul(a, b) { return (!a || !b) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }

    function polyMul(p, q) {
        const r = new Array(p.length + q.length - 1).fill(0);
        for (let i = 0; i < p.length; i++)
            for (let j = 0; j < q.length; j++)
                r[i + j] ^= gfMul(p[i], q[j]);
        return r;
    }

    function rsGenerator(n) {
        let g = [1];
        for (let i = 0; i < n; i++) g = polyMul(g, [1, GF_EXP[i]]);
        return g;
    }

    function rsEncode(data, nEC) {
        const gen = rsGenerator(nEC);
        const msg = [...data, ...new Array(nEC).fill(0)];
        for (let i = 0; i < data.length; i++) {
            const c = msg[i]; if (!c) continue;
            for (let j = 0; j < gen.length; j++) msg[i + j] ^= gfMul(c, gen[j]);
        }
        return msg.slice(data.length);
    }

    // Version/Capacity Table (Level M)
    const VERSIONS = [
        null,
        { size:21, dataBytes:16,  ecPerBlock:10, b1:1, dc1:16, b2:0, dc2:0  },
        { size:25, dataBytes:28,  ecPerBlock:16, b1:1, dc1:28, b2:0, dc2:0  },
        { size:29, dataBytes:44,  ecPerBlock:26, b1:1, dc1:44, b2:0, dc2:0  },
        { size:33, dataBytes:64,  ecPerBlock:18, b1:2, dc1:32, b2:0, dc2:0  },
        { size:37, dataBytes:86,  ecPerBlock:24, b1:2, dc1:43, b2:0, dc2:0  },
        { size:41, dataBytes:108, ecPerBlock:16, b1:4, dc1:27, b2:0, dc2:0  },
        { size:45, dataBytes:124, ecPerBlock:18, b1:4, dc1:31, b2:0, dc2:0  },
        { size:49, dataBytes:154, ecPerBlock:22, b1:2, dc1:38, b2:2, dc2:39 },
        { size:53, dataBytes:182, ecPerBlock:22, b1:3, dc1:36, b2:2, dc2:37 },
        { size:57, dataBytes:216, ecPerBlock:26, b1:4, dc1:43, b2:1, dc2:44 },
    ];

    const ALIGN_POS = [
        [],[],[6,18],[6,22],[6,26],[6,30],[6,34],
        [6,22,38],[6,24,42],[6,26,46],[6,28,50],
    ];

    // Format information bits (Level M = 01, BCH encoded, XOR 0x5412)
    function formatBits(maskId) {
        let b = ((0b01 << 3) | maskId) << 10;
        const gen = 0b10100110111;
        for (let i = 14; i >= 10; i--) if (b & (1 << i)) b ^= gen << (i - 10);
        return (((0b01 << 3) | maskId) << 10 | (b & 0x3FF)) ^ 0x5412;
    }

    // Cell types
    const T_FREE = 0, T_FINDER = 1, T_TIMING = 2, T_FORMAT = 3, T_ALIGN = 4, T_DATA = 5;

    function makeMatrix(size) {
        return Array.from({ length: size }, () =>
            Array.from({ length: size }, () => ({ dark: false, type: T_FREE })));
    }

    function setCell(m, r, c, dark, type) {
        if (r < 0 || c < 0 || r >= m.length || c >= m.length) return;
        if (m[r][c].type === T_FINDER) return;
        if (type === T_TIMING && m[r][c].type === T_ALIGN) return;
        m[r][c].dark = dark; m[r][c].type = type;
    }

    function setFinderPattern(m, row, col) {
        for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
            const rr = row + r, cc = col + c;
            if (rr < 0 || cc < 0 || rr >= m.length || cc >= m.length) continue;
            const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
            const border = r === 0 || r === 6 || c === 0 || c === 6;
            const inner  = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            m[rr][cc].dark = inside && (border || inner);
            m[rr][cc].type = T_FINDER;
        }
    }

    function setAlignmentPattern(m, row, col) {
        for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
            const border = Math.abs(r) === 2 || Math.abs(c) === 2;
            setCell(m, row + r, col + c, border || (r === 0 && c === 0), T_ALIGN);
        }
    }

    function setTimingPatterns(m, size) {
        for (let i = 8; i < size - 8; i++) {
            setCell(m, 6, i, i % 2 === 0, T_TIMING);
            setCell(m, i, 6, i % 2 === 0, T_TIMING);
        }
    }

    function reserveFormatCells(m, size) {
        for (let i = 0; i <= 8; i++) {
            if (!m[8][i].type) m[8][i].type = T_FORMAT;
            if (!m[i][8].type) m[i][8].type = T_FORMAT;
        }
        for (let i = 0; i < 8; i++) if (!m[8][size-1-i].type) m[8][size-1-i].type = T_FORMAT;
        for (let i = 0; i < 8; i++) if (!m[size-1-i][8].type) m[size-1-i][8].type = T_FORMAT;
    }

    function placeFormatBits(m, size, version, maskId) {
        const bits = formatBits(maskId);
        const p1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
        const p2 = [[8,size-1],[8,size-2],[8,size-3],[8,size-4],[8,size-5],[8,size-6],[8,size-7],
                    [size-8,8],[size-7,8],[size-6,8],[size-5,8],[size-4,8],[size-3,8],[size-2,8],[size-1,8]];
        for (let i = 0; i < 15; i++) {
            m[p1[i][0]][p1[i][1]].dark = !!(bits >> (14 - i) & 1);
            m[p1[i][0]][p1[i][1]].type = T_FORMAT;
            m[p2[i][0]][p2[i][1]].dark = !!(bits >> i & 1);
            m[p2[i][0]][p2[i][1]].type = T_FORMAT;
        }
        m[4*version+9][8].dark = true; m[4*version+9][8].type = T_FORMAT;
    }

    function buildDataCodewords(textBytes, version) {
        const ver = VERSIONS[version];
        const bits = [];
        const len = textBytes.length;
        bits.push(0,1,0,0);
        const cntBits = version >= 10 ? 16 : 8;
        for (let i = cntBits - 1; i >= 0; i--) bits.push((len >> i) & 1);
        for (const b of textBytes) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
        const cap = ver.dataBytes * 8;
        for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0);
        while (bits.length % 8) bits.push(0);
        let p = 0;
        while (bits.length < cap) {
            const b = p++ % 2 ? 0x11 : 0xEC;
            for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
        }
        const cw = [];
        for (let i = 0; i < bits.length; i += 8) {
            let b = 0;
            for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
            cw.push(b);
        }
        return cw;
    }

    function interleave(dataBlocks, ecBlocks) {
        const out = [];
        const mD = Math.max(...dataBlocks.map(b => b.length));
        for (let i = 0; i < mD; i++) for (const b of dataBlocks) if (i < b.length) out.push(b[i]);
        const mE = Math.max(...ecBlocks.map(b => b.length));
        for (let i = 0; i < mE; i++) for (const b of ecBlocks) if (i < b.length) out.push(b[i]);
        return out;
    }

    function placeData(m, size, codewords) {
        const totalBits = codewords.length * 8;
        let bitIdx = 0, up = true;
        for (let col = size - 1; col >= 1; col -= 2) {
            if (col === 6) col--;
            for (let rowStep = 0; rowStep < size; rowStep++) {
                const row = up ? size - 1 - rowStep : rowStep;
                for (let d = 0; d < 2; d++) {
                    const cc = col - d;
                    if (m[row][cc].type !== T_FREE) continue;
                    m[row][cc].dark = bitIdx < totalBits
                        ? !!(codewords[bitIdx >> 3] & (0x80 >> (bitIdx & 7))) : false;
                    m[row][cc].type = T_DATA;
                    bitIdx++;
                }
            }
            up = !up;
        }
    }

    const MASK_FN = [
        (r,c)=>(r+c)%2===0, (r,c)=>r%2===0, (r,c)=>c%3===0, (r,c)=>(r+c)%3===0,
        (r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,
        (r,c)=>(r*c)%2+(r*c)%3===0,
        (r,c)=>((r*c)%2+(r*c)%3)%2===0,
        (r,c)=>((r+c)%2+(r*c)%3)%2===0,
    ];

    function applyMask(m, maskId) {
        const fn = MASK_FN[maskId];
        for (let r = 0; r < m.length; r++)
            for (let c = 0; c < m.length; c++)
                if (m[r][c].type === T_DATA && fn(r, c)) m[r][c].dark = !m[r][c].dark;
    }

    function penalty(m) {
        const n = m.length; let s = 0;
        for (let r = 0; r < n; r++) for (const h of [true,false]) {
            let run = 1;
            for (let i = 1; i < n; i++) {
                const a = h?m[r][i].dark:m[i][r].dark, b = h?m[r][i-1].dark:m[i-1][r].dark;
                if (a===b){run++;if(run===5)s+=3;else if(run>5)s++;}else run=1;
            }
        }
        for (let r=0;r<n-1;r++) for (let c=0;c<n-1;c++)
            if (m[r][c].dark===m[r+1][c].dark&&m[r][c].dark===m[r][c+1].dark&&m[r][c].dark===m[r+1][c+1].dark) s+=3;
        let dark=0;
        for (let r=0;r<n;r++) for (let c=0;c<n;c++) if(m[r][c].dark) dark++;
        s += Math.floor(Math.abs(Math.floor(dark*100/(n*n))-50)/5)*10;
        return s;
    }

    function buildMatrix(version, allCW) {
        const ver = VERSIONS[version], size = ver.size;
        const m = makeMatrix(size);
        setFinderPattern(m, 0, 0);
        setFinderPattern(m, 0, size - 7);
        setFinderPattern(m, size - 7, 0);
        setTimingPatterns(m, size);
        reserveFormatCells(m, size);
        const ap = ALIGN_POS[version];
        if (ap.length) for (let ai = 0; ai < ap.length; ai++) for (let aj = 0; aj < ap.length; aj++) {
            if (ai===0&&aj===0||ai===0&&aj===ap.length-1||ai===ap.length-1&&aj===0) continue;
            setAlignmentPattern(m, ap[ai], ap[aj]);
        }
        placeData(m, size, allCW);
        return m;
    }

    /**
     * Generate a QR code and render it onto a canvas element.
     * @param {string} text - Text to encode (URL)
     * @param {HTMLCanvasElement} canvas - Target canvas
     * @param {number} [cellSize=4] - Pixels per module
     * @returns {boolean} true on success
     */
    function QRCanvas(text, canvas, cellSize) {
        cellSize = cellSize || 4;
        const textBytes = new TextEncoder().encode(text);
        const len = textBytes.length;
        let version = null;
        for (let v = 1; v <= 10; v++) {
            const oh = v >= 10 ? 3 : 2;
            if (VERSIONS[v].dataBytes >= len + oh) { version = v; break; }
        }
        if (!version) { console.warn('QRCanvas: text too long for version 1-10 Level M'); return false; }

        const ver = VERSIONS[version];
        const dataCW = buildDataCodewords(textBytes, version);
        const dataBlocks = [], ecBlocks = [];
        let offset = 0;
        const bSizes = [];
        for (let i=0;i<ver.b1;i++) bSizes.push(ver.dc1);
        for (let i=0;i<ver.b2;i++) bSizes.push(ver.dc2);
        for (const bLen of bSizes) {
            const block = dataCW.slice(offset, offset + bLen); offset += bLen;
            dataBlocks.push(block);
            ecBlocks.push(rsEncode(block, ver.ecPerBlock));
        }
        const allCW = interleave(dataBlocks, ecBlocks);

        let best = null, bestP = Infinity;
        for (let maskId = 0; maskId < 8; maskId++) {
            const m = buildMatrix(version, allCW);
            applyMask(m, maskId);
            placeFormatBits(m, ver.size, version, maskId);
            const p = penalty(m);
            if (p < bestP) { bestP = p; best = m; }
        }

        const quiet = 4, total = (ver.size + quiet * 2) * cellSize;
        canvas.width = total; canvas.height = total;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, total, total);
        ctx.fillStyle = '#000000';
        for (let r = 0; r < ver.size; r++)
            for (let c = 0; c < ver.size; c++)
                if (best[r][c].dark)
                    ctx.fillRect((c+quiet)*cellSize, (r+quiet)*cellSize, cellSize, cellSize);
        return true;
    }

    global.QRCanvas = QRCanvas;
})(window);
