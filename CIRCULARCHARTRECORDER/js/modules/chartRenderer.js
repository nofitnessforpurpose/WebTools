import { degToRad, getRefAngleForRadius } from '../utils/mathUtils.js';

/**
 * CircularChartRenderer — 2D Canvas circular chart disc renderer & SVG pen arm updater.
 */
export class CircularChartRenderer {
    constructor(canvas, emulator) {
        this._chartCanvas = canvas;
        this._chartCtx    = canvas.getContext('2d');
        this._emulator    = emulator;

        this._traceHistory = [];
        this._penCount = 1;
        this._penColors = ['#ff4060', '#00b4d8', '#10b981', '#f59e0b'];
        this._prevPenCanvas = [null, null, null, null];

        this._gridStyle = 'standard-24h';
        this._paperStock = 'antique-white';
        this._gridColor = 'grid-red';
        this._textColor = 'auto';

        this._showZebra = true;
        this._exportResMultiplier = 2;

        this._armMountAngle = 195;
        this._penDrawAngle = 260;
        this._scaleLabelMode = 'single';

        this._mainRadialWidth = 1.1;
        this._subRadialWidth  = 0.6;
        this._majorRingWidth  = 1.4;
        this._subRingWidth    = 0.5;
        this._traceLineWidth = 1.5;

        this._drawDiscBackground();
    }

    _getRefAngleForRadius(r, cx, cy, R) {
        return getRefAngleForRadius(r, cx, cy, R, this._armMountAngle, this._penDrawAngle);
    }

