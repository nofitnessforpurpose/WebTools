var FileStatus={
"loading":0,
"ready":1,
"error":2
};
function base64ToUint8Array(b64){
var bin=(typeof atob==="function")?atob(b64):Buffer.from (b64,"base64").toString("binary");
var len=bin.length;
var bytes=new Uint8Array(len);
for(var i=0;i<len;i++){
bytes[i]=bin.charCodeAt(i);
}
return bytes;
}
function BinaryFile(inputFile,isLocal,callback){
var _name;
var _data;
var _isLocal=isLocal;
var _status=FileStatus.loading;
this.status=function (){return _status;}
this.isReady=function (){return _status==FileStatus.ready;}
this.getData=function (){return _data;}
this.getName=function (){return _name;}
this.setLoadedData=function (data){
_data=data;
_status=FileStatus.ready;
};
function downloadFailed(){
_status=FileStatus.error;
console.warn("Failed to download binary file named "+_name);
if(callback)callback(new Error("Failed to download "+_name));
};
function loadFailed(){
_status=FileStatus.error;
console.warn("Failed to open binary file named "+_name);
if(callback)callback(new Error("Failed to load "+_name));
};
if(!isLocal){
_name=inputFile;
if(!_name||_name.length==0){
downloadFailed();
return;
}
function onGotData(bytes,source){
_data=bytes;
_status=FileStatus.ready;
if(source==='network'&&typeof AssetStore!=='undefined'){
AssetStore.put(_name,bytes).catch(function (){});
}
if(callback)setTimeout(callback,0);
}
if(typeof EmbeddedAssets!=="undefined"&&EmbeddedAssets[_name]){
onGotData(base64ToUint8Array(EmbeddedAssets[_name]),'embedded');
return;
}
if(typeof AssetStore!=='undefined'&&AssetStore.isSupported()){
AssetStore.get (_name).then(function (cachedBytes){
if(cachedBytes){
onGotData(cachedBytes,'store');
return;
}
tryFetch();
}).catch(function (){
tryFetch();
});
}else {
tryFetch();
}
function tryFetch(){
var oReq=new XMLHttpRequest();
oReq.open("GET",_name,true);
oReq.responseType="arraybuffer";
oReq.onload=function (oEvent){
if(oReq.status>=200&&oReq.status<300||oReq.status===0&&oReq.response&&oReq.response.byteLength>0){
onGotData(new Uint8Array(oReq.response),'network');
}else {
downloadFailed();
}
};
oReq.onerror=function (){
downloadFailed();
};
try{
oReq.send(null);
}catch(e){
downloadFailed();
}
}
}else {
var file=inputFile instanceof File?inputFile:(inputFile[0]||null);
if(file)
{
_name=file.name||file.fileName||"unnamed.bin";
var reader=new FileReader();
reader.onload=function (e){
_data=new Uint8Array(e.target.result);
_status=FileStatus.ready;
if(callback)callback();
};
reader.onerror=loadFailed;
reader.readAsArrayBuffer(file);
}else {
console.warn("Please select a binary file");
}
}
}
BinaryFile.decodeBase64=base64ToUint8Array;