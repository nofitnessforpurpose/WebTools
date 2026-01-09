var CharacterMap = (function () {
    var doc = document;
    var win = window;

    // Font Data XP (The corrected data from previous steps)
    var FONT_DATA_XP = new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 4, 0, 10, 10, 10, 0, 0, 0, 0, 0, 10, 10, 31, 10, 31, 10, 10, 0, 4, 15, 20, 14, 5, 30, 4, 0, 24, 25, 2, 4, 8, 19, 3, 0, 12, 18, 20, 8, 21, 18, 13, 0, 12, 4, 8, 0, 0, 0, 0, 0,
        2, 4, 8, 8, 8, 4, 2, 0, 8, 4, 2, 2, 2, 4, 8, 0, 0, 4, 21, 14, 21, 4, 0, 0, 0, 4, 4, 31, 4, 4, 0, 0, 0, 0, 0, 0, 12, 4, 8, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 12, 0, 0, 1, 2, 4, 8, 16, 0, 0,
        14, 17, 19, 21, 25, 17, 14, 0, 4, 12, 4, 4, 4, 4, 14, 0, 14, 17, 1, 2, 4, 8, 31, 0, 31, 2, 4, 2, 1, 17, 14, 0, 2, 6, 10, 18, 31, 2, 2, 0, 31, 16, 30, 1, 1, 17, 14, 0, 6, 8, 16, 30, 17, 17, 14, 0, 31, 1, 2, 4, 8, 8, 8, 0,
        14, 17, 17, 14, 17, 17, 14, 0, 14, 17, 17, 15, 1, 2, 12, 0, 0, 12, 12, 0, 12, 12, 0, 0, 0, 12, 12, 0, 12, 4, 8, 0, 2, 4, 8, 16, 8, 4, 2, 0, 0, 0, 31, 0, 31, 0, 0, 0, 8, 4, 2, 1, 2, 4, 8, 0, 14, 17, 1, 2, 4, 0, 4, 0,
        14, 17, 1, 13, 21, 21, 14, 0, 14, 17, 17, 17, 31, 17, 17, 0, 30, 17, 17, 30, 17, 17, 30, 0, 14, 17, 16, 16, 16, 17, 14, 0, 28, 18, 17, 17, 17, 18, 28, 0, 31, 16, 16, 30, 16, 16, 31, 0, 31, 16, 16, 30, 16, 16, 16, 0, 14, 17, 16, 23, 17, 17, 15, 0,
        17, 17, 17, 31, 17, 17, 17, 0, 14, 4, 4, 4, 4, 4, 14, 0, 7, 2, 2, 2, 2, 18, 12, 0, 17, 18, 20, 24, 20, 18, 17, 0, 16, 16, 16, 16, 16, 16, 31, 0, 17, 27, 21, 21, 17, 17, 17, 0, 17, 17, 25, 21, 19, 17, 17, 0, 14, 17, 17, 17, 17, 17, 14, 0,
        30, 17, 17, 30, 16, 16, 16, 0, 14, 17, 17, 17, 21, 18, 13, 0, 30, 17, 17, 30, 20, 18, 17, 0, 15, 16, 16, 14, 1, 1, 30, 0, 31, 4, 4, 4, 4, 4, 4, 0, 17, 17, 17, 17, 17, 17, 14, 0, 17, 17, 17, 17, 17, 10, 4, 0, 17, 17, 17, 21, 21, 21, 10, 0,
        17, 17, 10, 4, 10, 17, 17, 0, 17, 17, 17, 10, 4, 4, 4, 0, 31, 1, 2, 4, 8, 16, 31, 0, 14, 8, 8, 8, 8, 8, 14, 0, 17, 10, 31, 4, 31, 4, 4, 0, 14, 2, 2, 2, 2, 2, 14, 0, 4, 10, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0,
        8, 4, 2, 0, 0, 0, 0, 0, 0, 0, 14, 1, 15, 17, 15, 0, 16, 16, 22, 25, 17, 17, 30, 0, 0, 0, 14, 16, 16, 17, 14, 0, 1, 1, 13, 19, 17, 17, 15, 0, 0, 0, 14, 17, 31, 16, 14, 0, 6, 9, 8, 28, 8, 8, 8, 0, 0, 15, 17, 17, 15, 1, 14, 0,
        16, 16, 22, 25, 17, 17, 17, 0, 4, 0, 12, 4, 4, 4, 14, 0, 2, 0, 6, 2, 2, 18, 12, 0, 16, 16, 18, 20, 24, 20, 18, 0, 12, 4, 4, 4, 4, 4, 14, 0, 0, 0, 26, 21, 21, 17, 17, 0, 0, 0, 22, 25, 17, 17, 17, 0, 0, 0, 14, 17, 17, 17, 14, 0,
        0, 0, 30, 17, 30, 16, 16, 0, 0, 0, 13, 19, 15, 1, 1, 0, 0, 0, 22, 25, 16, 16, 16, 0, 0, 0, 14, 16, 14, 1, 30, 0, 8, 8, 28, 8, 8, 9, 6, 0, 0, 0, 17, 17, 17, 19, 13, 0, 0, 0, 17, 17, 17, 10, 4, 0, 0, 0, 17, 17, 21, 21, 10, 0,
        0, 0, 17, 10, 4, 10, 17, 0, 0, 0, 17, 17, 15, 1, 14, 0, 0, 0, 31, 2, 4, 8, 31, 0, 2, 4, 4, 8, 4, 4, 2, 0, 4, 4, 4, 4, 4, 4, 4, 0, 8, 4, 4, 2, 4, 4, 8, 0, 0, 4, 2, 31, 2, 4, 0, 0, 0, 4, 8, 31, 8, 4, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 20, 28, 0, 7, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 28, 0, 0, 0, 0, 0, 16, 8, 4, 0, 0, 0, 0, 12, 12, 0, 0, 0, 0, 31, 1, 31, 1, 2, 4, 0, 0, 0, 31, 1, 6, 4, 8, 0,
        0, 0, 2, 4, 12, 20, 4, 0, 0, 0, 4, 31, 17, 1, 6, 0, 0, 0, 0, 31, 4, 4, 31, 0, 0, 0, 2, 31, 6, 10, 18, 0, 0, 0, 8, 31, 9, 10, 8, 0, 0, 0, 0, 14, 2, 2, 31, 0, 0, 0, 30, 2, 30, 2, 30, 0, 0, 0, 0, 21, 21, 1, 6, 0,
        0, 0, 0, 31, 0, 0, 0, 0, 31, 1, 5, 6, 4, 4, 8, 0, 1, 2, 4, 12, 20, 4, 4, 0, 4, 31, 17, 17, 1, 2, 4, 0, 0, 31, 4, 4, 4, 4, 31, 0, 2, 31, 2, 6, 10, 18, 2, 0, 8, 31, 9, 9, 9, 9, 18, 0, 4, 31, 4, 31, 4, 4, 4, 0,
        0, 15, 9, 17, 1, 2, 12, 0, 8, 15, 18, 2, 2, 2, 4, 0, 0, 31, 1, 1, 1, 1, 31, 0, 10, 31, 10, 10, 2, 4, 8, 0, 0, 24, 1, 25, 1, 2, 28, 0, 0, 31, 1, 2, 4, 10, 17, 0, 8, 31, 9, 10, 8, 8, 7, 0, 0, 17, 17, 9, 1, 2, 12, 0,
        0, 15, 9, 21, 3, 2, 12, 0, 2, 28, 4, 31, 4, 4, 8, 0, 0, 21, 21, 21, 1, 2, 4, 0, 14, 0, 31, 4, 4, 4, 8, 0, 8, 8, 8, 12, 10, 8, 8, 0, 4, 4, 31, 4, 4, 8, 16, 0, 0, 14, 0, 0, 0, 0, 31, 0, 0, 31, 1, 10, 4, 10, 16, 0,
        4, 31, 2, 4, 14, 21, 4, 0, 2, 2, 2, 2, 2, 4, 8, 0, 0, 4, 2, 17, 17, 17, 17, 0, 16, 16, 31, 16, 16, 16, 15, 0, 0, 31, 1, 1, 1, 2, 12, 0, 0, 8, 20, 2, 1, 1, 0, 0, 4, 31, 4, 4, 21, 21, 4, 0, 0, 31, 1, 1, 10, 4, 2, 0,
        0, 14, 0, 14, 0, 14, 1, 0, 0, 4, 8, 16, 17, 31, 1, 0, 0, 1, 1, 10, 4, 10, 16, 0, 0, 31, 8, 31, 8, 8, 7, 0, 8, 8, 31, 9, 10, 8, 8, 0, 0, 14, 2, 2, 2, 2, 31, 0, 0, 31, 1, 31, 1, 1, 31, 0, 14, 0, 31, 1, 1, 2, 4, 0,
        18, 18, 18, 18, 2, 4, 8, 0, 0, 4, 20, 20, 21, 21, 22, 0, 0, 16, 16, 17, 18, 20, 24, 0, 0, 31, 17, 17, 17, 17, 31, 0, 0, 31, 17, 17, 1, 2, 4, 0, 0, 24, 0, 1, 1, 2, 28, 0, 4, 18, 8, 0, 0, 0, 0, 0, 28, 20, 28, 0, 0, 0, 0, 0,
        0, 0, 9, 21, 18, 18, 13, 0, 10, 0, 14, 1, 15, 17, 15, 0, 0, 0, 14, 17, 30, 17, 30, 16, 0, 0, 14, 16, 12, 17, 14, 0, 0, 0, 17, 17, 17, 19, 29, 16, 0, 0, 15, 20, 18, 17, 14, 0, 0, 0, 6, 9, 17, 17, 30, 16, 0, 0, 15, 17, 17, 17, 15, 1,
        0, 0, 7, 4, 4, 20, 8, 0, 0, 2, 26, 2, 0, 0, 0, 0, 2, 0, 6, 2, 2, 2, 2, 2, 0, 20, 8, 20, 0, 0, 0, 0, 0, 4, 14, 20, 21, 14, 4, 0, 8, 8, 28, 8, 28, 8, 15, 0, 14, 0, 22, 25, 17, 17, 17, 0, 10, 0, 14, 17, 17, 17, 14, 0,
        0, 0, 22, 25, 17, 17, 30, 16, 0, 0, 13, 19, 17, 17, 15, 1, 0, 14, 17, 31, 17, 17, 14, 0, 0, 0, 0, 11, 21, 26, 0, 0, 0, 0, 14, 17, 17, 10, 27, 0, 10, 0, 17, 17, 17, 19, 13, 0, 31, 16, 8, 4, 8, 16, 31, 0, 0, 0, 31, 10, 10, 10, 19, 0,
        31, 0, 17, 10, 4, 10, 17, 0, 0, 0, 17, 17, 17, 17, 15, 1, 0, 1, 30, 4, 31, 4, 4, 0, 0, 0, 31, 8, 15, 9, 17, 0, 0, 0, 31, 21, 31, 17, 17, 0, 0, 0, 4, 0, 31, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 31, 31, 31
    ]);

    // Font Data LZ (The new data from user)
    var FONT_DATA_LZ = new Uint8Array([
        0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 4, 0, 10, 10, 10, 0, 0, 0, 0, 0, 10, 10, 31, 10, 31, 10, 10, 0, 4, 15, 20, 14, 5, 30, 4, 0, 24, 25, 2, 4, 8, 19, 3, 0, 12, 18, 20, 8, 21, 18, 13, 0, 12, 4, 8, 0, 0, 0, 0, 0,
        2, 4, 8, 8, 8, 4, 2, 0, 8, 4, 2, 2, 2, 4, 8, 0, 0, 4, 21, 14, 21, 4, 0, 0, 0, 4, 4, 31, 4, 4, 0, 0, 0, 0, 0, 0, 12, 4, 8, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 12, 0, 0, 1, 2, 4, 8, 16, 0, 0,
        14, 17, 19, 21, 25, 17, 14, 0, 4, 12, 4, 4, 4, 4, 14, 0, 14, 17, 1, 2, 4, 8, 31, 0, 31, 2, 4, 2, 1, 17, 14, 0, 2, 6, 10, 18, 31, 2, 2, 0, 31, 16, 30, 1, 1, 17, 14, 0, 6, 8, 16, 30, 17, 17, 14, 0, 31, 1, 2, 4, 8, 8, 8, 0,
        14, 17, 17, 14, 17, 17, 14, 0, 14, 17, 17, 15, 1, 2, 12, 0, 0, 12, 12, 0, 12, 12, 0, 0, 0, 12, 12, 0, 12, 4, 8, 0, 2, 4, 8, 16, 8, 4, 2, 0, 0, 0, 31, 0, 31, 0, 0, 0, 8, 4, 2, 1, 2, 4, 8, 0, 14, 17, 1, 2, 4, 0, 4, 0,
        14, 17, 1, 13, 21, 21, 14, 0, 14, 17, 17, 17, 31, 17, 17, 0, 30, 17, 17, 30, 17, 17, 30, 0, 14, 17, 16, 16, 16, 17, 14, 0, 28, 18, 17, 17, 17, 18, 28, 0, 31, 16, 16, 30, 16, 16, 31, 0, 31, 16, 16, 30, 16, 16, 16, 0, 14, 17, 16, 23, 17, 17, 15, 0,
        17, 17, 17, 31, 17, 17, 17, 0, 14, 4, 4, 4, 4, 4, 14, 0, 7, 2, 2, 2, 2, 18, 12, 0, 17, 18, 20, 24, 20, 18, 17, 0, 16, 16, 16, 16, 16, 16, 31, 0, 17, 27, 21, 21, 17, 17, 17, 0, 17, 17, 25, 21, 19, 17, 17, 0, 14, 17, 17, 17, 17, 17, 14, 0,
        30, 17, 17, 30, 16, 16, 16, 0, 14, 17, 17, 17, 21, 18, 13, 0, 30, 17, 17, 30, 20, 18, 17, 0, 15, 16, 16, 14, 1, 1, 30, 0, 31, 4, 4, 4, 4, 4, 4, 0, 17, 17, 17, 17, 17, 17, 14, 0, 17, 17, 17, 17, 17, 10, 4, 0, 17, 17, 17, 21, 21, 21, 10, 0,
        17, 17, 10, 4, 10, 17, 17, 0, 17, 17, 17, 10, 4, 4, 4, 0, 31, 1, 2, 4, 8, 16, 31, 0, 14, 8, 8, 8, 8, 8, 14, 0, 0, 16, 8, 4, 2, 1, 0, 0, 14, 2, 2, 2, 2, 2, 14, 0, 4, 10, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0,
        8, 4, 2, 0, 0, 0, 0, 0, 0, 0, 14, 1, 15, 17, 15, 0, 16, 16, 22, 25, 17, 17, 30, 0, 0, 0, 14, 16, 16, 17, 14, 0, 1, 1, 13, 19, 17, 17, 15, 0, 0, 0, 14, 17, 31, 16, 14, 0, 6, 9, 8, 28, 8, 8, 8, 0, 0, 15, 17, 17, 15, 1, 14, 0,
        16, 16, 22, 25, 17, 17, 17, 0, 4, 0, 12, 4, 4, 4, 14, 0, 2, 0, 6, 2, 2, 18, 12, 0, 16, 16, 18, 20, 24, 20, 18, 0, 12, 4, 4, 4, 4, 4, 14, 0, 0, 0, 26, 21, 21, 17, 17, 0, 0, 0, 22, 25, 17, 17, 17, 0, 0, 0, 14, 17, 17, 17, 14, 0,
        0, 0, 30, 17, 30, 16, 16, 0, 0, 0, 13, 19, 15, 1, 1, 0, 0, 0, 22, 25, 16, 16, 16, 0, 0, 0, 14, 16, 14, 1, 30, 0, 8, 8, 28, 8, 8, 9, 6, 0, 0, 0, 17, 17, 17, 19, 13, 0, 0, 0, 17, 17, 17, 10, 4, 0, 0, 0, 17, 17, 21, 21, 10, 0,
        0, 0, 17, 10, 4, 10, 17, 0, 0, 0, 17, 17, 15, 1, 14, 0, 0, 0, 31, 2, 4, 8, 31, 0, 2, 4, 4, 8, 4, 4, 2, 0, 4, 4, 4, 4, 4, 4, 4, 0, 8, 4, 4, 2, 4, 4, 8, 0, 0, 4, 2, 31, 2, 4, 0, 0, 0, 4, 8, 31, 8, 4, 0, 0,
        14, 17, 16, 16, 17, 14, 4, 0, 10, 0, 17, 17, 17, 19, 13, 0, 2, 4, 14, 17, 31, 16, 14, 0, 4, 10, 14, 1, 15, 17, 15, 0, 10, 0, 14, 1, 15, 17, 15, 0, 8, 4, 14, 1, 15, 17, 15, 0, 4, 0, 14, 1, 15, 17, 15, 0, 0, 0, 14, 16, 17, 14, 4, 0,
        4, 10, 14, 17, 31, 16, 14, 0, 10, 0, 14, 17, 31, 16, 14, 0, 8, 4, 14, 17, 31, 16, 14, 0, 10, 0, 12, 4, 4, 4, 14, 0, 4, 10, 12, 4, 4, 4, 14, 0, 4, 2, 12, 4, 4, 4, 14, 0, 10, 0, 14, 17, 17, 31, 17, 0, 4, 0, 14, 17, 17, 31, 17, 0,
        4, 8, 31, 16, 30, 16, 31, 0, 0, 0, 26, 5, 30, 20, 11, 0, 15, 20, 20, 22, 28, 20, 23, 0, 4, 10, 0, 14, 17, 17, 14, 0, 10, 0, 0, 14, 17, 17, 14, 0, 4, 2, 0, 14, 17, 17, 14, 0, 4, 10, 17, 17, 17, 19, 13, 0, 8, 4, 17, 17, 17, 19, 13, 0,
        10, 0, 17, 17, 15, 1, 14, 0, 10, 0, 14, 17, 17, 17, 14, 0, 10, 0, 17, 17, 17, 17, 14, 0, 0, 0, 14, 19, 21, 25, 14, 0, 6, 9, 8, 28, 8, 30, 25, 0, 14, 19, 19, 21, 25, 25, 14, 0, 0, 0, 10, 4, 10, 0, 0, 0, 2, 5, 4, 14, 4, 8, 16, 0,
        2, 4, 14, 1, 15, 17, 15, 0, 4, 8, 12, 4, 4, 4, 14, 0, 4, 8, 0, 14, 17, 17, 14, 0, 2, 4, 17, 17, 17, 19, 13, 0, 5, 10, 22, 25, 17, 17, 17, 0, 5, 10, 17, 25, 21, 19, 17, 0, 14, 1, 15, 17, 15, 0, 14, 0, 14, 17, 17, 17, 14, 0, 14, 0,
        4, 0, 4, 8, 16, 17, 14, 0, 4, 14, 21, 4, 4, 4, 0, 0, 0, 4, 4, 4, 21, 14, 4, 0, 18, 20, 8, 22, 9, 2, 7, 0, 18, 20, 10, 22, 10, 15, 2, 0, 4, 0, 0, 4, 4, 4, 4, 0, 0, 5, 10, 20, 10, 5, 0, 0, 0, 20, 10, 5, 10, 20, 0, 0,
        14, 16, 14, 1, 17, 14, 4, 0, 0, 14, 16, 14, 1, 14, 4, 0, 14, 0, 14, 16, 23, 17, 14, 0, 14, 0, 15, 17, 15, 1, 14, 0, 4, 0, 14, 4, 4, 4, 14, 0, 2, 4, 14, 17, 17, 31, 17, 0, 4, 10, 14, 17, 17, 31, 17, 0, 8, 4, 14, 17, 17, 31, 17, 0,
        14, 17, 23, 21, 23, 17, 14, 0, 0, 0, 0, 12, 4, 4, 14, 0, 31, 9, 8, 8, 8, 8, 28, 0, 0, 0, 4, 10, 17, 17, 31, 0, 0, 0, 4, 10, 17, 17, 17, 0, 0, 31, 0, 14, 0, 31, 0, 0, 17, 10, 31, 4, 31, 4, 4, 0, 0, 31, 10, 10, 10, 10, 10, 0,
        14, 4, 14, 21, 14, 4, 14, 0, 4, 21, 21, 21, 21, 14, 4, 0, 0, 0, 0, 13, 18, 18, 13, 0, 0, 0, 10, 10, 4, 10, 4, 0, 0, 14, 8, 4, 10, 18, 12, 0, 0, 0, 14, 16, 28, 16, 14, 0, 5, 10, 14, 1, 15, 17, 15, 0, 5, 10, 14, 17, 17, 31, 17, 0,
        4, 6, 8, 8, 4, 2, 4, 0, 0, 0, 22, 9, 9, 9, 1, 0, 0, 0, 6, 9, 31, 18, 12, 0, 0, 0, 18, 20, 24, 20, 18, 0, 0, 0, 16, 8, 4, 10, 17, 0, 8, 12, 16, 12, 16, 12, 2, 0, 0, 0, 7, 12, 18, 12, 0, 0, 0, 0, 14, 16, 12, 2, 6, 0,
        0, 0, 14, 4, 4, 4, 2, 0, 0, 0, 18, 9, 9, 5, 6, 0, 4, 10, 31, 16, 30, 16, 31, 0, 10, 0, 31, 16, 30, 16, 31, 0, 4, 2, 31, 16, 30, 16, 31, 0, 0, 0, 4, 21, 21, 14, 4, 0, 2, 4, 14, 4, 4, 4, 14, 0, 4, 10, 14, 4, 4, 4, 14, 0,
        10, 0, 14, 4, 4, 4, 14, 0, 0, 0, 27, 17, 17, 21, 10, 0, 4, 8, 0, 13, 18, 18, 13, 0, 2, 4, 14, 16, 28, 16, 14, 0, 2, 4, 22, 9, 9, 9, 1, 0, 2, 4, 27, 17, 17, 21, 10, 0, 8, 4, 14, 4, 4, 4, 14, 0, 28, 20, 28, 0, 0, 0, 0, 0,
        2, 4, 14, 17, 17, 17, 14, 0, 0, 0, 14, 17, 30, 17, 30, 16, 4, 10, 14, 17, 17, 17, 14, 0, 8, 4, 14, 17, 17, 17, 14, 0, 5, 10, 0, 14, 17, 17, 14, 0, 5, 10, 14, 17, 17, 17, 14, 0, 0, 0, 17, 17, 19, 29, 16, 16, 0, 12, 18, 18, 28, 16, 16, 16,
        0, 0, 7, 4, 4, 20, 8, 0, 0, 2, 26, 2, 0, 0, 0, 0, 4, 10, 17, 17, 17, 17, 14, 0, 8, 4, 17, 17, 17, 17, 14, 0, 0, 4, 14, 20, 21, 14, 4, 0, 2, 4, 17, 17, 10, 4, 4, 0, 2, 4, 17, 17, 15, 1, 14, 0, 2, 4, 17, 17, 17, 17, 14, 0,
        28, 8, 14, 9, 14, 8, 28, 0, 4, 4, 31, 4, 4, 0, 31, 0, 0, 14, 17, 31, 17, 17, 14, 0, 0, 0, 0, 11, 21, 26, 0, 0, 0, 0, 14, 17, 17, 10, 27, 0, 21, 10, 21, 10, 21, 10, 21, 10, 31, 16, 8, 4, 8, 16, 31, 0, 0, 0, 31, 10, 10, 10, 19, 0,
        16, 8, 24, 10, 22, 15, 2, 0, 0, 10, 27, 31, 14, 14, 4, 0, 0, 4, 14, 31, 14, 4, 0, 0, 4, 14, 14, 27, 27, 4, 14, 0, 4, 14, 31, 31, 21, 4, 14, 0, 0, 0, 4, 0, 31, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 31, 31, 31
    ]);

    // Active Data
    var CURRENT_FONT_DATA = new Uint8Array(2048);

    // Function to load the selected font into CURRENT_FONT_DATA
    function loadFont(sourceData) {
        // Both source datasets seem to start at 0x20 in terms of content (first byte is 0, but offset 8 is '!')
        // We copy starting at offset 256 effectively. E.g. sourceData[0] -> FONT_DATA[256].

        // Clear current
        for (var k = 0; k < 2048; k++) CURRENT_FONT_DATA[k] = 0;

        // Copy loop
        var offset = 32 * 8; // 256
        for (var i = 0; i < sourceData.length; i++) {
            if (offset + i < CURRENT_FONT_DATA.length) {
                CURRENT_FONT_DATA[offset + i] = sourceData[i];
            }
        }
    }

    // Default load XP
    loadFont(FONT_DATA_XP);

    // Check if running as child
    if (window.location.search.indexOf('feature=charmap') !== -1) {
        window.addEventListener('load', initChildEnvironment);
    }

    function openWindow() {
        var width = 900;
        var height = 800;

        var left = (screen.width - width) / 2;
        var top = (screen.height - height) / 2;

        var winParams = [
            'width=' + width,
            'height=' + height,
            'left=' + left,
            'top=' + top,
            'menubar=no',
            'toolbar=no',
            'location=no',
            'status=no',
            'resizable=yes',
            'scrollbars=yes'
        ].join(',');

        var childWin = win.open('index.html?feature=charmap', 'PsionCharacterMap', winParams);
        childWin.focus();
    }

    function initChildEnvironment() {
        doc.body.innerHTML = '';
        doc.title = 'Psion Character Map';

        var style = doc.createElement('style');
        style.textContent = `
            :root {
                --lcd-bg: #9ea792;
                --lcd-pixel-on: rgba(26, 27, 24, 0.9);
                --lcd-pixel-off: rgba(26, 27, 24, 0.05);
                --grid-line: #889180;
                /* Fallback defaults if theme is missing */
                --bg-color: #f0f0f0;
                --text-color: #333;
                --toolbar-bg: #ffffff;
                --border-color: #ccc;
                --input-bg: #e0e0e0;
                --input-border: #999;
                --list-selected-bg: #0078d7;
            }
            body { 
                margin: 0; 
                padding: 20px; 
                background: var(--bg-color); 
                color: var(--text-color);
                font-family: 'Segoe UI', sans-serif;
                height: 100vh;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }
            .toolbar {
                margin-bottom: 20px;
                padding: 10px;
                background: var(--toolbar-bg);
                border: 1px solid var(--border-color);
                display: flex;
                gap: 20px;
                align-items: center;
            }
            .info-panel { flex-grow: 1; display: flex; gap: 20px; align-items: center; }
            .selected-char-view { 
                font-family: monospace; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center;
                min-width: 100px;
                text-align: center;
                line-height: 1.4;
                color: var(--text-color);
            }
            .char-code-input { 
                padding: 5px; 
                width: 220px; 
                font-family: monospace;
                background: var(--input-bg);
                color: var(--text-color);
                border: 1px solid var(--input-border);
            }
            .map-container {
                flex-grow: 1;
                /* map-container keeps retro look, does not inherit theme colors except scrollbars if needed */
                background: var(--lcd-bg);
                border: 10px solid #666;
                border-radius: 4px;
                padding: 20px;
                overflow: auto;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
            }
            #char-grid-svg { shape-rendering: crispEdges; transform: scale(0.8); transform-origin: top left; }
            .char-cell { cursor: pointer; fill: transparent; stroke: var(--grid-line); stroke-width: 1px; }
            .char-cell:hover { fill: rgba(255,255,255,0.2); }
            .char-cell.selected { fill: rgba(255,255,255,0.4); stroke: #000; stroke-width: 2px; }
            .pixel { fill: var(--lcd-pixel-on); }
            .grid-label { font-family: monospace; font-size: 14px; font-weight: bold; fill: #555; text-anchor: middle; }
            /* Button Style */
            .ui-btn {
                background: var(--input-bg); 
                color: var(--text-color);
                border: 1px solid var(--input-border);
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-family: 'Segoe UI', sans-serif;
                width: 70px; /* Fixed width for wrapping */
                white-space: normal;
                text-align: center;
                vertical-align: middle;
                line-height: 1.2;
                font-size: 13px;
            }
            .ui-btn:hover { background: var(--border-color); }
            .ui-btn:active { opacity: 0.8; }
        `;
        doc.head.appendChild(style);

        // Inject Theme from Opener directly to documentElement
        if (window.opener && window.opener.document) {
            var parentRoot = window.opener.document.documentElement;
            // Copy inline styles (variables)
            doc.documentElement.style.cssText = parentRoot.style.cssText;
            // Copy theme attribute
            if (parentRoot.hasAttribute('data-theme')) {
                doc.documentElement.setAttribute('data-theme', parentRoot.getAttribute('data-theme'));
            }
        }

        doc.head.appendChild(style);

        var toolbar = doc.createElement('div');
        toolbar.className = 'toolbar';
        var infoPanel = doc.createElement('div');
        infoPanel.className = 'info-panel';

        // --- State ---
        var currentFont = 'XP';
        var displayMode = 'CHR$'; // 'CHR$' or 'ASC'
        var lastSelectedCode = 0;

        // --- Elements ---

        // Mode Toggle
        var modeBtn = doc.createElement('button');
        modeBtn.className = 'ui-btn';
        modeBtn.innerHTML = 'Mode:<br>CHR$';
        modeBtn.onclick = function () {
            displayMode = (displayMode === 'CHR$') ? 'ASC' : 'CHR$';
            modeBtn.innerHTML = 'Mode:<br>' + displayMode;
            updateInfo(lastSelectedCode, selectedInfo, codeInput, displayMode);
        };

        var selectedInfo = doc.createElement('div');
        selectedInfo.className = 'selected-char-view';
        selectedInfo.textContent = 'Select a character...';

        var codeInput = doc.createElement('input');
        codeInput.className = 'char-code-input';
        codeInput.type = 'text';
        codeInput.readOnly = true;

        var copyBtn = doc.createElement('button');
        copyBtn.className = 'ui-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = function () {
            codeInput.select();
            doc.execCommand('copy');
        };

        // Font Toggle (Float right via margin-left: auto)
        var fontBtn = doc.createElement('button');
        fontBtn.className = 'ui-btn';
        fontBtn.style.marginLeft = 'auto';
        fontBtn.innerHTML = 'Font:<br>XP';
        fontBtn.onclick = function () {
            if (currentFont === 'XP') {
                currentFont = 'LZ';
                loadFont(FONT_DATA_LZ);
            } else {
                currentFont = 'XP';
                loadFont(FONT_DATA_XP);
            }
            fontBtn.innerHTML = 'Font:<br>' + currentFont;
            // Clear and Re-render
            mapContainer.innerHTML = '';
            renderSVGGrid(mapContainer, function (code) {
                lastSelectedCode = code;
                updateInfo(code, selectedInfo, codeInput, displayMode);
            });
        };

        // Append elements
        infoPanel.appendChild(modeBtn);
        infoPanel.appendChild(selectedInfo);
        infoPanel.appendChild(codeInput);
        infoPanel.appendChild(copyBtn);
        infoPanel.appendChild(fontBtn);

        toolbar.appendChild(infoPanel);
        doc.body.appendChild(toolbar);

        var mapContainer = doc.createElement('div');
        mapContainer.className = 'map-container';
        doc.body.appendChild(mapContainer);

        // Initial render
        renderSVGGrid(mapContainer, function (code) {
            lastSelectedCode = code;
            updateInfo(code, selectedInfo, codeInput, displayMode);
        });

        // Ensure focusable for keyboard events
        mapContainer.tabIndex = 0;
        mapContainer.focus();

        // --- Keyboard Navigation ---
        doc.addEventListener('keydown', function (e) {
            // Only handle if map has focus or body has focus 
            // (checking activeElement is safe for this simple popup)
            var active = doc.activeElement;
            if (active && (active.tagName === 'INPUT')) return; // Let input handle its own keys if focused

            // Map visual columns to logical high nibbles
            var colIndices = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

            // Current position
            var currentByte = lastSelectedCode;
            var currentRow = currentByte & 0x0F;
            var currentHighNibble = (currentByte >> 4) & 0x0F;

            // Find current visual column index
            var currentCol = colIndices.indexOf(currentHighNibble);
            if (currentCol === -1) currentCol = 0; // Fallback

            var newRow = currentRow;
            var newCol = currentCol;

            if (e.key === 'ArrowUp') {
                if (newRow > 0) newRow--;
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                if (newRow < 15) newRow++;
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                if (newCol > 0) newCol--;
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                if (newCol < colIndices.length - 1) newCol++;
                e.preventDefault();
            } else {
                return; // Not a nav key
            }

            // Calculate new code
            var newHighNibble = colIndices[newCol];
            var newCode = (newHighNibble << 4) | newRow;

            // Select it visually
            selectCharByCode(newCode);
        });

        function selectCharByCode(code) {
            // Find the rect
            var rect = mapContainer.querySelector(`.char-cell[data-code="${code}"]`);
            if (rect) {
                // Trigger click to reuse selection logic
                // Using dispatchEvent to ensure full emulation or just calling logic?
                // Calling logic manually is cleaner than faking events usually, but onclick is bound.
                // Let's fake the click to trigger the existing listener which handles rendering class + callback.
                var clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                rect.dispatchEvent(clickEvent);

                // Ensure visible
                rect.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        }
    }

    function renderSVGGrid(container, onSelect) {
        var cellSize = 48; // Increased for larger chars

        // Custom Columns as requested (Fx included)
        var colHeaders = ['0x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', 'Ax', 'Bx', 'Cx', 'Dx', 'Ex', 'Fx'];
        var colIndices = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // Hex values for high nibble

        var gridCols = colHeaders.length;
        var gridRows = 16;
        var labelOffset = 24;

        var svgWidth = gridCols * cellSize + labelOffset;
        var svgHeight = gridRows * cellSize + labelOffset;

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('id', 'char-grid-svg');
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', svgHeight);
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

        // Column Labels
        for (var i = 0; i < gridCols; i++) {
            var tText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tText.setAttribute('x', labelOffset + i * cellSize + cellSize / 2);
            tText.setAttribute('y', 16);
            tText.setAttribute('class', 'grid-label');
            tText.textContent = colHeaders[i];
            svg.appendChild(tText);
        }

        // Row Labels (x0 - xF)
        for (var i = 0; i < 16; i++) {
            var hex = i.toString(16).toUpperCase();
            var lText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            lText.setAttribute('x', 10);
            lText.setAttribute('y', labelOffset + i * cellSize + cellSize / 2 + 4);
            lText.setAttribute('class', 'grid-label');
            lText.textContent = 'x' + hex;
            svg.appendChild(lText);
        }

        var selectedRect = null;

        for (var r = 0; r < 16; r++) { // 0x_0 to 0x_F
            for (var c = 0; c < gridCols; c++) {
                var hiNibble = colIndices[c];
                var charCode = (hiNibble << 4) | r;

                var x = labelOffset + c * cellSize;
                var y = labelOffset + r * cellSize;

                var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
                group.setAttribute('transform', `translate(${x},${y})`);

                // Draw Pixels
                // Center 5x8 in 48x48
                var pSize = 5; // Stride
                var pGap = 1;  // Gap
                var pRect = pSize - pGap; // 4px

                var pOffX = (cellSize - (5 * pSize)) / 2;
                var pOffY = (cellSize - (8 * pSize)) / 2;

                var charBytes = CURRENT_FONT_DATA.subarray(charCode * 8, (charCode * 8) + 8);

                for (var row = 0; row < 8; row++) {
                    var byte = charBytes[row];
                    for (var col = 0; col < 5; col++) {
                        var isSet = (byte >> (4 - col)) & 1;
                        if (isSet) {
                            var pixel = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                            pixel.setAttribute('x', pOffX + col * pSize);
                            pixel.setAttribute('y', pOffY + row * pSize);
                            pixel.setAttribute('width', pRect);
                            pixel.setAttribute('height', pRect);
                            pixel.setAttribute('class', 'pixel');
                            group.appendChild(pixel);
                        }
                    }
                }

                var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute('x', 0);
                rect.setAttribute('y', 0);
                rect.setAttribute('width', cellSize);
                rect.setAttribute('height', cellSize);
                rect.setAttribute('class', 'char-cell');
                rect.dataset.code = charCode;

                rect.onclick = function (e) {
                    if (selectedRect) selectedRect.classList.remove('selected');
                    e.target.classList.add('selected');
                    selectedRect = e.target;
                    var code = parseInt(e.target.dataset.code);
                    if (onSelect) onSelect(code);
                };

                group.appendChild(rect);
                svg.appendChild(group);
            }
        }

        container.appendChild(svg);
    }

    function updateInfo(code, display, input, mode) {
        var hex = code.toString(16).toUpperCase().padStart(2, '0');
        var char = (code >= 32 && code <= 126) ? String.fromCharCode(code) : '.';

        display.innerHTML = `<span style="font-size: 1.5em; font-weight: bold; display: block;">${char}</span><span style="font-size: 0.9em; color: #555; font-weight: normal;">0x${hex} / ${code}</span>`;

        if (mode === 'ASC') {
            if (code >= 32 && code <= 126) {
                var c = String.fromCharCode(code);
                if (c === '"') input.value = 'ASC(CHR$(34))';
                else input.value = `ASC("${c}")`;
            } else {
                input.value = `ASC(CHR$(${code}))`;
            }
        } else {
            // CHR$ mode: Always show CHR$(code) as requested
            input.value = `CHR$(${code})`;
        }
    }

    return {
        openWindow: openWindow
    };
})();
