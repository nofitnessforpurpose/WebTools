const BIT_DEFINITIONS={
0x03:{
0x01:"P20: Datapak Serial Data Out (SO)",
0x02:"P21: Datapak Serial Data In (SI)",
0x04:"P22: Datapak Serial Clock (SCK)",
0x08:"P23: Datapak VPP Program Power Enable",
0x10:"P24: Datapak OE/ / Slot Select",
0x20:"P25: Keyboard Column 1",
0x40:"P26: Keyboard Column 2",
0x80:"P27: Keyboard Column 3"
},
0x17:{
0x01:"P60: Slot 1 Enable (Active Low)",
0x02:"P61: Slot 2 Enable (Active Low)",
0x04:"P62: Slot 3 Enable (Active Low)",
0x08:"P63: Comms Link / RS232 Enable",
0x10:"P64: Keyboard Row 1",
0x20:"P65: Keyboard Row 2",
0x40:"P66: Keyboard Row 3",
0x80:"P67: Keyboard Row 4"
},
0x15:{
0x01:"P50: LCD Enable (E)",
0x02:"P51: LCD Read/Write (R/W)",
0x04:"P52: LCD Register Select (RS)",
0x08:"P53: Keyboard Column 4",
0x10:"P54: Keyboard Column 5",
0x20:"P55: Keyboard Column 6"
},
0x08:{
0x01:"OLVL1: Output Level 1",
0x02:"IEDG1: Input Edge 1",
0x04:"ETI: External Transmit Interrupt Enable",
0x08:"EICI: Input Capture Interrupt Enable",
0x10:"EOCI: Output Compare Interrupt Enable",
0x20:"ETOI: Timer Overflow Interrupt Enable",
0x40:"OCF: Output Compare Flag",
0x80:"ICF: Input Capture Flag"
},
0x11:{
0x01:"TE: Transmit Enable",
0x02:"RE: Receive Enable",
0x04:"TIE: Transmit Interrupt Enable",
0x08:"RIE: Receive Interrupt Enable",
0x10:"TDRE: Transmit Data Register Empty",
0x20:"RDRF: Receive Data Register Full",
0x40:"ORER: Overrun Error",
0x80:"RDRF: Receive Data Register Full (Copy)"
}
};
BIT_DEFINITIONS[0x01]=BIT_DEFINITIONS[0x03];
BIT_DEFINITIONS[0x16]=BIT_DEFINITIONS[0x17];
BIT_DEFINITIONS[0x14]=BIT_DEFINITIONS[0x15];
if(typeof window!=='undefined'){
window.BIT_DEFINITIONS=BIT_DEFINITIONS;
}
if(typeof module!=='undefined'&&module.exports){
module.exports=BIT_DEFINITIONS;
}