'use strict';

/**
 * Architecture: Data Model
 * ------------------------
 * Represents the state of a Psion Data Pack.
 * 
 * - PackImage: The main container for the pack data. Manages the raw binary buffer and the list of `PackItem`s.
 * - PackItem: Represents a single file or record within the pack.
 * 
 * This file handles the low-level parsing and serialization of the Psion file system format.
 */
function PackImage(inputData, sizeCode) {
   this.items = [];
   this.path = null; // Store full path for restore feature
   if (!inputData) {
      // Default Size Code: 1 (8KB) if not specified
      var sc = sizeCode || 1;
      var now = new Date();
      var ms = (now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
      ms &= 0xffff;
      inputData = [0, 0, 0, 0, 0, 0,
         0x7a, sc, now.getFullYear() - 1900, now.getMonth(), now.getDate() - 1, now.getHours(), ms >> 8, ms & 0xff, 0xff, 0xff,
         0x09, 0x81, 'M'.charCodeAt(0), 'A'.charCodeAt(0), 'I'.charCodeAt(0), 'N'.charCodeAt(0), 0x20, 0x20, 0x20, 0x20, 0x90];
      var sum1 = inputData[6] + inputData[8] + inputData[10] + inputData[12];
      var sum2 = inputData[7] + inputData[9] + inputData[11] + inputData[13];
      sum1 += (sum2 >> 8);
      inputData[14] = sum1 & 0xff;
      inputData[15] = sum2 & 0xff;
   }

   this.items[0] = getHeader(inputData);

   // build list of items
   var ix = 16;
   while (ix < inputData.length) {
      var result = readItem(inputData, ix);
      if (!result) break;
      if (result.error) {
         alert(result.error);
         break;
      }
      this.items[this.items.length] = result.item;
      ix = result.nextIx;
   }
   // Remove any existing terminators (sanity check)
   for (var i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].type === 255) this.items.splice(i, 1);
   }
   // Add End Of Pack item
   var terminator = new PackItem([0xff, 0xff], 0, 2);
   terminator.type = 255;
   terminator.desc = "End Of Pack";
   terminator.name = "End Of Pack";
   this.items.push(terminator);

   // merge related items
   for (var ix = this.items.length - 1; ix > 1; ix--) {
      var tp1 = this.items[ix - 1].type;
      var tp2 = this.items[ix].type;
      if (tp1 >= 2 && tp1 <= 15 && tp2 == 0) {
         this.items[ix - 1].child = this.items[ix]
         this.items.splice(ix, 1);
      }
   }
}
PackImage.prototype = {
   getLength: function () {
      var ln = 0;
      for (var i = 0; i < this.items.length; i++) {
         ln += this.items[i].getLength();
      }
      return ln;
   },
   eraseDeleted: function () {
      for (var i = this.items.length - 1; i > 0; i--) {
         var item = this.items[i];
         if (item.deleted) {
            this.items.splice(i, 1);
         }
      }
   },
   getRawData: function () {
      var contentLen = this.getLength();

      // Determine Target Pack Size from Header (Item 0)
      var targetSize = 0;
      var hasFixedSize = false;

      if (this.items.length > 0 && this.items[0].length >= 10) {
         // Header format: 0x7A, SizeCode, ...
         // Item[0].data[7] usually holds the size code? 
         // Looking at constructor: inputData[6]=0x7a, inputData[7]=sc.
         // getHeader creates item from index 6. So item.data[0]=0x7a, item.data[1]=sc.

         if (this.items[0].data[0] === 0x7A) {
            var sc = this.items[0].data[1];
            if (sc >= 1 && sc <= 8) { // Valid Size Codes 1-8 (8KB to 1MB etc)
               // Size = 8KB * 2^(sc-1)
               targetSize = 8192 * Math.pow(2, sc - 1);
               hasFixedSize = true;
            }
         }
      }

      var allocSize = contentLen + 8; // Default minimal size (+8 for OPK header/terminator safety?)
      // OPK Header is 6 bytes.

      if (hasFixedSize && targetSize > allocSize) {
         allocSize = targetSize + 6; // +6 for OPK header (Or should raw image NOT include OPK header? logic says YES based on code)
         // Wait, 'getRawData' adds 'OPK' header bytes [0-5]. 
         // If this is a Raw Image (EPROM), it usually DOES NOT have 'OPK' header. 
         // BUT the function writes 'OPK' at 0,1,2.
         // So this function produces an .OPK file, NOT a raw EPROM image?
         // If the user wants a raw image, they should export as HEX or BIN without OPK header?

         // However, user complains "Changed pack size". If they opened a 64KB .OPK, it likely had 64KB of data?
         // Standard OPK files are variable length.
         // Images are fixed length.

         // Re-reading User Request: "The last item of course must never occur." (Pack size change)
         // If they treat it as an EPROM image, they expect 64KB.
         // If I pad it...

         // Let's assume we want to PAD the *content part* to targetSize.
         // allocSize = 6 (Header) + targetSize.
         allocSize = 6 + targetSize;
      } else {
         allocSize = contentLen + 6;
      }

      var savedata = new Uint8Array(allocSize);
      // Init with 0xFF (Empty EPROM state)
      // savedata.fill(0xFF); // (Polyfill might be needed? standard in modern JS)
      for (var k = 0; k < allocSize; k++) savedata[k] = 0xFF;

      savedata[0] = 79; // OPK
      savedata[1] = 80;
      savedata[2] = 75;

      // Length Field in OPK Header:
      // Does it represent Content Length or File Length?
      // Usually Content Length.
      // If we pad, does 'ln' change?
      // If we pad, the 'content' effectively extends to the end?
      // Or is valid content just 'ln', and rest is junk?
      // If we save as OPK with padding, it might just be a big file.

      // CRITICAL: If the user says "changed pack size", maybe they mean the *capacity* indicator? 
      // OR the file itself.
      // If I enforce fixed size, I should write the FULL size in the header?
      // Or write the used size, but pad the file?

      // Safe bet: Write USED size in header, but PAD file to fixed size.
      // BUT OPK format usually wraps purely used data.
      // IF this is for EPROM emulation, maybe the loader reads 'ln'?

      // Let's stick to: Write CONTENT ln, but output a BUFFER of fixed size.
      // Wait, if I write 'ln' (short), loaders might stop reading there.
      // If I want it to BE a 64KB image, 'ln' should probably be ignored or set to full?

      // Actually, if it's an .OPK file, it's a wrapper.
      // If the user exports HEX, `getHexURL` calls `getRawData`? No, it re-generates.

      // Let's look at `getHexURL` (Line 111):
      // var ln = this.getLength(); 
      // var savedata = new Uint8Array(new ArrayBuffer(ln)); 
      // ... createIntelHexFromBinary

      // HEX export ALSO shrinks!

      // I will update BOTH to respect target size.

      // For getRawData (OPK File):
      // Padding it makes it a large OPK file.

      savedata[3] = (contentLen >> 16) & 0xff;
      savedata[4] = (contentLen >> 8) & 0xff;
      savedata[5] = contentLen & 0xff;

      var ix = 6;
      for (var i = 0; i < this.items.length; i++) {
         ix += this.items[i].storeData(savedata, ix);
      }

      // Remaining bytes are already 0xFF.
      return savedata;
   },
   getURL: function () {
      var wu = window.webkitURL || window.URL;
      if (this.url) {
         wu.revokeObjectURL(this.url);
         this.url = null;
      }
      var savedata = this.getRawData();
      var blob = new Blob([savedata], { type: 'application/octet-stream' });
      this.url = wu.createObjectURL(blob);
      return this.url;
   },
   getHexURL: function () {
      var wu = window.webkitURL || window.URL;
      if (this.hexurl) {
         wu.revokeObjectURL(this.hexurl);
         this.hexurl = null;
      }

      // Use getRawData to ensure we get the padded/fixed-size buffer
      // Note: getRawData adds 6 bytes of OPK header [OPK...Ln].
      // For HEX export, we might strictly want the content (Raw EPROM image) OR the OPK file as hex.
      // EPROM programmers usually want the Raw Image (Memory Map).
      // OPK Header is NOT part of the EPROM memory map (usually).
      // However, the previous logic (ln = getLength) implied it exported the content... wait.
      // Previous `getHexURL`: `var ln = this.getLength(); var savedata = new Uint8Array(ln); ... storeData(savedata, 0)`
      // NOTE: `storeData` was called with start 0.
      // `getRawData` calls `storeData` with start 6.

      // If I use `getRawData`, I get the OPK header.
      // If the user wants a 64KB EPROM image, they probably DON'T want the "OPK" header at 0x0000.
      // The Psion Organiser treats 0x0000 as the start of the first record (Header).

      // The "OPK" header (OPK + Len) is a container format artifact?
      // Psion LZ/XP Packs start with the Header Record (Type 1).
      // `PackImage` items[0] is the header.
      // `getRawData` puts "OPK...." at 0-5, and items start at 6.

      // Wait. `PackImage.js` L23 (Initializer) creates InputData:
      // [0..5] = 00.. (Junk/Padding? or OPK header placeholder?)
      // [6..] = 0x7a (Header Record).

      // If I flash a pack, 0x0000 should be the Header Record (09 .. ..).
      // The "OPK" header bytes are likely file-format metadata, NOT EPROM data.

      // So `getHexURL` was correct to start at 0.
      // BUT it was shrinking.

      // I need to apply Fixed Size logic to `getHexURL` too, but WITHOUT the 6 byte offset.

      var contentLen = this.getLength();
      var targetSize = 0;
      var hasFixedSize = false;

      if (this.items.length > 0 && this.items[0].length >= 10) {
         if (this.items[0].data[0] === 0x7A) {
            var sc = this.items[0].data[1];
            if (sc >= 1 && sc <= 8) {
               targetSize = 8192 * Math.pow(2, sc - 1);
               hasFixedSize = true;
            }
         }
      }

      var allocSize = contentLen;
      if (hasFixedSize && targetSize > allocSize) {
         allocSize = targetSize;
      }

      var savedata = new Uint8Array(allocSize);
      for (var k = 0; k < allocSize; k++) savedata[k] = 0xFF;

      var ix = 0;
      for (var i = 0; i < this.items.length; i++) {
         ix += this.items[i].storeData(savedata, ix);
      }

      var hexString = createIntelHexFromBinary(savedata);
      var blob = new Blob([hexString], { type: 'text/plain' });
      this.hexurl = wu.createObjectURL(blob);
      return this.hexurl;
   },
   getItemURL: function (item) {
      var wu = window.webkitURL || window.URL;
      if (this.itemurl) {
         wu.revokeObjectURL(this.itemurl);
         this.itemurl = null;
      }

      // check that it is a savable item
      var tp = item.type;
      if (!tp || tp < 1 || tp > 15) return null;

      // save data file
      if (tp == 1) {
         var fileid = item.data[10] & 0x7f;
         var savedata = "";
         for (var ix = 0; ix < this.items.length; ix++) {
            var item = this.items[ix];
            if (item.type == fileid && !item.deleted) {
               for (var i = 2; i < item.data.length - 1; i++) {
                  savedata += String.fromCharCode(item.data[i]);
               }
               savedata += "\n";
            }
         }
         var blob = new Blob([savedata], { type: 'text/plain' });
         this.itemurl = wu.createObjectURL(blob);
         // save as binary block file
         // TODO: allow some files to also be saved as text (e.g. OPL, NTS)
      } else {
         while (item.child) item = item.child;
         var ln = item.data.length;
         var savedata = new Uint8Array(new ArrayBuffer(6 + ln)); // 6 byte header
         savedata[0] = 79; // ORG
         savedata[1] = 82;
         savedata[2] = 71;
         savedata[3] = (ln >> 8) & 0xff;
         savedata[4] = ln & 0xff;
         savedata[5] = tp + 0x80;
         for (var i = 0; i < ln; i++) {
            savedata[6 + i] += item.data[i];
         }
         var blob = new Blob([savedata], { type: 'application/octet-stream' });
         this.itemurl = wu.createObjectURL(blob);
      }
      return this.itemurl;
   },
}


