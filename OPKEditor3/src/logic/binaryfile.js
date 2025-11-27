function LoadLocalBinaryFile(inputFile, callback){
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
   reader.onerror = function() {
      alert("Failed to open binary file named "+nm);
   };
   // Read the binary file.
   reader.readAsArrayBuffer(inputFile);
}

function LoadLocalTextFile(inputFile, callback){
   if (!inputFile || inputFile.length == 0) {
      alert("Please select a text file");
      return;
   }
   var nm = inputFile.name;
   // Create a FileReader and handle the onload and onerror events.
   var reader = new FileReader();
   reader.onload = function (e) {
      var s = e.target.result;
      s = s.replace( /\r\n/g, "\n");
      callback(s, inputFile.name);
   };
   reader.onerror = function() {
      alert("Failed to open text file named "+nm);
   };
   // Read the text file.
   reader.readAsText(inputFile,'ISO-8859-4');
}


function LoadRemoteBinaryFile(inputFile, callback){
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
      alert("Failed to download binary file named "+nm);
   };
   // Read the binary file.
   oReq.send(null);
}