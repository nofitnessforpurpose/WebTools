'use strict';
var AssetStore=(function (){
var DB_NAME='PsionSimulator3Assets';
var DB_VERSION=1;
var STORE_NAME='assets';
var _dbPromise=null;
function isSupported(){
try{
return typeof window!=='undefined'&&('indexedDB' in window)&&window.indexedDB!==null;
}catch(e){
return false;
}
}
function openDB(){
if(!isSupported())return Promise.resolve(null);
if(_dbPromise)return _dbPromise;
_dbPromise=new Promise(function (resolve,reject){
try{
var req=window.indexedDB.open(DB_NAME,DB_VERSION);
req.onupgradeneeded=function (e){
var db=e.target.result;
if(!db.objectStoreNames.contains(STORE_NAME)){
db.createObjectStore(STORE_NAME,{keyPath:'path'});
}
};
req.onsuccess=function (e){
resolve(e.target.result);
};
req.onerror=function (e){
console.warn('AssetStore: IndexedDB open failed',e);
resolve(null);
};
}catch(err){
console.warn('AssetStore: IndexedDB not accessible',err);
resolve(null);
}
});
return _dbPromise;
}
function get (path){
return openDB().then(function (db){
if(!db)return null;
return new Promise(function (resolve){
try{
var tx=db.transaction([STORE_NAME],'readonly');
var store=tx.objectStore(STORE_NAME);
var req=store.get (path);
req.onsuccess=function (){
if(req.result&&req.result.data){
var d=req.result.data;
if(d instanceof Uint8Array){
resolve(d);
}else if(d instanceof ArrayBuffer){
resolve(new Uint8Array(d));
}else {
resolve(new Uint8Array(d));
}
}else {
resolve(null);
}
};
req.onerror=function (){resolve(null);};
}catch(err){
resolve(null);
}
});
});
}
function put(path,uint8Data){
if(!uint8Data)return Promise.resolve(false);
return openDB().then(function (db){
if(!db)return false;
return new Promise(function (resolve){
try{
var tx=db.transaction([STORE_NAME],'readwrite');
var store=tx.objectStore(STORE_NAME);
var buffer=uint8Data.buffer?uint8Data.buffer.slice(uint8Data.byteOffset,uint8Data.byteOffset+uint8Data.byteLength):uint8Data;
var item={
path:path,
data:buffer,
size:uint8Data.length||uint8Data.byteLength,
timestamp:Date.now()
};
var req=store.put(item);
req.onsuccess=function (){resolve(true);};
req.onerror=function (){resolve(false);};
}catch(err){
resolve(false);
}
});
});
}
function has(path){
return get (path).then(function (res){
return res!==null;
});
}
function count(){
return openDB().then(function (db){
if(!db)return 0;
return new Promise(function (resolve){
try{
var tx=db.transaction([STORE_NAME],'readonly');
var store=tx.objectStore(STORE_NAME);
var req=store.count();
req.onsuccess=function (){resolve(req.result||0);};
req.onerror=function (){resolve(0);};
}catch(err){
resolve(0);
}
});
});
}
function clear(){
return openDB().then(function (db){
if(!db)return false;
return new Promise(function (resolve){
try{
var tx=db.transaction([STORE_NAME],'readwrite');
var store=tx.objectStore(STORE_NAME);
var req=store.clear();
req.onsuccess=function (){resolve(true);};
req.onerror=function (){resolve(false);};
}catch(err){
resolve(false);
}
});
});
}
function remove(path){
return openDB().then(function (db){
if(!db)return false;
return new Promise(function (resolve){
try{
var tx=db.transaction([STORE_NAME],'readwrite');
var store=tx.objectStore(STORE_NAME);
var req=store.delete (path);
req.onsuccess=function (){resolve(true);};
req.onerror=function (){resolve(false);};
}catch(err){
resolve(false);
}
});
});
}
function listKeys(){
return openDB().then(function (db){
if(!db)return [];
return new Promise(function (resolve){
try{
var tx=db.transaction([STORE_NAME],'readonly');
var store=tx.objectStore(STORE_NAME);
if(store.getAllKeys){
var req=store.getAllKeys();
req.onsuccess=function (){resolve(req.result||[]);};
req.onerror=function (){resolve([]);};
}else {
var keys=[];
var req=store.openKeyCursor?store.openKeyCursor():store.openCursor();
req.onsuccess=function (e){
var cursor=e.target.result;
if(cursor){
keys.push(cursor.key);
cursor.continue();
}else {
resolve(keys);
}
};
req.onerror=function (){resolve([]);};
}
}catch(err){
resolve([]);
}
});
});
}
return {
isSupported:isSupported,
get:get,
put:put,
has:has,
count:count,
remove:remove,
clear:clear,
listKeys:listKeys
};
})();