// ------------ Pack Item -------------------

var FileDescriptions = {
   0xff: "Failed length-byte",
   0x90: "File record ", //+(tp-0x8f);
   0x8f: "Block file of type 15",
   0x8e: "Block file of type 14",
   0x8d: "Block file of type 13",
   0x8c: "Block file of type 12",
   0x8b: "Block file of type 11",
   0x8a: "Block file of type 10",
   0x89: "Block file of type 9",
   0x88: "Block file of type 8",
   0x87: "Notepad file",
   0x86: "Pager setup file",
   0x85: "Spreadsheet file",
   0x84: "Comms Link Setup",
   0x83: "Procedure",
   0x82: "CM/XP diary file",
   0x81: "Data file ",  //+(this.data[10]-0x8f);
   0x80: "Long Record",
   0x10: "Deleted file record ", //+(tp-0x0f);
   0x0f: "Deleted block file of type 15",
   0x0e: "Deleted block file of type 14",
   0x0d: "Deleted block file of type 13",
   0x0c: "Deleted block file of type 12",
   0x0b: "Deleted block file of type 11",
   0x0a: "Deleted block file of type 10",
   0x09: "Deleted block file of type 9",
   0x08: "Deleted block file of type 8",
   0x07: "Deleted notepad file",
   0x06: "Deleted pager setup file",
   0x05: "Deleted spreadsheet file",
   0x04: "Deleted Comms Link Setup",
   0x03: "OPL Text (Source)",
   0x02: "Deleted CM/XP diary file",
   0x01: "Deleted data file ", // +(this.data[10]-0x8f);
   0x00: "Failed data block header",
};

