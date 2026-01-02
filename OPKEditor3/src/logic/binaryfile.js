function LoadLocalBinaryFile(inputFile, callback) {
   if (!inputFile || inputFile.length == 0) {
      alert("Please select a binary file");
      return;
   }
   var nm = inputFile.name;
   // Create a FileReader and handle the onload and onerror events.
   var reader = new FileReader();
   reader.onload = function (e) {
      callback(new Uint8Array(e.target.result), inputFile.name);
   };
   reader.onerror = function () {
      alert("Failed to open binary file named " + nm);
   };
   // Read the binary file.
   reader.readAsArrayBuffer(inputFile);
}

function LoadLocalTextFile(inputFile, callback) {
   if (!inputFile || inputFile.length == 0) {
      alert("Please select a text file");
      return;
   }
   var nm = inputFile.name;
   // Create a FileReader and handle the onload and onerror events.
   var reader = new FileReader();
   reader.onload = function (e) {
      var s = e.target.result;
      s = s.replace(/\r\n/g, "\n");
      callback(s, inputFile.name);
   };
   reader.onerror = function () {
      alert("Failed to open text file named " + nm);
   };
   // Read the text file.
   reader.readAsText(inputFile, 'ISO-8859-4');
}


function LoadRemoteBinaryFile(inputFile, callback) {
   if (!inputFile || inputFile.length == 0) {
      alert("Please select a binary file");
      return;
   }
   var nm = inputFile.name;
   // Create a XMLHttpRequest and handle the onload and onerror events.
   var oReq = new XMLHttpRequest();
   oReq.open("GET", inputFile, true);
   oReq.responseType = "arraybuffer";
   oReq.onload = function (oEvent) {
      callback(new Uint8Array(oReq.response), inputFile.name);
   };
   oReq.onerror = function () {
      alert("Failed to download binary file named " + nm);
   };
   // Read the binary file.
   oReq.send(null);
}

// Async Versions for Sequential Processing
function LoadLocalBinaryFileAsync(inputFile) {
   return new Promise(function (resolve, reject) {
      if (!inputFile) {
         reject("No file selected");
         return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
         resolve({ data: new Uint8Array(e.target.result), name: inputFile.name });
      };
      reader.onerror = function () {
         reject("Failed to open binary file named " + inputFile.name);
      };
      reader.readAsArrayBuffer(inputFile);
   });
}

function LoadLocalTextFileAsync(inputFile) {
   return new Promise(function (resolve, reject) {
      if (!inputFile) {
         reject("No file selected");
         return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
         var s = e.target.result;
         s = s.replace(/\r\n/g, "\n");
         resolve({ data: s, name: inputFile.name });
      };
      reader.onerror = function () {
         reject("Failed to open text file named " + inputFile.name);
      };
      reader.readAsText(inputFile, 'ISO-8859-4');
   });
}