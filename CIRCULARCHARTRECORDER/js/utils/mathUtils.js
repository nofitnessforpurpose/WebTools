/**
 * Mathematical & Kinematic Utilities for Chart Recorder Emulator
 */

function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
    return (rad * 180) / Math.PI;
}

function normaliseAngleDeg(deg) {
    return (Math.round(deg) % 360 + 360) % 360;
}

/**
 * Solves the kinematic pen arm Law of Cosines sweep angle at radius r.
 */
function getRefAngleForRadius(r, cx, cy, R, armMountAngleDeg = 195, penDrawAngleDeg = 260) {
    const innerHubR = R * 0.16;
    const outerScaleR = R * 0.94;
    const midR = innerHubR + 0.5 * (outerScaleR - innerHubR);

    const mountRad = degToRad(armMountAngleDeg);
    const drawRad  = degToRad(penDrawAngleDeg);

    const housingR = R * 0.98;
    const pivX = cx + Math.cos(mountRad) * housingR;
    const pivY = cy + Math.sin(mountRad) * housingR;

    const midX = cx + Math.cos(drawRad) * midR;
    const midY = cy + Math.sin(drawRad) * midR;

    const D = Math.hypot(pivX - cx, pivY - cy);
    const thetaPivot = Math.atan2(pivY - cy, pivX - cx);

    let L = Math.hypot(midX - pivX, midY - pivY);

    const maxCollinearR = innerHubR * 0.7;
    if (Math.abs(D - L) >= (D - maxCollinearR)) {
        L = D * 0.95;
    }

    let cosBeta = (D * D + r * r - L * L) / (2 * D * r);
    cosBeta = Math.min(0.995, Math.max(-0.995, cosBeta));
    const beta = Math.acos(cosBeta);

    let cosBetaMid = (D * D + midR * midR - L * L) / (2 * D * midR);
    cosBetaMid = Math.min(0.995, Math.max(-0.995, cosBetaMid));
    const betaMid = Math.acos(cosBetaMid);

    const diffPlus  = Math.abs(Math.atan2(Math.sin(thetaPivot + betaMid - drawRad), Math.cos(thetaPivot + betaMid - drawRad)));
    const diffMinus = Math.abs(Math.atan2(Math.sin(thetaPivot - betaMid - drawRad), Math.cos(thetaPivot - betaMid - drawRad)));

    const sign = (diffPlus <= diffMinus) ? 1 : -1;
    return thetaPivot + sign * beta;
}

if (typeof window !== 'undefined') {
    window.degToRad = degToRad;
    window.radToDeg = radToDeg;
    window.normaliseAngleDeg = normaliseAngleDeg;
    window.getRefAngleForRadius = getRefAngleForRadius;
}
