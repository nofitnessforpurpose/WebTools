/**
 * StripTrendRenderer — Linear scrolling strip-chart trend renderer.
 */
class StripTrendRenderer {
    constructor(canvas) {
        this._trendCanvas = canvas;
        this._trendCtx    = canvas.getContext('2d');
        this._historyP1   = [];
        this._historyP2   = [];
        this._maxPoints   = 180;
    }

    appendSample(p1Norm, p2Norm) {
        this._historyP1.push(p1Norm);
        this._historyP2.push(p2Norm);

        if (this._historyP1.length > this._maxPoints) {
            this._historyP1.shift();
            this._historyP2.shift();
        }

        this.draw();
    }

    draw() {
        const ctx = this._trendCtx;
        const W = this._trendCanvas.width;
        const H = this._trendCanvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;

        for (let y = 0; y < H; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        for (let x = 0; x < W; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        this._drawTrace(this._historyP1, '#ff4060', W, H);
        this._drawTrace(this._historyP2, '#00b4d8', W, H);
    }

    _drawTrace(history, color, W, H) {
        if (history.length < 2) return;

        const ctx = this._trendCtx;
        const stepX = W / (this._maxPoints - 1);

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        const startIdx = this._maxPoints - history.length;

        for (let i = 0; i < history.length; i++) {
            const x = (startIdx + i) * stepX;
            const y = H - (history[i] * (H - 10) + 5);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.restore();
    }

    clear() {
        this._historyP1 = [];
        this._historyP2 = [];
        this.draw();
    }
}

if (typeof window !== 'undefined') {
    window.StripTrendRenderer = StripTrendRenderer;
}
