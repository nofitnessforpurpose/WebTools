
function ModalDialog(contentElement, okcallback, cancelcallback, okLabel, cancelLabel) {
   this.dialog = document.createElement('div');
   this.okcallback = okcallback;
   this.cancelcallback = cancelcallback;
   var okText = okLabel || "Ok";
   var cancelText = cancelLabel || "Cancel";
   this.dialog.innerHTML =
      "<div class='modal-overlay'>" +
      "<div class='modal-content'>" +
      "<div class='modal-header'><span id=closebutton class='close'>&times;</span></div>" +
      "<div class='modal-body' id='usercontent'></div>" +
      "<div class='modal-footer'>" +
      "<button id=okbutton class='modal-btn'>" + okText + "</button>&nbsp;&nbsp;" +
      "<button id=cancelbutton class='modal-btn'>" + cancelText + "</button>" +
      "</div>" +
      "</div>" +
      "</div>";
   var self = this;
   document.body.appendChild(this.dialog);
   this.dialog.querySelector("#usercontent").appendChild(contentElement);
   var cancelfunction = function (e) {
      if (self.dialog.parentNode) {
         document.body.removeChild(self.dialog);
      }
      if (self.cancelcallback) self.cancelcallback(e);
   };
   var okfunction = function (e) {
      if (self.dialog.parentNode) {
         document.body.removeChild(self.dialog);
      }
      if (self.okcallback) self.okcallback(e);
   };
   this.dialog.querySelector("#okbutton").addEventListener('click', okfunction, false);
   this.dialog.querySelector("#cancelbutton").addEventListener('click', cancelfunction, false);
   this.dialog.querySelector("#closebutton").addEventListener('click', cancelfunction, false);

   if (!okcallback && !cancelcallback) {
      this.dialog.querySelector("#cancelbutton").style.display = "none";
   }

   this.start = function () {
      this.dialog.style.display = "block";
   }

   this.stop = function () {
      if (self.dialog.parentNode) {
         document.body.removeChild(self.dialog);
      }
   }
}