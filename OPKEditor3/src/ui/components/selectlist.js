// css classes: selectedItem, set when element is selected

function SelectionList(listelement, selectCallback){
   var self = this;
   self.listelement = listelement;
   self.selectedItem = null;
   self.selectCallback = selectCallback;

   function handleClick(e) {
     // Target (this) element is the source node.
     if( self.selectedItem != this ){
        if(!self.selectCallback || self.selectCallback(findChildIndex(this))){
           if( self.selectedItem ){
              self.selectedItem.classList.remove('selectedItem');
           }
           self.selectedItem = this;
           this.classList.add('selectedItem');
        }
     }
   }
   function addMouseHandlers(elem) {
     elem.addEventListener('mousedown', handleClick, false);
   }
   function findChildIndex(elem) {
      // make items on lest draggable
      var children = self.listelement.childNodes;
      for (var i = 0; i < children.length; i++) {
         if( children[i] == elem) return i;
      }
      return -1;
   }

   if (listelement.hasChildNodes()) {
      // make items on list selectable
      var children = self.listelement.childNodes;
      for (var i = 0; i < children.length; i++) {
         addMouseHandlers(children[i]);
         if( children[i].classList.contains('selectedItem') ){
            self.selectedItem = children[i];
         }
      }
   }
}
