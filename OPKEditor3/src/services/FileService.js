'use strict';

var FileService = (function () {

    function downloadFileFromUrl(filename, url) {
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function readFileAsArrayBuffer(file, callback) {
        var reader = new FileReader();
        reader.onload = function (e) {
            callback(null, new Uint8Array(e.target.result), file.name);
        };
        reader.onerror = function (e) {
            callback(e);
        };
        reader.readAsArrayBuffer(file);
    }

    function readFileAsText(file, callback) {
        var reader = new FileReader();
        reader.onload = function (e) {
            callback(null, e.target.result, file.name);
        };
        reader.onerror = function (e) {
            callback(e);
        };
        reader.readAsText(file);
    }

    return {
        downloadFile: downloadFileFromUrl,
        readBinary: readFileAsArrayBuffer,
        readText: readFileAsText
    };
})();