    _drawDiscBackground() {
        const ctx = this._chartCtx;
        const W = this._chartCanvas.width;
        const H = this._chartCanvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const R  = W / 2 - 2;

        ctx.clearRect(0, 0, W, H);

        const paperStocks = {
            'antique-white': ['#fdfbf7', '#f7f4ed', '#eee8dd'],
            'manila-paper':  ['#f4f1ea', '#ebe6dc', '#ded6c6'],
            'classic-cream': ['#f9f5e9', '#f0ead6', '#e8dfca'],
            'vintage-aged':  ['#edd6b1', '#dfbe92', '#ceaa7b'],
            'blueprint-cyan':['#0f355c', '#0a2542', '#05182e'],
            'dark-slate':    ['#1e293b', '#0f172a', '#090d16'],
            'pure-white':    ['#ffffff', '#f8fafc', '#f1f5f9']
        };

        const bgGradColors = paperStocks[this._paperStock] || paperStocks['antique-white'];

        const gridColors = {
            'grid-red':        { major: '#d94343', minor: 'rgba(217,67,67,0.45)', text: '#8b0000' },
            'pale-blue':       { major: '#769cdb', minor: 'rgba(166,193,238,0.5)', text: '#1e3a8a' },
            'faded-green':     { major: '#688e68', minor: 'rgba(153,178,153,0.5)', text: '#14532d' },
            'sepia-warm':      { major: '#b88552', minor: 'rgba(210,166,121,0.5)', text: '#4a2e16' },
            'slate-gray':      { major: '#475569', minor: 'rgba(100,116,139,0.4)', text: '#0f172a' },
            'blueprint-white': { major: '#cbd5e1', minor: 'rgba(226,232,240,0.3)', text: '#f8fafc' }
        };

        const gColor = gridColors[this._gridColor] || gridColors['grid-red'];

        const textColors = {
            'crimson-red':    '#8b0000',
            'dark-charcoal': '#1e293b',
            'navy-blue':     '#1e3a8a',
            'faded-brown':   '#4a2e16',
            'forest-green':  '#14532d',
            'bright-white':  '#f8fafc'
        };

        const isDarkPaper = (this._paperStock === 'dark-slate' || this._paperStock === 'blueprint-cyan');
        const textColor = (this._textColor === 'auto')
            ? (isDarkPaper ? '#f8fafc' : gColor.text)
            : (textColors[this._textColor] || gColor.text);

        const scale = W / 720;
        const fontScale = scale;

        const grad = ctx.createRadialGradient(cx - (30 * scale), cy - (30 * scale), 10 * scale, cx, cy, R);
        grad.addColorStop(0, bgGradColors[0]);
        grad.addColorStop(0.7, bgGradColors[1]);
        grad.addColorStop(1, bgGradColors[2]);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        if (this._gridStyle === 'blank-clean') {
            this._drawCenterMetadataBlock(ctx, cx, cy, textColor, gColor.major, scale);
            this._drawCentreHub(ctx, cx, cy, scale);
            return;
        }

        const isGraphPaper = (this._gridStyle === 'graph-quad');
        const majorRings = 10;
        const minorSubdivisions = isGraphPaper ? 10 : 5;
        const innerHubR = R * 0.16;
        const outerScaleR = R * 0.94;
        const totalSpanR = outerScaleR - innerHubR;

        if (this._gridStyle === 'weekly-7d' || this._gridStyle === 'weekly-28d') {
            const totalDays = (this._gridStyle === 'weekly-7d') ? 7 : 28;
            const drawRad = degToRad(this._penDrawAngle);
            ctx.save();
            ctx.fillStyle = isDarkPaper ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';

            for (let d = 0; d < totalDays; d++) {
                if (d % 7 === 5 || d % 7 === 6) {
                    const startSpokeAngle = (d / totalDays) * Math.PI * 2 - Math.PI / 2;
                    const endSpokeAngle   = ((d + 1) / totalDays) * Math.PI * 2 - Math.PI / 2;
                    const steps = 15;

                    ctx.beginPath();
                    for (let s = 0; s <= steps; s++) {
                        const r = innerHubR + (s / steps) * totalSpanR;
                        const ang = this._getRefAngleForRadius(r, cx, cy, R) + (startSpokeAngle - drawRad);
                        const px = cx + Math.cos(ang) * r;
                        const py = cy + Math.sin(ang) * r;
                        if (s === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    for (let s = steps; s >= 0; s--) {
                        const r = innerHubR + (s / steps) * totalSpanR;
                        const ang = this._getRefAngleForRadius(r, cx, cy, R) + (endSpokeAngle - drawRad);
                        const px = cx + Math.cos(ang) * r;
                        const py = cy + Math.sin(ang) * r;
                        ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        ctx.lineWidth = this._subRingWidth * scale;
        ctx.strokeStyle = gColor.minor;
        for (let i = 0; i < majorRings * minorSubdivisions; i++) {
            if (i % minorSubdivisions === 0) continue;
            const ratio = i / (majorRings * minorSubdivisions);
            const rr = innerHubR + ratio * totalSpanR;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.lineWidth = this._majorRingWidth * scale;
        ctx.strokeStyle = gColor.major;
        for (let i = 0; i <= majorRings; i++) {
            const ratio = i / majorRings;
            const rr = innerHubR + ratio * totalSpanR;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this._gridStyle !== 'concentric-only') {
            let spokeDivisions = 24;
            let timeLabels = [];

            if (this._gridStyle === 'graph-quad') {
                spokeDivisions = 96;
            } else if (this._gridStyle === 'polar-12h') {
                spokeDivisions = 12;
            } else if (this._gridStyle === 'weekly-7d') {
                spokeDivisions = 7;
                timeLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            } else if (this._gridStyle === 'weekly-28d') {
                spokeDivisions = 28;
                timeLabels = [];
                for (let d = 0; d < 28; d++) {
                    timeLabels.push(d % 7 === 3 ? `WEEK ${Math.floor(d / 7) + 1}` : '');
                }
            } else if (this._gridStyle === 'monthly-31d') {
                spokeDivisions = 31;
                for (let d = 1; d <= 31; d++) timeLabels.push(String(d));
            } else if (this._gridStyle === 'annual-12m') {
                spokeDivisions = 12;
                timeLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            }

            const drawRad = degToRad(this._penDrawAngle);
            for (let i = 0; i < spokeDivisions; i++) {
                const spokeAngle = (i / spokeDivisions) * Math.PI * 2 - Math.PI / 2;
                let isMajor = (spokeDivisions <= 12) ? true : (this._gridStyle === 'weekly-28d' ? (i % 7 === 0) : (i % (spokeDivisions === 96 ? 4 : 6) === 0));

                ctx.strokeStyle = isMajor ? gColor.major : gColor.minor;
                ctx.lineWidth   = (isMajor ? this._mainRadialWidth : this._subRadialWidth) * scale;

                ctx.beginPath();
                const steps = 20;
                for (let step = 0; step <= steps; step++) {
                    const r = innerHubR + (step / steps) * totalSpanR;
                    const ang = this._getRefAngleForRadius(r, cx, cy, R) + (spokeAngle - drawRad);
                    const px = cx + Math.cos(ang) * r;
                    const py = cy + Math.sin(ang) * r;
                    if (step === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }

            if (this._gridStyle !== 'graph-quad') {
                const labelRadius = R * 0.90;
                const refLabelAng = this._getRefAngleForRadius(labelRadius, cx, cy, R);
                const kinematicLabelOffset = refLabelAng - drawRad;

                for (let h = 0; h < spokeDivisions; h++) {
                    const midSpokeAngle = ((h + 0.5) / spokeDivisions) * Math.PI * 2 - Math.PI / 2;
                    const angle = midSpokeAngle + kinematicLabelOffset;

                    ctx.save();
                    ctx.translate(cx + Math.cos(angle) * labelRadius, cy + Math.sin(angle) * labelRadius);
                    ctx.rotate(angle + Math.PI / 2);
                    ctx.fillStyle = textColor;
                    const fSize = (spokeDivisions > 24 ? 7 : 9) * fontScale;
                    ctx.font      = `bold ${fSize.toFixed(1)}px 'Roboto', 'Arial', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    let labelText = '';
                    if (timeLabels.length > 0) {
                        labelText = timeLabels[h];
                    } else if (spokeDivisions === 12) {
                        const hr = (h % 12) + 1;
                        labelText = `${hr} ${h < 6 ? 'AM' : 'PM'}`;
                    } else {
                        labelText = String(h + 1);
                    }

                    if (labelText) {
                        ctx.fillText(labelText, 0, 0);
                    }
                    ctx.restore();
                }
            }
        }

        if (this._showZebra) {
            this._drawOuterRimZebra(ctx, cx, cy, R, gColor.major, textColor, scale);
        }

        const scaleHi = this._emulator ? this._emulator.device.scaleHi : 200;
        const scaleLo = this._emulator ? this._emulator.device.scaleLo : 0;
        const scaleSpan = scaleHi - scaleLo;

        ctx.fillStyle = textColor;
        const scaleFontSize = 8.5 * fontScale;
        ctx.font = `600 ${scaleFontSize.toFixed(1)}px 'Roboto', 'Arial', sans-serif`;

        let spokeDivs = 24;
        if (this._gridStyle === 'graph-quad') spokeDivs = 96;
        else if (this._gridStyle === 'polar-12h') spokeDivs = 12;
        else if (this._gridStyle === 'weekly-7d') spokeDivs = 7;
        else if (this._gridStyle === 'weekly-28d') spokeDivs = 28;
        else if (this._gridStyle === 'monthly-31d') spokeDivs = 31;
        else if (this._gridStyle === 'annual-12m') spokeDivs = 12;

        let primaryAngleRad = degToRad(this._penDrawAngle);
        if (this._gridStyle !== 'concentric-only') {
            let minDiff = Infinity;
            for (let s = 0; s < spokeDivs; s++) {
                const isMajor = (spokeDivs <= 12) ? true : (this._gridStyle === 'weekly-28d' ? (s % 7 === 0) : (s % (spokeDivs === 96 ? 4 : 6) === 0));
                if (isMajor) {
                    const spokeAngle = (s / spokeDivs) * Math.PI * 2 - Math.PI / 2;
                    let diff = Math.abs(Math.atan2(Math.sin(spokeAngle - primaryAngleRad), Math.cos(spokeAngle - primaryAngleRad)));
                    if (diff < minDiff) {
                        minDiff = diff;
                        primaryAngleRad = spokeAngle;
                    }
                }
            }
        }

        let targetArcAngles = [];
        if (this._scaleLabelMode === 'all' && this._gridStyle !== 'concentric-only') {
            for (let s = 0; s < spokeDivs; s++) {
                const isMajor = (spokeDivs <= 12) ? true : (this._gridStyle === 'weekly-28d' ? (s % 7 === 0) : (s % (spokeDivs === 96 ? 4 : 6) === 0));
                if (isMajor) {
                    targetArcAngles.push((s / spokeDivs) * Math.PI * 2 - Math.PI / 2);
                }
            }
        } else {
            targetArcAngles.push(primaryAngleRad);
        }

        const drawRad = degToRad(this._penDrawAngle);
        for (const baseAngleRad of targetArcAngles) {
            for (let i = 1; i < majorRings; i++) {
                const ringRatio = i / majorRings;
                const targetR = innerHubR + ringRatio * totalSpanR;
                const val = scaleLo + ringRatio * scaleSpan;

                const baseAng = this._getRefAngleForRadius(targetR, cx, cy, R);
                const ang = baseAng + (baseAngleRad - drawRad);
                const bx = cx + Math.cos(ang) * targetR;
                const by = cy + Math.sin(ang) * targetR;

                const targetR2 = Math.min(outerScaleR, targetR + 2);
                const baseAng2 = this._getRefAngleForRadius(targetR2, cx, cy, R);
                const ang2 = baseAng2 + (baseAngleRad - drawRad);
                const bx2 = cx + Math.cos(ang2) * targetR2;
                const by2 = cy + Math.sin(ang2) * targetR2;

                const tx = bx2 - bx;
                const ty = by2 - by;
                const tLen = Math.hypot(tx, ty) || 1;

                let nx = -ty / tLen;
                let ny =  tx / tLen;

                const toPtX = bx - cx;
                const toPtY = by - cy;
                if ((toPtX * ny - toPtY * nx) < 0) {
                    nx = -nx;
                    ny = -ny;
                }

                const gap = 6 * scale;
                const lx = bx + nx * gap;
                const ly = by + ny * gap;

                ctx.save();
                ctx.translate(lx, ly);

                const ringAng = Math.atan2(ly - cy, lx - cx);
                let textAngle = ringAng + Math.PI / 2;
                let normAngle = Math.atan2(Math.sin(textAngle), Math.cos(textAngle));
                let isFlipped = false;
                if (normAngle > Math.PI / 2 || normAngle < -Math.PI / 2) {
                    textAngle += Math.PI;
                    isFlipped = true;
                }
                ctx.rotate(textAngle);

                ctx.textAlign = isFlipped ? 'right' : 'left';
                ctx.textBaseline = 'middle';

                const textStr = val.toFixed(0);

                ctx.strokeStyle = bgGradColors[1];
                ctx.lineWidth = 3.5 * scale;
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeText(textStr, 0, 0);

                ctx.fillStyle = textColor;
                ctx.fillText(textStr, 0, 0);
                ctx.restore();
            }
        }

        this._drawOuterRimCopyright(ctx, cx, cy, R, gColor.minor, scale);
        this._drawCenterMetadataBlock(ctx, cx, cy, textColor, gColor.major, scale);
        this._drawCentreHub(ctx, cx, cy, scale);
    }

    _drawOuterRimCopyright(ctx, cx, cy, R, faintColor, scale = 1) {
        const text = "© NFFP 2026 All Rights Reserved";
        const fontSize = 7.2 * scale;
        const font = `500 ${fontSize.toFixed(1)}px 'Roboto', 'Arial', sans-serif`;
        const radius = R * 0.950;
        const charArcWidth = 4.6 * scale;
        const charAngleStep = charArcWidth / radius;

        ctx.save();
        ctx.fillStyle = faintColor;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const startAngle = (Math.PI / 2) - ((text.length / 2) * charAngleStep);

        for (let i = 0; i < text.length; i++) {
            const charAngle = startAngle + (i * charAngleStep);
            const x = cx + Math.cos(charAngle) * radius;
            const y = cy + Math.sin(charAngle) * radius;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(charAngle + Math.PI / 2);
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }
        ctx.restore();
    }

    _drawCenterMetadataBlock(ctx, cx, cy, textColor, borderStyle, scale = 1) {
        ctx.save();
        ctx.fillStyle = textColor;
        const titleFontSize = 8.5 * scale;
        ctx.font = `600 ${titleFontSize.toFixed(1)}px 'Roboto', 'Arial', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const chartNumbers = {
            'standard-24h':   'CHART NO. CR-2401',
            'weekly-7d':      'CHART NO. CR-7007',
            'weekly-28d':     'CHART NO. CR-2828',
            'monthly-31d':    'CHART NO. CR-3131',
            'annual-12m':     'CHART NO. CR-1212',
            'graph-quad':     'CHART NO. CR-9099',
            'polar-12h':      'CHART NO. CR-1202',
            'spiral-target':  'CHART NO. CR-8003',
            'concentric-only':'CHART NO. CR-5004',
            'blank-clean':    'CHART NO. CR-0000'
        };

        const text = chartNumbers[this._gridStyle] || 'CHART NO. CR-2401';
        const W = this._chartCanvas.width;
        const R = W / 2 - 2;
        const textRadius = R * 0.13;
        const charArcWidth = 4.8 * scale;
        const charAngleStep = charArcWidth / textRadius;
        const startAngle = (-Math.PI / 2) - ((text.length / 2) * charAngleStep);

        for (let i = 0; i < text.length; i++) {
            const charAngle = startAngle + (i * charAngleStep);
            const x = cx + Math.cos(charAngle) * textRadius;
            const y = cy + Math.sin(charAngle) * textRadius;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(charAngle + Math.PI / 2);
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }

        const subFontSize = 7.5 * scale;
        ctx.font = `500 ${subFontSize.toFixed(1)}px 'Roboto', 'Arial', sans-serif`;
        ctx.fillText('DATE: ____________', cx, cy + (25 * scale));
        ctx.fillText('LOCATION: ________', cx, cy + (36 * scale));
        ctx.restore();
    }

    _drawOuterRimZebra(ctx, cx, cy, R, gridColor, textColor, scale = 1) {
        ctx.save();
        const outerR = R * 0.985;
        const innerR = R * 0.965;
        const midZebraR = 0.5 * (innerR + outerR);

        const drawRad = degToRad(this._penDrawAngle);
        const zebraKinematicOffset = this._getRefAngleForRadius(midZebraR, cx, cy, R) - drawRad;

        let blocks = 72;
        switch (this._gridStyle) {
            case 'standard-24h':  blocks = 48; break;
            case 'weekly-7d':     blocks = 56; break;
            case 'monthly-31d':   blocks = 62; break;
            case 'annual-12m':    blocks = 48; break;
            case 'polar-12h':     blocks = 48; break;
            case 'graph-quad':    blocks = 96; break;
            case 'spiral-target': blocks = 60; break;
            default:              blocks = 72; break;
        }

        const angleStep = (Math.PI * 2) / blocks;

        for (let i = 0; i < blocks; i++) {
            const startAngle = (i * angleStep) - Math.PI / 2 + zebraKinematicOffset;
            const endAngle   = ((i + 1) * angleStep) - Math.PI / 2 + zebraKinematicOffset;

            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, endAngle, false);
            ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = (i % 2 === 0) ? gridColor : 'transparent';
            ctx.fill();

            ctx.strokeStyle = gridColor;
            ctx.lineWidth   = 0.4 * scale;
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawCentreHub(ctx, cx, cy, scale = 1) {
        const hubGrad = ctx.createRadialGradient(cx - (5 * scale), cy - (5 * scale), 2 * scale, cx, cy, 18 * scale);
        hubGrad.addColorStop(0, '#888');
        hubGrad.addColorStop(1, '#333');
        ctx.beginPath();
        ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
        ctx.fillStyle = hubGrad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#aaa';
        ctx.fill();
    }

    recordTraceSample(penNorms, discAngleDeg) {
        this._traceHistory.push({ discAngleDeg, penNorms: [...penNorms] });
        if (this._traceHistory.length > 5000) {
            this._traceHistory.shift();
        }
    }

    drawPenTraces(penNorms, discAngleDeg, recordHistory = true) {
        if (recordHistory) {
            this.recordTraceSample(penNorms, discAngleDeg);
        }

        const ctx = this._chartCtx;
        const W   = this._chartCanvas.width;
        const cx  = W / 2;
        const cy  = W / 2;
        const R   = W / 2 - 2;

        const innerR = R * 0.16;
        const outerR = R * 0.94;

        const activeCount = Math.min(4, Math.max(1, this._penCount));

        for (let i = 0; i < activeCount; i++) {
            const pvNorm = penNorms[i] !== undefined ? penNorms[i] : 0.5;
            const penR = innerR + pvNorm * (outerR - innerR);

            const baseAng = this._getRefAngleForRadius(penR, cx, cy, R);
            const canvasAng = baseAng - degToRad(discAngleDeg);
            const px = cx + Math.cos(canvasAng) * penR;
            const py = cy + Math.sin(canvasAng) * penR;

            const prev = this._prevPenCanvas[i];
            if (prev) {
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(px, py);
                ctx.strokeStyle = this._penColors[i] || '#ff4060';
                ctx.lineWidth   = (i === 0) ? this._traceLineWidth : (this._traceLineWidth * 0.88);
                ctx.stroke();
            }

            this._prevPenCanvas[i] = { x: px, y: py };
        }
    }

    updatePenArms(penNorms) {
        const W      = this._chartCanvas.width;
        const cx     = W / 2;
        const cy     = W / 2;
        const R      = W / 2 - 2;
        const innerR = R * 0.16;
        const outerR = R * 0.94;

        const mountRad = degToRad(this._armMountAngle);
        const mountCos = Math.cos(mountRad);
        const mountSin = Math.sin(mountRad);
        const perpX    = -mountSin;
        const perpY    = mountCos;

        const housingR   = R * 0.98;
        const basePivotX = cx + mountCos * housingR;
        const basePivotY = cy + mountSin * housingR;

        const activeCount = Math.min(4, Math.max(1, this._penCount));
        const pivotOffsets = [0, -0.015, 0.015, 0.030];

        const setAttr = (id, attr, val) => {
            const el = document.getElementById(id);
            if (el) el.setAttribute(attr, String(typeof val === 'number' ? val.toFixed(1) : val));
        };

        for (let i = 1; i <= 4; i++) {
            const group = document.getElementById(`p${i}ArmGroup`);
            if (group) {
                group.style.display = (i <= activeCount) ? 'block' : 'none';
            }
        }

        for (let i = 0; i < activeCount; i++) {
            const pIdx   = i + 1;
            const pvNorm = penNorms[i] !== undefined ? penNorms[i] : 0.5;
            const penR   = innerR + pvNorm * (outerR - innerR);

            const pivX   = basePivotX + perpX * (W * pivotOffsets[i]);
            const pivY   = basePivotY + perpY * (W * pivotOffsets[i]);

            const baseAng = this._getRefAngleForRadius(penR, cx, cy, R);
            const tipX = cx + Math.cos(baseAng) * penR;
            const tipY = cy + Math.sin(baseAng) * penR;

            const color  = this._penColors[i] || '#ff4060';

            setAttr(`p${pIdx}BodyLine`,   'x1', pivX); setAttr(`p${pIdx}BodyLine`,   'y1', pivY);
            setAttr(`p${pIdx}BodyLine`,   'x2', tipX); setAttr(`p${pIdx}BodyLine`,   'y2', tipY);

            setAttr(`p${pIdx}StripeLine`, 'x1', pivX); setAttr(`p${pIdx}StripeLine`, 'y1', pivY);
            setAttr(`p${pIdx}StripeLine`, 'x2', tipX); setAttr(`p${pIdx}StripeLine`, 'y2', tipY);
            setAttr(`p${pIdx}StripeLine`, 'stroke', color);

            setAttr(`p${pIdx}TipDot`,     'cx', tipX); setAttr(`p${pIdx}TipDot`,     'cy', tipY);
            setAttr(`p${pIdx}TipDot`,     'fill', color);

            setAttr(`p${pIdx}TipGlint`,   'cx', tipX - 3); setAttr(`p${pIdx}TipGlint`, 'cy', tipY - 3);

            setAttr(`p${pIdx}PivotBase`,  'cx', pivX); setAttr(`p${pIdx}PivotBase`,  'cy', pivY);
            setAttr(`p${pIdx}PivotInner`, 'cx', pivX); setAttr(`p${pIdx}PivotInner`, 'cy', pivY);
            setAttr(`p${pIdx}PivotGlint`, 'cx', pivX - 2); setAttr(`p${pIdx}PivotGlint`, 'cy', pivY - 2);
        }
    }
}
