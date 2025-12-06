// css classes: dragElem, set when element is being dragged
//              over    , set when on receiving element that is being dragged over

function DragDropList(listelement, moved, numfixedtop, numfixedbottom) {
  var self = this;
  self.listelement = listelement;
  self.dragSrcEl = null;
  self.moved = moved;

  function handleDragStart(e) {
    // Target (this) element is the source node.
    self.dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    this.classList.add('dragElem');
  }
  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault(); // Necessary. Allows us to drop.
    this.classList.add('over');
    e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
    return false;
  }
  function handleDragEnter(e) {
    // this / e.target is the current hover target.
  }
  function handleDragLeave(e) {
    this.classList.remove('over');  // this / e.target is previous target element.
  }
  function handleDrop(e) {
    // this/e.target is current target element.
    if (e.stopPropagation) e.stopPropagation(); // Stops some browsers from redirecting.
    // Don't do anything if dropping the same column we're dragging.
    if (self.dragSrcEl != this) {
      var fromIx = findChildIndex(self.dragSrcEl);
      var toIx = findChildIndex(this);
      self.listelement.insertBefore(self.dragSrcEl, this);
      // call moved
      if (self.moved) self.moved(fromIx, toIx);
    }
    self.dragSrcEl.classList.remove('dragElem');
    this.classList.remove('over');
    return false;
  }
  function handleDragEnd(e) {
    // this/e.target is the source node.
    self.dragSrcEl.classList.remove('dragElem');
    this.classList.remove('over');
  }
  function addDnDHandlers(elem) {
    elem.addEventListener('dragstart', handleDragStart, false);
    elem.addEventListener('dragenter', handleDragEnter, false)
    elem.addEventListener('dragover', handleDragOver, false);
    elem.addEventListener('dragleave', handleDragLeave, false);
    elem.addEventListener('drop', handleDrop, false);
    elem.addEventListener('dragend', handleDragEnd, false);
  }
  function findChildIndex(elem) {
    // make items on lest draggable
    var children = self.listelement.childNodes;
    for (var i = 0; i < children.length; i++) {
      if (children[i] == elem) return i;
    }
    return -1;
  }


  if (listelement.hasChildNodes()) {
    // make items on list draggable
    var children = self.listelement.childNodes;
    for (var i = numfixedtop; i < children.length - numfixedbottom; i++) {
      children[i].draggable = true;
      addDnDHandlers(children[i]);
    }
    if (numfixedbottom > 0) addDnDHandlers(children[children.length - numfixedbottom]);
  }
}
