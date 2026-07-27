/**
 * StripTrendRenderer — Decoupled renderer for strip trend scrolling canvas.
 */
export class StripTrendRenderer {
    constructor(canvas) {
        this._trendCanvas = canvas;
        this._trendCtx    = canvas.getContext('2d');
        this.drawBackground();
    }

    drawBackground() {
        const ctx = this._trendCtx;
        const W   = this._trendCanvas.width;
        const H   = this._trendCanvas.height;
        ctx.fillStyle = '#070b12';
        ctx.fillRect(0, 0, W, H);
        this.drawGrid();
    }

    drawGrid() {
        const ctx = this._trendCtx;
        const W   = this._trendCanvas.width;
        const H   = this._trendCanvas.height;
        const div = 5;
        for (let i = 0; i <= div; i++) {
            const x = (i / div) * W;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth   = 0.8;
            ctx.stroke();
        }
    }

    appendSample(pen1Norm, pen2Norm) {
        const ctx = this._trendCtx;
        const W   = this._trendCanvas.width;
        const H   = this._trendCanvas.height;
        const ROW = 2;

        const imageData = ctx.getImageData(0, ROW, W, H - ROW);
        ctx.putImageData(imageData, 0, 0);

        ctx.fillStyle = '#070b12';
        ctx.fillRect(0, H - ROW, W, ROW);

        ctx.beginPath();
        ctx.moveTo(0, H - ROW);
        ctx.lineTo(W, H - ROW);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth   = 0.5;
        ctx.stroke();

        const pen1X = Math.round(pen1Norm * (W - 4)) + 2;
        ctx.beginPath();
        ctx.arc(pen1X, H - ROW / 2, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,60,80,0.9)';
        ctx.fill();

        const pen2X = Math.round(pen2Norm * (W - 4)) + 2;
        ctx.beginPath();
        ctx.arc(pen2X, H - ROW / 2, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,180,220,0.85)';
        ctx.fill();
    }

    clear() {
        this.drawBackground();
    }
}