function PackItem(inputData, start, len) {
   this.data = new Uint8Array(len);
   for (var i = 0; i < len; i++) {
      this.data[i] = inputData[start + i];
   }
   this.length = len;
   this.child = null;
}
PackItem.prototype = {
   getLength: function () {
      return this.child ? this.length + this.child.getLength() : this.length;
   },
   setData: function (newdata) {
      this.data = newdata;
      this.length = newdata.length;
   },
   storeData: function (outputArray, start) {
      for (var i = 0; i < this.length; i++) {
         outputArray[start + i] = this.data[i];
      }
      var ln = this.length;;
      if (this.child) {
         ln += this.child.storeData(outputArray, start + ln);
      }
      return ln;
   },
   setDescription: function () {
      var tp = this.data[1];
      this.deleted = (tp & 0x80) == 0;
      this.type = tp & 0x7f;

      if (tp >= 0x90 && tp < 0xff) {
         this.desc = FileDescriptions[0x90] + (tp - 0x8f);
      } else if (tp == 0x81) {
         this.desc = FileDescriptions[tp] + (this.data[10] - 0x8f);
      } else if (tp >= 0x10 && tp < 0x7f) {
         this.desc = FileDescriptions[0x10] + (tp - 0x0f);
      } else if (tp == 0x01) {
         this.desc = FileDescriptions[tp] + (this.data[10] - 0x8f);
      } else {
         this.desc = FileDescriptions[tp];
      }

      if (this.type >= 0x01 && this.type <= 0x0f) {
         // extract file name
         var s = "";
         for (var i = 2; i < this.data.length - 1; i++) {
            s += String.fromCharCode(this.data[i]);
         }
         this.name = s.trim();
      } else {
         this.name = "";
      }
   },
   getFullData: function () {
      var ln = this.getLength();
      var fullData = new Uint8Array(ln);
      this.storeData(fullData, 0);
      return fullData;
   },
};


// ---------------------------------------

function getHeader(inputData) {
   var item = new PackItem(inputData, 6, 10);
   item.desc = "Header";
   item.name = "";
   item.type = -1;
   return item;
}

function readItem(inputData, ix) {
   var len = inputData[ix];
   if (len == 0xff) return null;
   var tp = inputData[ix + 1];
   if (tp == 0xff) len = 0;    // failed length-byte
   var item = new PackItem(inputData, ix, len + 2);
   ix += len + 2;
   item.setDescription();
   if (item.type == 0x00 && !item.deleted) {
      var blocklen = item.data[2] * 256 + item.data[3];
      item.child = new PackItem(inputData, ix, blocklen);
      ix += blocklen;
   }
   return { item: item, nextIx: ix };
}
