/**
 * EFX-80 Image-to-Printer Graphics Encoder
 * Converts images to ESC/P bit-image escape sequences for the EFX-80 dot matrix
 * printer emulator. Supports ESC K, L, Y, Z graphics modes.
 *
 * Architecture:
 *   ImageProcessor  — load, rotate, scale, B&W conversion (dither/threshold/canny)
 *   EscpEncoder     — pack 8-row bands into column bytes, build ESC/P streams
 *   PreviewRenderer — draw encoded image onto the preview canvas (green-bar paper)
 *   OutputFormatter — build copy-pasteable console string, build binary Uint8Array
 *   AppController   — wire all UI events together
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // DOM references
    // =========================================================================
    const dropBox           = document.getElementById('dropBox');
    const fileInput         = document.getElementById('fileInput');
    const sourceThumb       = document.getElementById('sourceThumb');
    const sourceInfo        = document.getElementById('sourceInfo');
    const sourcePreviewGroup= document.getElementById('sourcePreviewGroup');

    const modeKRadio        = document.getElementById('modeK');
    const modeLRadio        = document.getElementById('modeL');
    const modeYRadio        = document.getElementById('modeY');
    const modeZRadio        = document.getElementById('modeZ');

    const widthRange        = document.getElementById('widthRange');
    const widthVal          = document.getElementById('widthVal');
    const maxColsHint       = document.getElementById('maxColsHint');

    const scaleRange        = document.getElementById('scaleRange');
    const scaleVal          = document.getElementById('scaleVal');

    const modeNoneRadio     = document.getElementById('modeNone');
    const modeDitherRadio   = document.getElementById('modeDither');
    const modeThreshRadio   = document.getElementById('modeThreshold');
    const modeCannyRadio    = document.getElementById('modeCanny');

    const thresholdGroup    = document.getElementById('thresholdGroup');
    const thresholdRange    = document.getElementById('thresholdRange');
    const thresholdVal      = document.getElementById('thresholdVal');

    const cannyGroup        = document.getElementById('cannyGroup');
    const cannyLowRange     = document.getElementById('cannyLowRange');
    const cannyLowVal       = document.getElementById('cannyLowVal');
    const cannyHighRange    = document.getElementById('cannyHighRange');
    const cannyHighVal      = document.getElementById('cannyHighVal');

    const rot0              = document.getElementById('rot0');
    const rot90             = document.getElementById('rot90');
    const rot180            = document.getElementById('rot180');
    const rot270            = document.getElementById('rot270');

    const invertColors      = document.getElementById('invertColors');

    const btnEncode         = document.getElementById('btnEncode');
    const btnCopyEsc        = document.getElementById('btnCopyEsc');
    const btnDownloadPrn    = document.getElementById('btnDownloadPrn');
    const btnSendToEmulator = document.getElementById('btnSendToEmulator');
    const correctAspect     = document.getElementById('correctAspect');

    const previewCanvas     = document.getElementById('previewCanvas');
    const paperMeta         = document.getElementById('paperMeta');
    const processCanvas     = document.getElementById('processCanvas');

    const modeBadge         = document.getElementById('modeBadge');
    const statusBadge       = document.getElementById('statusBadge');
    const ledBusy           = document.getElementById('ledBusy');
    const ledPaper          = document.getElementById('ledPaper');

    const statDimensions    = document.getElementById('statDimensions');
    const statLines         = document.getElementById('statLines');
    const statColumns       = document.getElementById('statColumns');
    const statBytes         = document.getElementById('statBytes');

    const escOutput         = document.getElementById('escOutput');
    const toastFeedback     = document.getElementById('toastFeedback');
    const toastIcon         = document.getElementById('toastIcon');
    const toastMessage      = document.getElementById('toastMessage');

    // =========================================================================
    // State
    // =========================================================================
    let loadedImage     = null;   // Original Image object
    let currentRotation = 0;
    let binaryPrnData   = null;   // Uint8Array — binary stream for download

    // Max columns per ESC/P mode
    const MODE_MAX_COLS = { K: 480, L: 960, Y: 960, Z: 1920 };

    // Horizontal DPI for each ESC/P graphics mode (vertical is always 72 DPI)
    const MODE_H_DPI = { K: 60, L: 120, Y: 120, Z: 240 };
    const VERTICAL_DPI = 72;

    // =========================================================================
    // Helpers
    // =========================================================================
    let toastTimer = null;
    function showToast(msg, iconClass = 'fa-check-circle', isError = false) {
        if (toastTimer) clearTimeout(toastTimer);
        toastIcon.className = `fa-solid ${iconClass}`;
        toastMessage.textContent = msg;
        toastFeedback.style.borderColor = isError ? '#ef4444' : 'var(--color-primary)';
        toastFeedback.style.color       = isError ? '#ef4444' : 'var(--color-primary)';
        toastFeedback.classList.add('show');
        toastTimer = setTimeout(() => toastFeedback.classList.remove('show'), 2600);
    }

    function setStatus(state) {
        // state: 'idle' | 'busy' | 'done'
        const map = {
            idle: { cls: 'status-idle', icon: 'fa-circle-dot',  label: 'Idle',     led: false },
            busy: { cls: 'status-busy', icon: 'fa-circle-notch fa-spin', label: 'Encoding…', led: true },
            done: { cls: 'status-done', icon: 'fa-circle-check', label: 'Ready',   led: false },
        };
        const s = map[state] || map.idle;
        statusBadge.className = `status-badge ${s.cls}`;
        statusBadge.innerHTML = `<i class="fa-solid ${s.icon}"></i> ${s.label}`;
        ledBusy.classList.toggle('active', s.led);
    }

    function getSelectedMode() {
        if (modeKRadio.checked) return 'K';
        if (modeLRadio.checked) return 'L';
        if (modeYRadio.checked) return 'Y';
        if (modeZRadio.checked) return 'Z';
        return 'K';
    }

    function getMonoMode() {
        if (modeDitherRadio.checked)  return 'dither';
        if (modeThreshRadio.checked)  return 'threshold';
        if (modeCannyRadio.checked)   return 'canny';
        return 'none';
    }

    function getRotation() {
        if (rot90.checked)  return 90;
        if (rot180.checked) return 180;
        if (rot270.checked) return 270;
        return 0;
    }

    // Update width slider max when mode changes
    function syncModeUI() {
        const mode = getSelectedMode();
        const max  = MODE_MAX_COLS[mode];
        modeBadge.textContent = `ESC ${mode}`;
        maxColsHint.textContent = max;
        widthRange.max = max;
        if (parseInt(widthRange.value) > max) {
            widthRange.value = max;
            widthVal.textContent = max;
        }
    }

    function updateMonoModeUI() {
        const m = getMonoMode();
        thresholdGroup.style.display = (m === 'threshold') ? '' : 'none';
        cannyGroup.style.display     = (m === 'canny')     ? '' : 'none';
    }

    // =========================================================================
    // ImageProcessor — rotate, scale, convert to 1-bit
    // =========================================================================

    /**
     * Draws `img` rotated by `deg` (0/90/180/270) into a new canvas.
     * Returns the canvas.
     */
    function rotateImage(img, deg) {
        const swap = (deg === 90 || deg === 270);
        const w = swap ? img.height : img.width;
        const h = swap ? img.width  : img.height;
        const c = document.createElement('canvas');
        c.width  = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.translate(w / 2, h / 2);
        ctx.rotate(deg * Math.PI / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        return c;
    }

    /**
     * Floyd-Steinberg dithering on a luma grid.
     * `grid` is Float32Array of luminance [0..255], `w` columns, `h` rows.
     * Mutates `grid` in-place. Returns new Uint8Array (0=white, 1=black).
     */
    function floydSteinberg(grid, w, h) {
        const out = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i   = y * w + x;
                const old = grid[i];
                const nw  = old < 128 ? 0 : 255;
                out[i]    = nw === 0 ? 1 : 0;
                const err = old - nw;
                if (x + 1 < w)             grid[i + 1]         += err * 7 / 16;
                if (y + 1 < h) {
                    if (x > 0)             grid[i + w - 1]     += err * 3 / 16;
                                           grid[i + w]         += err * 5 / 16;
                    if (x + 1 < w)         grid[i + w + 1]     += err * 1 / 16;
                }
            }
        }
        return out;
    }

    /**
     * Simple threshold: luma < threshold → 1 (printed), else 0 (white).
     */
    function applyThreshold(grid, w, h, threshold) {
        const out = new Uint8Array(w * h);
        for (let i = 0; i < grid.length; i++) {
            out[i] = grid[i] < threshold ? 1 : 0;
        }
        return out;
    }

    /**
     * Canny-like edge detection pipeline:
     * grayscale → Gaussian blur (3×3) → Sobel → NMS → double-threshold + hysteresis
     */
    function cannyEdge(grid, w, h, low, high) {
        // 3×3 Gaussian blur
        const g = new Float32Array(w * h);
        const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let s = 0, k = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const ny = y + ky, nx = x + kx;
                        if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                            s += grid[ny * w + nx] * kernel[(ky + 1) * 3 + (kx + 1)];
                            k += kernel[(ky + 1) * 3 + (kx + 1)];
                        }
                    }
                }
                g[y * w + x] = s / k;
            }
        }

        // Sobel gradients
        const mag = new Float32Array(w * h);
        const dir = new Float32Array(w * h);
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                let gx = 0, gy = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const v = g[(y + ky) * w + (x + kx)];
                        gx += v * sobelX[(ky + 1) * 3 + (kx + 1)];
                        gy += v * sobelY[(ky + 1) * 3 + (kx + 1)];
                    }
                }
                mag[y * w + x] = Math.sqrt(gx * gx + gy * gy);
                dir[y * w + x] = Math.atan2(gy, gx);
            }
        }

        // Non-maximum suppression
        const nms = new Float32Array(w * h);
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i  = y * w + x;
                const a  = dir[i] * 180 / Math.PI;
                const ad = ((a % 180) + 180) % 180;
                let n1, n2;
                if      (ad < 22.5 || ad >= 157.5) { n1 = mag[i - 1]; n2 = mag[i + 1]; }
                else if (ad < 67.5)                 { n1 = mag[i - w + 1]; n2 = mag[i + w - 1]; }
                else if (ad < 112.5)                { n1 = mag[i - w]; n2 = mag[i + w]; }
                else                                { n1 = mag[i - w - 1]; n2 = mag[i + w + 1]; }
                nms[i] = (mag[i] >= n1 && mag[i] >= n2) ? mag[i] : 0;
            }
        }

        // Double threshold + hysteresis
        const out = new Uint8Array(w * h);
        const STRONG = 2, WEAK = 1;
        for (let i = 0; i < nms.length; i++) {
            if (nms[i] >= high)      out[i] = STRONG;
            else if (nms[i] >= low)  out[i] = WEAK;
        }
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                if (out[y * w + x] === WEAK) {
                    const neighbours = [
                        out[(y-1)*w+(x-1)], out[(y-1)*w+x], out[(y-1)*w+(x+1)],
                        out[y*w+(x-1)],                      out[y*w+(x+1)],
                        out[(y+1)*w+(x-1)], out[(y+1)*w+x], out[(y+1)*w+(x+1)],
                    ];
                    out[y * w + x] = neighbours.some(v => v === STRONG) ? STRONG : 0;
                }
            }
        }
        // Collapse STRONG → 1 (printed), rest → 0 (white)
        for (let i = 0; i < out.length; i++) {
            out[i] = out[i] === STRONG ? 1 : 0;
        }
        return out;
    }

    /**
     * Processes the loaded image into a 1-bit bitmap.
     * Returns { bitmap: Uint8Array, w: number, h: number }
     * bitmap[y*w+x] = 1 → printed dot, 0 → white
     *
     * @param {boolean} dpiCorrect — when true, scales output height by
     *   VERTICAL_DPI / MODE_H_DPI[mode] so the printed aspect ratio is
     *   preserved regardless of the selected horizontal dot pitch.
     */
    function processImageTo1Bit(img, targetCols, scalePct, rotation, monoMode, threshold, cannyLow, cannyHigh, invert, mode, dpiCorrect) {
        // 1. Rotate
        const rotated = rotateImage(img, rotation);

        // 2. Scale source content to target width
        const srcW = rotated.width;
        const srcH = rotated.height;
        const scale = (scalePct / 100);
        let outW = Math.round(targetCols * scale);
        if (outW < 1) outW = 1;
        if (outW > targetCols) outW = targetCols;

        // Compute proportional height.
        // Without correction every mode's pixel is a different physical shape:
        //   ESC K  60 DPI H → pixels are taller than wide  (ratio 72/60 = 1.2×)
        //   ESC L/Y 120 DPI H → pixels are wider than tall (ratio 72/120 = 0.6×)
        //   ESC Z  240 DPI H → very wide pixels            (ratio 72/240 = 0.3×)
        // Applying the correction scales the *bitmap height* by the inverse of
        // the pixel aspect ratio so the printer reproduces the correct shape.
        const aspect = srcH / srcW;
        let outH = Math.ceil(outW * aspect);
        if (dpiCorrect) {
            const hDpi = MODE_H_DPI[mode] || 60;
            outH = Math.ceil(outH * VERTICAL_DPI / hDpi);
        }
        outH = Math.ceil(outH / 8) * 8;
        if (outH < 8) outH = 8;

        // 3. Draw to processCanvas
        processCanvas.width  = outW;
        processCanvas.height = outH;
        const ctx = processCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
        ctx.drawImage(rotated, 0, 0, outW, outH);

        // 4. Extract RGBA
        const imgData = ctx.getImageData(0, 0, outW, outH);
        const rgba    = imgData.data;

        // 5. Build luma grid (alpha-composited over white)
        const lumaGrid = new Float32Array(outW * outH);
        for (let i = 0; i < outW * outH; i++) {
            const r = rgba[i * 4];
            const g = rgba[i * 4 + 1];
            const b = rgba[i * 4 + 2];
            const a = rgba[i * 4 + 3] / 255;
            // Alpha-blend onto white
            const rb = r * a + 255 * (1 - a);
            const gb = g * a + 255 * (1 - a);
            const bb = b * a + 255 * (1 - a);
            lumaGrid[i] = 0.299 * rb + 0.587 * gb + 0.114 * bb;
        }

        // 6. Convert to 1-bit
        let bitmap;
        if (monoMode === 'dither') {
            bitmap = floydSteinberg(lumaGrid, outW, outH);
        } else if (monoMode === 'threshold') {
            bitmap = applyThreshold(lumaGrid, outW, outH, threshold);
        } else if (monoMode === 'canny') {
            bitmap = cannyEdge(lumaGrid, outW, outH, cannyLow, cannyHigh);
        } else {
            // 'none' — straight threshold at 128
            bitmap = applyThreshold(lumaGrid, outW, outH, 128);
        }

        // 7. Invert if requested
        if (invert) {
            for (let i = 0; i < bitmap.length; i++) {
                bitmap[i] = bitmap[i] ? 0 : 1;
            }
        }

        return { bitmap, w: outW, h: outH };
    }

    // =========================================================================
    // EscpEncoder — pack bitmap into ESC/P bit-image streams
    // =========================================================================

    /**
     * Pack a 1-bit bitmap into ESC/P bit-image data.
     *
     * The EFX-80 prints in horizontal bands of 8 pins (rows).
     * For each 8-row band, each column produces one byte:
     *   bit 7 = row 0 (top pin), bit 0 = row 7 (bottom pin)
     *
     * Returns an array of Uint8Arrays, one per 8-row band.
     */
    function packBands(bitmap, w, h) {
        const numBands = Math.ceil(h / 8);
        const bands = [];
        for (let band = 0; band < numBands; band++) {
            const bandData = new Uint8Array(w);
            const rowBase  = band * 8;
            for (let col = 0; col < w; col++) {
                let byte = 0;
                for (let pin = 0; pin < 8; pin++) {
                    const row = rowBase + pin;
                    if (row < h && bitmap[row * w + col]) {
                        byte |= (1 << (7 - pin));
                    }
                }
                bandData[col] = byte;
            }
            bands.push(bandData);
        }
        return bands;
    }

    /**
     * Build a complete ESC/P binary stream for one graphics line.
     * Format: ESC <cmd> nL nH <data bytes>
     *   nL = (cols) % 256
     *   nH = (cols) / 256
     */
    function buildEscBand(modeChar, bandData) {
        const cols = bandData.length;
        const nL   = cols & 0xFF;
        const nH   = (cols >> 8) & 0xFF;
        const out  = new Uint8Array(4 + cols);
        out[0] = 0x1B;              // ESC
        out[1] = modeChar.charCodeAt(0); // K / L / Y / Z
        out[2] = nL;
        out[3] = nH;
        out.set(bandData, 4);
        return out;
    }

    /**
     * Build the full binary print stream for all bands.
     * Appends CR+LF after each band to advance to the next print line.
     */
    function buildFullStream(modeChar, bands) {
        const chunks = [];
        let totalLen = 0;
        for (const band of bands) {
            const esc = buildEscBand(modeChar, band);
            // CR + LF to advance paper line
            const line = new Uint8Array(esc.length + 2);
            line.set(esc, 0);
            line[esc.length]     = 0x0D; // CR
            line[esc.length + 1] = 0x0A; // LF
            chunks.push(line);
            totalLen += line.length;
        }
        // Concatenate all chunks into one flat Uint8Array
        const full = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) {
            full.set(chunk, offset);
            offset += chunk.length;
        }
        return full;
    }

    // =========================================================================
    // OutputFormatter — produce console escape string and binary blob
    // =========================================================================

    /**
     * Converts a binary Uint8Array into a console-pasteable escape string.
     * Rules:
     *   0x1B → \e
     *   0x0D → \r
     *   0x0A → \n
     *   printable ASCII (0x20–0x7E) → literal character
     *   everything else → \xHH
     */
    function buildConsoleString(data) {
        let s = '';
        for (let i = 0; i < data.length; i++) {
            const b = data[i];
            if      (b === 0x1B)               s += '\\e';
            else if (b === 0x0D)               s += '\\r';
            else if (b === 0x0A)               s += '\\n';
            else if (b >= 0x20 && b <= 0x7E)   s += String.fromCharCode(b);
            else                               s += `\\x${b.toString(16).padStart(2, '0')}`;
        }
        return s;
    }

    // =========================================================================
    // PreviewRenderer — draw encoded bands onto preview canvas
    // =========================================================================

    function renderPreview(bands, w) {
        const numBands = bands.length;
        const h = numBands * 8;

        previewCanvas.width  = w;
        previewCanvas.height = h;

        const ctx  = previewCanvas.getContext('2d');
        const imgD = ctx.createImageData(w, h);
        const px   = imgD.data;

        // Paper white
        px.fill(255);
        // Set alpha to fully opaque
        for (let i = 3; i < px.length; i += 4) px[i] = 255;

        // Ink color = near-black charcoal
        const inkR = 28, inkG = 25, inkB = 23;

        for (let band = 0; band < numBands; band++) {
            const bandData = bands[band];
            const rowBase  = band * 8;
            for (let col = 0; col < w; col++) {
                const byte = bandData[col];
                for (let pin = 0; pin < 8; pin++) {
                    if (byte & (1 << (7 - pin))) {
                        const row = rowBase + pin;
                        const pi  = (row * w + col) * 4;
                        px[pi]     = inkR;
                        px[pi + 1] = inkG;
                        px[pi + 2] = inkB;
                    }
                }
            }
        }

        ctx.putImageData(imgD, 0, 0);
    }

    // =========================================================================
    // Source thumbnail renderer
    // =========================================================================
    function renderSourceThumb(img) {
        if (!sourceThumb || !sourceInfo || !sourcePreviewGroup) return;
        const maxW = 310, maxH = 120;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        sourceThumb.width  = Math.round(img.width  * scale);
        sourceThumb.height = Math.round(img.height * scale);
        const ctx = sourceThumb.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, sourceThumb.width, sourceThumb.height);
        ctx.drawImage(img, 0, 0, sourceThumb.width, sourceThumb.height);
        sourceInfo.textContent = `${img.width} × ${img.height} px`;
        sourcePreviewGroup.style.display = '';
    }

    // =========================================================================
    // Core encode pipeline
    // =========================================================================
    function encodeAndRender() {
        if (!loadedImage) return;

        setStatus('busy');
        ledBusy.classList.add('active');

        // Small timeout so the UI updates before the heavy work
        setTimeout(() => {
            try {
                const mode       = getSelectedMode();
                const targetCols = parseInt(widthRange.value);
                const scalePct   = parseInt(scaleRange.value);
                const rotation   = getRotation();
                const monoMode   = getMonoMode();
                const threshold  = parseInt(thresholdRange.value);
                const cannyLow   = parseInt(cannyLowRange.value);
                const cannyHigh  = parseInt(cannyHighRange.value);
                const invert     = invertColors.checked;
                const dpiCorrect = correctAspect.checked;

                // 1. Process to 1-bit
                const { bitmap, w, h } = processImageTo1Bit(
                    loadedImage, targetCols, scalePct, rotation,
                    monoMode, threshold, cannyLow, cannyHigh, invert, mode, dpiCorrect
                );

                // 2. Pack into bands
                const bands    = packBands(bitmap, w, h);
                const numBands = bands.length;

                // 3. Build binary stream
                const stream   = buildFullStream(mode, bands);
                binaryPrnData  = stream;

                // 4. Build console string
                const consoleStr = buildConsoleString(stream);

                // 5. Render preview
                renderPreview(bands, w);

                // 6. Update UI
                escOutput.value = consoleStr;
                paperMeta.textContent = `${w} cols × ${h} rows | ${numBands} bands | ${stream.length} bytes | ESC ${mode}`;

                statDimensions.textContent = `${w} × ${h}`;
                statLines.textContent      = numBands;
                statColumns.textContent    = `${w} cols`;
                statBytes.textContent      = `${stream.length} bytes`;

                btnDownloadPrn.disabled = false;

                setStatus('done');
                showToast(`Encoded ${numBands} bands · ${stream.length} bytes`, 'fa-microchip');

            } catch (err) {
                console.error('Encode error:', err);
                setStatus('idle');
                showToast('Encoding failed: ' + err.message, 'fa-circle-xmark', true);
            }
        }, 30);
    }

    // =========================================================================
    // File loading
    // =========================================================================
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showToast('Please select an image file', 'fa-triangle-exclamation', true);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                loadedImage = img;
                renderSourceThumb(img);
                btnEncode.disabled = false;
                encodeAndRender();
            };
            img.onerror = () => showToast('Failed to load image', 'fa-circle-xmark', true);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // =========================================================================
    // Download binary .prn
    // =========================================================================
    function downloadPrn() {
        if (!binaryPrnData) return;
        const blob = new Blob([binaryPrnData], { type: 'application/octet-stream' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `efx80_${getSelectedMode()}.prn`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Binary .prn downloaded', 'fa-download');
    }

    // =========================================================================
    // Copy escape string
    // =========================================================================
    function copyEscString() {
        const val = escOutput.value;
        if (!val) { showToast('Nothing to copy — encode first', 'fa-triangle-exclamation', true); return; }
        navigator.clipboard.writeText(val).then(() => {
            showToast('Escape sequence copied to clipboard!', 'fa-copy');
        }).catch(() => {
            // Fallback
            escOutput.select();
            document.execCommand('copy');
            showToast('Copied (fallback)', 'fa-copy');
        });
    }

    // =========================================================================
    // Event wiring
    // =========================================================================

    // Graphics mode selector
    [modeKRadio, modeLRadio, modeYRadio, modeZRadio].forEach(r => {
        r.addEventListener('change', () => {
            syncModeUI();
            if (loadedImage) encodeAndRender();
        });
    });

    // Width slider
    widthRange.addEventListener('input', () => {
        widthVal.textContent = widthRange.value;
    });
    widthRange.addEventListener('change', () => {
        if (loadedImage) encodeAndRender();
    });

    // Scale slider
    scaleRange.addEventListener('input', () => {
        scaleVal.textContent = scaleRange.value + '%';
    });
    scaleRange.addEventListener('change', () => {
        if (loadedImage) encodeAndRender();
    });

    // B&W mode radios
    [modeNoneRadio, modeDitherRadio, modeThreshRadio, modeCannyRadio].forEach(r => {
        r.addEventListener('change', () => {
            updateMonoModeUI();
            if (loadedImage) encodeAndRender();
        });
    });

    // Threshold slider
    thresholdRange.addEventListener('input', () => {
        thresholdVal.textContent = thresholdRange.value;
    });
    thresholdRange.addEventListener('change', () => {
        if (loadedImage) encodeAndRender();
    });

    // Canny sliders
    cannyLowRange.addEventListener('input', () => {
        cannyLowVal.textContent = cannyLowRange.value;
    });
    cannyLowRange.addEventListener('change', () => {
        if (loadedImage) encodeAndRender();
    });
    cannyHighRange.addEventListener('input', () => {
        cannyHighVal.textContent = cannyHighRange.value;
    });
    cannyHighRange.addEventListener('change', () => {
        if (loadedImage) encodeAndRender();
    });

    // Rotation
    [rot0, rot90, rot180, rot270].forEach(r => {
        r.addEventListener('change', () => {
            if (loadedImage) encodeAndRender();
        });
    });

    // Invert
    invertColors.addEventListener('change', () => {
        if (loadedImage) encodeAndRender();
    });

    // Aspect ratio DPI correction
    correctAspect.addEventListener('change', () => {
        if (loadedImage) encodeAndRender();
    });

    // Encode button
    btnEncode.addEventListener('click', () => {
        if (loadedImage) encodeAndRender();
    });

    // Copy
    btnCopyEsc.addEventListener('click', copyEscString);

    // Download .prn
    btnDownloadPrn.addEventListener('click', downloadPrn);

    // Open emulator in new tab
    btnSendToEmulator.addEventListener('click', () => {
        window.open('../efx80-printer-emulator/index.html', '_blank');
    });

    // Drop zone
    dropBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    dropBox.addEventListener('dragover', e => {
        e.preventDefault();
        dropBox.classList.add('hover');
    });
    dropBox.addEventListener('dragleave', () => dropBox.classList.remove('hover'));
    dropBox.addEventListener('drop', e => {
        e.preventDefault();
        dropBox.classList.remove('hover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    // =========================================================================
    // Initial UI sync
    // =========================================================================
    syncModeUI();
    updateMonoModeUI();
    setStatus('idle');

    // Show idle preview canvas
    previewCanvas.width  = 480;
    previewCanvas.height = 8;
    const initCtx = previewCanvas.getContext('2d');
    initCtx.fillStyle = '#f4f9f4';
    initCtx.fillRect(0, 0, 480, 8);

});
