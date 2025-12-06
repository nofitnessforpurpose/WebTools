'use strict';

function calcNotepadKey(password, nine) {
    var constants = [
        [0x25, 0x3D, 0xC5, 0x7, 0x3, 0xA9, 0x97, 0xC5],// 8 BYTE
        [0x3D, 0x25, 0xCB, 0x3, 0xB, 0xA1, 0xAD, 0xCB],// 9 BYTE
    ];
    var cnst = constants[nine ? 1 : 0];
    var p = [0, 0, 0, 0, 0, 0, 0, 0];
    // step 1.
    var s = password.toUpperCase();
    var len = s.length;
    while (s.length < 8) s = s + s;
    var t = 0;
    for (var i = 0; i < 8; i++) {
        p[i] = s.charCodeAt(i);
        t += p[i];
    }
    t &= 7;
    // step 2
    var g = [0, 0, 0, 0];
    for (var i = 0; i < 4; i++) {
        g[i] = (p[i] + cnst[0]) * (p[7 - i] + cnst[1]) * cnst[2];
        g[i] >>= 8;
    }
    // step 3
    var f = [0, 0];
    for (var i = 0; i < 2; i++) {
        f[i] = (g[1 - i] + cnst[3]) * (g[2 + i] + cnst[4]) * cnst[5 + i];
        f[i] = (f[i] - (f[i] & 0xff)) / 256;   // cannot use >> as f[i] is longer than 32 bits
    }
    // step 4
    for (var i = 0; i < 2; i++) {
        var low = f[i] & 0xffff;
        var high = ((f[i] & 0xffff0000) >> 16) & 0xffff;
        f[i] = low * 0x10000 + high;
    }
    //step 5
    for (var i = 0; i < 2; i++) {
        f[i] = f[i] * cnst[7];
        f[i] = (f[i] - (f[i] & 0xff)) / 256;   // cannot use >> as f[i] is longer than 32 bits
    }
    var d = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var j = 0; j < 2; j++) {
        for (var i = 0; i < 4; i++) {
            d[i + j * 4] = (f[j] >> (8 * i)) & 0xFF;
        }
    }

    if (!nine) return d;

    // step 6
    for (var i = 0; i < 8; i++) {
        p[i] = (p[i] + d[7 - i]) & 0xFF;
    }
    //step 7
    p[8] = (len + d[t]) & 0xFF;
    return p;
}

function decodeMessage(key, message, start) {
    var s = "";
    var i = start;
    // handle unencrypted title
    do {
        if (message[i] === undefined) return s;
        s += String.fromCharCode(message[i]);
        i++;
    } while (message[i - 1] != 58);
    // handle optional unencrypted line break
    if (message[i] == 0) {
        i++;
        s += "\n";
    }
    //handle encrypted message
    var kix = 0;
    var c = 0;
    while (message[i] !== undefined) {
        var t = message[i++];
        c = (c + 163) & 0xFF;
        key[kix] = (key[kix] + c) & 0xFF;
        t = (t - key[kix]) & 0xFF;
        if (t == 0) s += "\n";
        else s += String.fromCharCode(t);
        kix = (kix + 1) & 7;
    }
    return s;
}

function encodeMessage(key, message) {
    var output = [];
    var ix = message.indexOf(":");
    // handle unencrypted title
    if (ix <= 8) {
        for (var i = 0; i <= ix; i++) {
            output[output.length] = message.charCodeAt(i);
        }
        ix++;
        // handle optional unencrypted line break
        if (message.charCodeAt(ix) == 10) {
            output[output.length] = 0;
            ix++;
        }
    } else ix = 0; // should not happen
    //handle encrypted message
    var kix = 0;
    var c = 0;
    while (ix < message.length) {
        var t = message.charCodeAt(ix++);
        if (t == 10) t = 0;
        c = (c + 163) & 0xFF;
        key[kix] = (key[kix] + c) & 0xFF;
        t = (t + key[kix]) & 0xFF;
        output[output.length] = t;
        kix = (kix + 1) & 7;
    }
    return output;
}
