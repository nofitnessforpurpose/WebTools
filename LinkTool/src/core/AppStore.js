'use strict';


var AppStore={
state:{
packs:[],
currentPack:null,
currentPackIndex:-1,
selectedPackIndex:-1,
currentItem:null,
currentEditor:null,
syntaxHighlightingEnabled:true
},


listeners:[],

subscribe:function (callback){
this.listeners.push(callback);
},

notify:function (event,data){
this.listeners.forEach(function (callback){
callback(event,data);
});
}
};