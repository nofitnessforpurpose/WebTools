'use strict';
function HD6301(bus){
var _bus=bus;
var _sleep=true;
var F_C=0x01;
var F_V=0x02;
var F_Z=0x04;
var F_N=0x08;
var F_I=0x10;
var F_H=0x20;
var _A=0;
var _B=0;
var _X=0;
var fH=false,fI=false,fN=false;
var fZ=false,fC=false,fV=false;
var _SP=0,_PC=0;
function A(){return _A;}
function setA(b){_A=b&0xff;}
function B(){return _B;}
function setB(b){_B=b&0xff;}
function D(){return (_A<<8)|_B;}
function setD(w){
setA(w>>8);
setB(w);
}
function X(){return _X;}
function setX(w){_X=w&0xffff;}
function PC(){return _PC;}
function setPC(w){_PC=w&0xffff;}
function SP(){return _SP;}
function setSP(w){_SP=w&0xffff;}
function setH(f){fH=!!f;}
function setI(f){fI=!!f;}
function setN(f){fN=!!f;}
function setZ(f){fZ=!!f;}
function setV(f){fV=!!f;}
function setC(f){fC=!!f;}
function Hset(){return fH;}
function Iset(){return fI;}
function Nset(){return fN;}
function Zset(){return fZ;}
function Vset(){return fV;}
function Cset(){return fC;}
function P(){
return (
(fH?F_H:0)|
(fI?F_I:0)|
(fN?F_N:0)|
(fZ?F_Z:0)|
(fC?F_C:0)|
(fV?F_V:0)|
0xc0
);
}
function setP(b){
setH((b&F_H)!==0);
setI((b&F_I)!==0);
setN((b&F_N)!==0);
setZ((b&F_Z)!==0);
setC((b&F_C)!==0);
setV((b&F_V)!==0);
}
function peekb(addr){
return _bus.read(addr&0xffff)&0xff;
}
function pokeb(addr,b){
_bus.write(addr&0xffff,b&0xff);
}
function pokew(addr,w){
pokeb(addr,w>>8);
pokeb(addr+1,w);
}
function peekw(addr){
return ((peekb(addr)<<8)|peekb(addr+1))&0xffff;
}
function pushw(w){
setSP(SP()-2);
pokew(SP(),w);
}
function popw(){
var t=peekw(SP());
setSP(SP()+2);
return t;
}
function pushb(b){
setSP(SP()-1);
pokeb(SP(),b);
}
function popb(){
var t=peekb(SP());
setSP(SP()+1);
return t;
}
function nxtpcb(){
var t=peekb(PC());
setPC(PC()+1);
return t;
}
function nxtpcw(){
var t=peekw(PC());
setPC(PC()+2);
return t;
}
function resetForBoot(){
setPC(peekw(0xfffe));
setSP(0x47ef);
setD(0);
setX(0);
setP(255);
_sleep=false;
}
this.onSwitchOnOff=function (){
if(_bus.isSwitchedOff()){
_sleep=true;
}else {
resetForBoot();
}
};
this.isSleeping=function (){return _sleep;};
this.wake=function (){_sleep=false;};
var _onBuzzer=null;
this.setOnBuzzer=function (cb){
_onBuzzer=cb;
};
function dointerrupt(vectorAddr){
pushw(PC());
pushw(X());
pushb(A());
pushb(B());
pushb(P());
setI(true);
setPC(peekw(vectorAddr));
return 11;
}
this.execute=function (ticksToExecute){
while(ticksToExecute>0){
if(_bus.isSwitchedOff()&&!_bus.isOnPressed()){
var ticksToNMI=Math.max(1,460800-_bus.getTicksSinceNMI());
var fastTicks=Math.min(ticksToExecute,ticksToNMI);
if(fastTicks>0){
_bus.incStandbyTicks(fastTicks);
ticksToExecute-=fastTicks;
if(_bus.isNMIdue()){
if(!_bus.isSwitchedOff()){
_sleep=false;
}
}
continue;
}
}
var ticks=0;
if(_bus.isNMIdue()){
_sleep=false;
ticks+=dointerrupt(0xfffc);
}else if(_bus.isOCIdue()&&!Iset()){
_sleep=false;
ticks+=dointerrupt(0xfff4);
}else if(_bus.isSCIdue&&_bus.isSCIdue()&&!Iset()){
_sleep=false;
ticks+=dointerrupt(0xfff0);
}else if(_sleep&&_bus.isOnPressed&&_bus.isOnPressed()){
_sleep=false;
}
var inst=(_sleep||_bus.isSwitchedOff())?1:nxtpcb();
ticks++;
switch(inst){
case 0:
case 1:
break;
case 4:
setD(lsr(D()));break;
case 5:
setD(asl16(D()));break;
case 6:
setP(A());break;
case 7:
setA(P());break;
case 8:
setX(X()+1);setZ(X()===0);break;
case 9:
setX(X()-1);setZ(X()===0);break;
case 10:
setV(false);break;
case 11:
setV(true);break;
case 12:
setC(false);break;
case 13:
setC(true);break;
case 14:
setI(false);break;
case 15:
setI(true);break;
case 16:
setA(sub8(A(),B()));break;
case 17:
sub8(A(),B());break;
case 22:
setB(ld8(A()));break;
case 23:
setA(ld8(B()));break;
case 24:
var x=X();setX(D());setD(x);ticks++;break;
case 25:
daa();ticks++;break;
case 26:
ticks+=3;
if(_bus&&_bus.isOnPressed&&_bus.isOnPressed()){
_sleep=false;
}else {
_sleep=true;
}
break;
case 27:
setA(add8(A(),B()));break;
case 32:
var d=nxtpcb();if(d>=0x80)d-=0x100;
setPC(PC()+d);ticks+=2;break;
case 33:
nxtpcb();ticks+=2;break;
case 34:
var d=nxtpcb();if(!Cset()&&!Zset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 35:
var d=nxtpcb();if(Cset()||Zset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 36:
var d=nxtpcb();if(!Cset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 37:
var d=nxtpcb();if(Cset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 38:
var d=nxtpcb();if(!Zset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 39:
var d=nxtpcb();if(Zset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 40:
var d=nxtpcb();if(!Vset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 41:
var d=nxtpcb();if(Vset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 42:
var d=nxtpcb();if(!Nset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 43:
var d=nxtpcb();if(Nset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 44:
var d=nxtpcb();if(Nset()===Vset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 45:
var d=nxtpcb();if(Nset()!==Vset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 46:
var d=nxtpcb();if(Nset()===Vset()&&!Zset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 47:
var d=nxtpcb();if(Nset()!==Vset()||Zset()){if(d>=0x80)d-=0x100;setPC(PC()+d);}
ticks+=2;break;
case 48:
setX(SP());break;
case 49:
setSP(SP()+1);break;
case 50:
setA(popb());ticks+=2;break;
case 51:
setB(popb());ticks+=2;break;
case 52:
setSP(SP()-1);break;
case 53:
setSP(X());break;
case 54:
pushb(A());ticks+=3;break;
case 55:
pushb(B());ticks+=3;break;
case 56:
setX(popw());ticks+=3;break;
case 57:
setPC(popw());ticks+=4;break;
case 58:
setX(X()+B());break;
case 59:
setP(popb());setB(popb());setA(popb());setX(popw());setPC(popw());
ticks+=9;break;
case 60:
pushw(X());ticks+=4;break;
case 61:
setD(A()*B());setC((B()&0x80)!==0);ticks+=6;break;
case 62:
ticks+=8;break;
case 63:
ticks+=dointerrupt(0xfffa);break;
case 64:setA(neg8(A()));break;
case 67:setA(com8(A()));break;
case 68:setA(lsr(A()));break;
case 70:setA(ror8(A()));break;
case 71:setA(asr8(A()));break;
case 72:setA(asl8(A()));break;
case 73:setA(rol8(A()));break;
case 74:setA(dec8(A()));break;
case 76:setA(inc8(A()));break;
case 77:tst8(A());break;
case 79:setA(clr8());break;
case 80:setB(neg8(B()));break;
case 83:setB(com8(B()));break;
case 84:setB(lsr(B()));break;
case 86:setB(ror8(B()));break;
case 87:setB(asr8(B()));break;
case 88:setB(asl8(B()));break;
case 89:setB(rol8(B()));break;
case 90:setB(dec8(B()));break;
case 92:setB(inc8(B()));break;
case 93:tst8(B());break;
case 95:setB(clr8());break;
case 96:var m=X()+nxtpcb();pokeb(m,neg8(peekb(m)));ticks+=5;break;
case 97:var b=nxtpcb();var m=X()+nxtpcb();pokeb(m,and8(b,peekb(m)));ticks+=6;break;
case 98:var b=nxtpcb();var m=X()+nxtpcb();pokeb(m,or8(b,peekb(m)));ticks+=6;break;
case 99:var m=X()+nxtpcb();pokeb(m,com8(peekb(m)));ticks+=5;break;
case 100:var m=X()+nxtpcb();pokeb(m,lsr(peekb(m)));ticks+=5;break;
case 101:var b=nxtpcb();var m=X()+nxtpcb();pokeb(m,eor8(b,peekb(m)));ticks+=6;break;
case 102:var m=X()+nxtpcb();pokeb(m,ror8(peekb(m)));ticks+=5;break;
case 103:var m=X()+nxtpcb();pokeb(m,asr8(peekb(m)));ticks+=5;break;
case 104:var m=X()+nxtpcb();pokeb(m,asl8(peekb(m)));ticks+=5;break;
case 105:var m=X()+nxtpcb();pokeb(m,rol8(peekb(m)));ticks+=5;break;
case 106:var m=X()+nxtpcb();pokeb(m,dec8(peekb(m)));ticks+=5;break;
case 107:var b=nxtpcb();var m=X()+nxtpcb();and8(b,peekb(m));ticks+=4;break;
case 108:var m=X()+nxtpcb();pokeb(m,inc8(peekb(m)));ticks+=5;break;
case 109:var m=X()+nxtpcb();tst8(peekb(m));ticks+=3;break;
case 110:var m=X()+nxtpcb();setPC(m);ticks+=2;break;
case 111:var m=X()+nxtpcb();pokeb(m,clr8());ticks+=4;break;
case 112:var m=nxtpcw();pokeb(m,neg8(peekb(m)));ticks+=5;break;
case 113:var b=nxtpcb();var m=nxtpcb();pokeb(m,and8(b,peekb(m)));ticks+=5;break;
case 114:var b=nxtpcb();var m=nxtpcb();pokeb(m,or8(b,peekb(m)));ticks+=5;break;
case 115:var m=nxtpcw();pokeb(m,com8(peekb(m)));ticks+=5;break;
case 116:var m=nxtpcw();pokeb(m,lsr(peekb(m)));ticks+=5;break;
case 117:var b=nxtpcb();var m=nxtpcb();pokeb(m,eor8(b,peekb(m)));ticks+=5;break;
case 118:var m=nxtpcw();pokeb(m,ror8(peekb(m)));ticks+=5;break;
case 119:var m=nxtpcw();pokeb(m,asr8(peekb(m)));ticks+=5;break;
case 120:var m=nxtpcw();pokeb(m,asl8(peekb(m)));ticks+=5;break;
case 121:var m=nxtpcw();pokeb(m,rol8(peekb(m)));ticks+=5;break;
case 122:var m=nxtpcw();pokeb(m,dec8(peekb(m)));ticks+=5;break;
case 123:var b=nxtpcb();var m=nxtpcb();and8(b,peekb(m));ticks+=3;break;
case 124:var m=nxtpcw();pokeb(m,inc8(peekb(m)));ticks+=5;break;
case 125:var m=nxtpcw();tst8(peekb(m));ticks+=3;break;
case 126:var m=nxtpcw();setPC(m);ticks+=2;break;
case 127:var m=nxtpcw();pokeb(m,clr8());ticks+=4;break;
case 128:setA(sub8(A(),nxtpcb()));ticks++;break;
case 129:sub8(A(),nxtpcb());ticks++;break;
case 130:setA(sbc8(A(),nxtpcb()));ticks++;break;
case 131:setD(sub16(D(),nxtpcw()));ticks+=2;break;
case 132:setA(and8(A(),nxtpcb()));ticks++;break;
case 133:and8(A(),nxtpcb());ticks++;break;
case 134:setA(ld8(nxtpcb()));ticks++;break;
case 136:setA(eor8(A(),nxtpcb()));ticks++;break;
case 137:setA(adc8(A(),nxtpcb()));ticks++;break;
case 138:setA(or8(A(),nxtpcb()));ticks++;break;
case 139:setA(add8(A(),nxtpcb()));ticks++;break;
case 140:sub16(X(),nxtpcw());ticks+=2;break;
case 141:var d=nxtpcb();pushw(PC());if(d>=0x80)d-=0x100;setPC(PC()+d);ticks+=4;break;
case 142:setSP(ld16(nxtpcw()));ticks+=2;break;
case 144:setA(sub8(A(),peekb(nxtpcb())));ticks+=2;break;
case 145:sub8(A(),peekb(nxtpcb()));ticks+=2;break;
case 146:setA(sbc8(A(),peekb(nxtpcb())));ticks+=2;break;
case 147:setD(sub16(D(),peekw(nxtpcb())));ticks+=3;break;
case 148:setA(and8(A(),peekb(nxtpcb())));ticks+=2;break;
case 149:and8(A(),peekb(nxtpcb()));ticks+=2;break;
case 150:setA(ld8(peekb(nxtpcb())));ticks+=2;break;
case 151:pokeb(nxtpcb(),ld8(A()));ticks+=2;break;
case 152:setA(eor8(A(),peekb(nxtpcb())));ticks+=2;break;
case 153:setA(adc8(A(),peekb(nxtpcb())));ticks+=2;break;
case 154:setA(or8(A(),peekb(nxtpcb())));ticks+=2;break;
case 155:setA(add8(A(),peekb(nxtpcb())));ticks+=2;break;
case 156:sub16(X(),peekw(nxtpcb()));ticks+=3;break;
case 157:var m=nxtpcb();pushw(PC());setPC(m);ticks+=4;break;
case 158:setSP(ld16(peekw(nxtpcb())));ticks+=3;break;
case 159:pokew(nxtpcb(),ld16(SP()));ticks+=3;break;
case 160:setA(sub8(A(),peekb(X()+nxtpcb())));ticks+=3;break;
case 161:sub8(A(),peekb(X()+nxtpcb()));ticks+=3;break;
case 162:setA(sbc8(A(),peekb(X()+nxtpcb())));ticks+=3;break;
case 163:setD(sub16(D(),peekw(X()+nxtpcb())));ticks+=4;break;
case 164:setA(and8(A(),peekb(X()+nxtpcb())));ticks+=3;break;
case 165:and8(A(),peekb(X()+nxtpcb()));ticks+=3;break;
case 166:setA(ld8(peekb(X()+nxtpcb())));ticks+=3;break;
case 167:pokeb(X()+nxtpcb(),ld8(A()));ticks+=3;break;
case 168:setA(eor8(A(),peekb(X()+nxtpcb())));ticks+=3;break;
case 169:setA(adc8(A(),peekb(X()+nxtpcb())));ticks+=3;break;
case 170:setA(or8(A(),peekb(X()+nxtpcb())));ticks+=3;break;
case 171:setA(add8(A(),peekb(X()+nxtpcb())));ticks+=3;break;
case 172:sub16(X(),peekw(X()+nxtpcb()));ticks+=4;break;
case 173:var m=X()+nxtpcb();pushw(PC());setPC(m);ticks+=4;break;
case 174:setSP(ld16(peekw(X()+nxtpcb())));ticks+=4;break;
case 175:pokew(X()+nxtpcb(),ld16(SP()));ticks+=4;break;
case 176:setA(sub8(A(),peekb(nxtpcw())));ticks+=3;break;
case 177:sub8(A(),peekb(nxtpcw()));ticks+=3;break;
case 178:setA(sbc8(A(),peekb(nxtpcw())));ticks+=3;break;
case 179:setD(sub16(D(),peekw(nxtpcw())));ticks+=4;break;
case 180:setA(and8(A(),peekb(nxtpcw())));ticks+=3;break;
case 181:and8(A(),peekb(nxtpcw()));ticks+=3;break;
case 182:setA(ld8(peekb(nxtpcw())));ticks+=3;break;
case 183:pokeb(nxtpcw(),ld8(A()));ticks+=3;break;
case 184:setA(eor8(A(),peekb(nxtpcw())));ticks+=3;break;
case 185:setA(adc8(A(),peekb(nxtpcw())));ticks+=3;break;
case 186:setA(or8(A(),peekb(nxtpcw())));ticks+=3;break;
case 187:setA(add8(A(),peekb(nxtpcw())));ticks+=3;break;
case 188:sub16(X(),peekw(nxtpcw()));ticks+=4;break;
case 189:var m=nxtpcw();pushw(PC());setPC(m);ticks+=5;break;
case 190:setSP(ld16(peekw(nxtpcw())));ticks+=4;break;
case 191:pokew(nxtpcw(),ld16(SP()));ticks+=4;break;
case 192:setB(sub8(B(),nxtpcb()));ticks++;break;
case 193:sub8(B(),nxtpcb());ticks++;break;
case 194:setB(sbc8(B(),nxtpcb()));ticks++;break;
case 195:setD(add16(D(),nxtpcw()));ticks+=2;break;
case 196:setB(and8(B(),nxtpcb()));ticks++;break;
case 197:and8(B(),nxtpcb());ticks++;break;
case 198:setB(ld8(nxtpcb()));ticks++;break;
case 200:setB(eor8(B(),nxtpcb()));ticks++;break;
case 201:setB(adc8(B(),nxtpcb()));ticks++;break;
case 202:setB(or8(B(),nxtpcb()));ticks++;break;
case 203:setB(add8(B(),nxtpcb()));ticks++;break;
case 204:setD(ld16(nxtpcw()));ticks+=2;break;
case 206:setX(ld16(nxtpcw()));ticks+=2;break;
case 208:setB(sub8(B(),peekb(nxtpcb())));ticks+=2;break;
case 209:sub8(B(),peekb(nxtpcb()));ticks+=2;break;
case 210:setB(sbc8(B(),peekb(nxtpcb())));ticks+=2;break;
case 211:setD(add16(D(),peekw(nxtpcb())));ticks+=3;break;
case 212:setB(and8(B(),peekb(nxtpcb())));ticks+=2;break;
case 213:and8(B(),peekb(nxtpcb()));ticks+=2;break;
case 214:setB(ld8(peekb(nxtpcb())));ticks+=2;break;
case 215:pokeb(nxtpcb(),ld8(B()));ticks+=2;break;
case 216:setB(eor8(B(),peekb(nxtpcb())));ticks+=2;break;
case 217:setB(adc8(B(),peekb(nxtpcb())));ticks+=2;break;
case 218:setB(or8(B(),peekb(nxtpcb())));ticks+=2;break;
case 219:setB(add8(B(),peekb(nxtpcb())));ticks+=2;break;
case 220:setD(ld16(peekw(nxtpcb())));ticks+=3;break;
case 221:pokew(nxtpcb(),ld16(D()));ticks+=3;break;
case 222:setX(ld16(peekw(nxtpcb())));ticks+=3;break;
case 223:pokew(nxtpcb(),ld16(X()));ticks+=3;break;
case 224:setB(sub8(B(),peekb(X()+nxtpcb())));ticks+=3;break;
case 225:sub8(B(),peekb(X()+nxtpcb()));ticks+=3;break;
case 226:setB(sbc8(B(),peekb(X()+nxtpcb())));ticks+=3;break;
case 227:setD(add16(D(),peekw(X()+nxtpcb())));ticks+=4;break;
case 228:setB(and8(B(),peekb(X()+nxtpcb())));ticks+=3;break;
case 229:and8(B(),peekb(X()+nxtpcb()));ticks+=3;break;
case 230:setB(ld8(peekb(X()+nxtpcb())));ticks+=3;break;
case 231:pokeb(X()+nxtpcb(),ld8(B()));ticks+=3;break;
case 232:setB(eor8(B(),peekb(X()+nxtpcb())));ticks+=3;break;
case 233:setB(adc8(B(),peekb(X()+nxtpcb())));ticks+=3;break;
case 234:setB(or8(B(),peekb(X()+nxtpcb())));ticks+=3;break;
case 235:setB(add8(B(),peekb(X()+nxtpcb())));ticks+=3;break;
case 236:setD(ld16(peekw(X()+nxtpcb())));ticks+=4;break;
case 237:pokew(X()+nxtpcb(),ld16(D()));ticks+=4;break;
case 238:setX(ld16(peekw(X()+nxtpcb())));ticks+=4;break;
case 239:pokew(X()+nxtpcb(),ld16(X()));ticks+=4;break;
case 240:setB(sub8(B(),peekb(nxtpcw())));ticks+=3;break;
case 241:sub8(B(),peekb(nxtpcw()));ticks+=3;break;
case 242:setB(sbc8(B(),peekb(nxtpcw())));ticks+=3;break;
case 243:setD(add16(D(),peekw(nxtpcw())));ticks+=4;break;
case 244:setB(and8(B(),peekb(nxtpcw())));ticks+=3;break;
case 245:and8(B(),peekb(nxtpcw()));ticks+=3;break;
case 246:setB(ld8(peekb(nxtpcw())));ticks+=3;break;
case 247:pokeb(nxtpcw(),ld8(B()));ticks+=3;break;
case 248:setB(eor8(B(),peekb(nxtpcw())));ticks+=3;break;
case 249:setB(adc8(B(),peekb(nxtpcw())));ticks+=3;break;
case 250:setB(or8(B(),peekb(nxtpcw())));ticks+=3;break;
case 251:setB(add8(B(),peekb(nxtpcw())));ticks+=3;break;
case 252:setD(ld16(peekw(nxtpcw())));ticks+=4;break;
case 253:pokew(nxtpcw(),ld16(D()));ticks+=4;break;
case 254:setX(ld16(peekw(nxtpcw())));ticks+=4;break;
case 255:pokew(nxtpcw(),ld16(X()));ticks+=4;break;
default:
console.warn("HD6301 Unhandled Opcode: "+inst.toString(16)+" at PC="+(PC()-1).toString(16));
_bus.switchOff();
break;
}
_bus.incFrame(ticks);
ticksToExecute-=ticks;
}
};
function ld8(a){
setN((a&0x80)!==0);
setZ(a===0);
setV(false);
return a;
}
function ld16(a){
setN((a&0x8000)!==0);
setZ(a===0);
setV(false);
return a;
}
function daa(){
var ans=A();
if(Hset()||(ans&0x0f)>0x09)ans+=0x06;
if(Cset()||ans>0x9f)ans+=0x60;
if(ans>0x99)setC(true);
setN((ans&0x80)!==0);
setZ((ans&0xff)===0);
setV(((A()^ans)&0x80)!==0);
setA(ans&0xff);
}
function neg8(ans){
var ans2=(-ans)&0xff;
setN((ans2&0x80)!==0);
setZ(ans2===0);
setC(ans2!==0);
setV(ans2===0x80);
return ans2;
}
function com8(ans){
var ans2=ans^0xff;
setN((ans2&0x80)!==0);
setZ(ans2===0);
setV(false);
setC(true);
return ans2;
}
function lsr(ans){
var c=(ans&1)!==0;
setC(c);
setV(c);
var ans2=ans>>1;
setN(false);
setZ(ans2===0);
return ans2;
}
function ror8(ans){
var c=(ans&1)!==0;
var n=Cset();
var ans2=ans>>1;
if(n)ans2|=0x80;
setC(c);
setN(n);
setZ(ans2===0);
setV(n!==c);
return ans2;
}
function asr8(ans){
var c=(ans&1)!==0;
var msb=ans&0x80;
var n=msb!==0;
setC(c);
var ans2=(ans>>1)+msb;
setN(n);
setZ(ans2===0);
setV(n!==c);
return ans2;
}
function asl8(ans){
var c=(ans&0x80)!==0;
var ans2=(ans<<1)&0xff;
var n=(ans2&0x80)!==0;
setN(n);
setZ(ans2===0);
setC(c);
setV(n!==c);
return ans2;
}
function rol8(ans){
var c=(ans&0x80)!==0;
var ans2=(ans<<1)&0xff;
if(Cset())ans2++;
var n=(ans2&0x80)!==0;
setC(c);
setN(n);
setZ(ans2===0);
setV(n!==c);
return ans2;
}
function dec8(ans){
setV(ans===0x80);
var ans2=(ans-1)&0xff;
setN((ans2&0x80)!==0);
setZ(ans2===0);
return ans2;
}
function inc8(ans){
var ans2=(ans+1)&0xff;
setV(ans2===0x80);
setN((ans2&0x80)!==0);
setZ(ans2===0);
return ans2;
}
function tst8(ans){
setV(false);
setC(false);
setN((ans&0x80)!==0);
setZ(ans===0);
}
function clr8(){
setV(false);
setC(false);
setN(false);
setZ(true);
return 0;
}
function and8(a,b){
var ans=a&b;
setV(false);
setN((ans&0x80)!==0);
setZ(ans===0);
return ans;
}
function or8(a,b){
var ans=a|b;
setV(false);
setN((ans&0x80)!==0);
setZ(ans===0);
return ans;
}
function eor8(a,b){
var ans=a^b;
setV(false);
setN((ans&0x80)!==0);
setZ(ans===0);
return ans;
}
function add8(a,b){
var ans=a+b;
setH(((a&0x0f)+(b&0x0f))>=0x10);
setN((ans&0x80)!==0);
setZ((ans&0xff)===0);
setC((ans&0x100)!==0);
setV(((a^~b)&(a^ans)&0x80)!==0);
return ans&0xff;
}
function adc8(a,b){
var c=Cset()?1:0;
var ans=a+b + c;
setH(((a&0x0f)+(b&0x0f)+c)>=0x10);
setN((ans&0x80)!==0);
setZ((ans&0xff)===0);
setC((ans&0x100)!==0);
setV(((a^~b)&(a^ans)&0x80)!==0);
return ans&0xff;
}
function sub8(a,b){
var ans=a-b;
setN((ans&0x80)!==0);
setZ((ans&0xff)===0);
setC((ans&0x100)!==0);
setV(((a^b)&(a^ans)&0x80)!==0);
return ans&0xff;
}
function sbc8(a,b){
var b2=b+(Cset()?1:0);
var ans=a-b2;
setN((ans&0x80)!==0);
setZ((ans&0xff)===0);
setC((ans&0x100)!==0);
setV(((a^b2)&(a^ans)&0x80)!==0);
return ans&0xff;
}
function sub16(a,b){
var ans=a-b;
setN((ans&0x8000)!==0);
setZ((ans&0xffff)===0);
setC((ans&0x10000)!==0);
setV(((a^b)&(a^ans)&0x8000)!==0);
return ans&0xffff;
}
function add16(a,b){
var ans=a+b;
setN((ans&0x8000)!==0);
setZ((ans&0xffff)===0);
setC((ans&0x10000)!==0);
setV(((a^~b)&(a^ans)&0x8000)!==0);
return ans&0xffff;
}
function asl16(ans){
var c=(ans&0x8000)!==0;
var ans2=(ans<<1)&0xffff;
var n=(ans2&0x8000)!==0;
setN(n);
setZ(ans2===0);
setC(c);
setV(n!==c);
return ans2;
}
this.getSnapshotData=function (arr){
var arr2=[A(),B(),P(),X()>>8,X()&0xff,PC()>>8,PC()&0xff,SP()>>8,SP()&0xff,_sleep?1:0];
var ln=arr.length;
for(var i=0;i<arr2.length;i++)arr[ln++]=arr2[i];
};
this.applySnapshotData=function (snapshot){
setA(snapshot.readByte());
setB(snapshot.readByte());
setP(snapshot.readByte());
setX(snapshot.readWord());
setPC(snapshot.readWord());
setSP(snapshot.readWord());
_sleep=snapshot.readByte()!==0;
};
this.getRegisters=function (){
return {A:A(),B:B(),X:X(),SP:SP(),PC:PC(),CCR:P(),sleep:_sleep};
};
}