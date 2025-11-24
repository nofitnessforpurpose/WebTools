
function ModalDialog(contentElement, okcallback, cancelcallback){
   this.dialog = document.createElement('div');
   this.okcallback = okcallback;
   this.cancelcallback = cancelcallback;
   this.dialog.innerHTML =
      "<div class='modalbackground'>"+
      "<div class='modaldialog'>"+
      "<div class='modaltop'><div id=closebutton class='close'>&times;</div></div>"+
      "<div class='modalmiddle' id='usercontent'></div>"+
      "<div class='modalbuttons'>"+
        "<span id=okbutton class='custom-button active-button'>&nbsp;&nbsp;Ok&nbsp;&nbsp;</span>&nbsp;&nbsp;&nbsp;"+
        "<span id=cancelbutton class='custom-button active-button'>Cancel</span>"+
      "</div>"+
      "</div>"+
      "</div>";
      var self = this;
   document.body.appendChild(this.dialog);
   document.getElementById("usercontent").appendChild(contentElement);
   var cancelfunction = function(e){
      self.dialog.style.display = "none";
      if(self.cancelcallback) self.cancelcallback(e);
     };
   var okfunction = function(e){
      self.dialog.style.display = "none";
      if(self.okcallback) self.okcallback(e);
     };
   document.getElementById("okbutton").addEventListener('click', okfunction, false);
   document.getElementById("cancelbutton").addEventListener('click', cancelfunction, false);
   document.getElementById("closebutton").addEventListener('click', cancelfunction, false);

   if(!okcallback && !cancelcallback){
      document.getElementById("cancelbutton").style.display = "none";
   }

   this.start = function(){
      this.dialog.style.display = "block";
   }
}