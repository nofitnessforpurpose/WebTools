'use strict';

'use strict';


function FileEditor(editorelement,callback,types,codeEditorContainer){
this.callback=callback;
this.types=types;
this.editorelement=editorelement;
this.codeEditorContainer=codeEditorContainer;
}

FileEditor.prototype={
acceptsType:function (tp){
return this.types.indexOf(tp)>=0;
},


initialise:function (item,extraelement){
},


finish:function (){
if(this.myelement)this.editorelement.removeChild(this.myelement);
},


hasUnsavedChanges:function (){return false;},



applyChanges:function (){return false;},
};