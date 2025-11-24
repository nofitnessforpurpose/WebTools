'use strict';

function PackImage(inputData) {
   this.items = [];
   if (!inputData) {
      var now = new Date();
      var ms = (now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
      ms &= 0xffff;
      inputData = [0, 0, 0, 0, 0, 0,
         0x7a, 0x1, now.getFullYear() - 1900, now.getMonth(), now.getDate() - 1, now.getHours(), ms >> 8, ms & 0xff, 0xff, 0xff,
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
   getURL: function () {
      var wu = window.webkitURL || window.URL;
      if (this.url) {
         wu.revokeObjectURL(this.url);
         this.url = null;
      }
      var ln = this.getLength();
      var savedata = new Uint8Array(new ArrayBuffer(ln + 8));  // +6+2 for header and footer
      savedata[0] = 79; // OPK
      savedata[1] = 80;
      savedata[2] = 75;
      savedata[3] = (ln >> 16) & 0xff;
      savedata[4] = (ln >> 8) & 0xff;
      savedata[5] = ln & 0xff;
      var ix = 6;
      for (var i = 0; i < this.items.length; i++) {
         ix += this.items[i].storeData(savedata, ix);
      }
      savedata[ix++] = 0xff;
      savedata[ix++] = 0xff;
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
      var ln = this.getLength();
      var savedata = new Uint8Array(new ArrayBuffer(ln));
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
   0x84: "Comms Link setup file",
   0x83: "Procedure",
   0x82: "CM/XP diary file",
   0x81: "Data file ",  //+(this.data[10]-0x8f);
   0x80: "Data block",
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
   0x04: "Deleted Comms Link setup file",
   0x03: "Deleted procedure",
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
