/**
 * system_constants.js
 * 
 * Mapping of Psion Organiser II System Variables (Addresses) to Names.
 * Source: User provided list + Common Psion System Variables + Jaap's Pc Tech Manual
 */

const SYSTEM_CONSTANTS = {
    // Zero Page Ports
    0x01: "POB_DDR2 - PORT 2 DATA DIRECTION REGISTER",
    0x03: "POB_PORT2 - PORT 2 DATA REGISTER",
    0x08: "POB_TCSR1 - TIMER CONTROL STATUS REGISTER 1",
    0x09: "POW_FRC - FREE RUNNING COUNTER",
    0x0B: "POW_OCR1 - OUTPUT COMPARE REGISTER 1",
    0x0F: "POB_TCSR2 - TIMER 2 CONTROL/STATUS REGISTER",
    0x10: "POB_RMCR - RATE MODE CONTROL REGISTER",
    0x11: "POB_TRCSR - TX/RX CONTROL STATUS REGISTER",
    0x12: "POB_RDR - RECEIVE DATA REGISTER",
    0x13: "POB_TDR - TRANSMIT DATA REGISTER",
    0x14: "POB_RCR - RAM/PORT 5 CONTROL REGISTER",
    0x15: "POB_PORT5 - PORT 5 DATA REGISTER",
    0x16: "POB_DDR6 - PORT 6 DATA DIRECTION REGISTER",
    0x17: "POB_PORT6 - PORT 6 DATA REGISTER",
    0x1B: "POB_TCSR3 - TIMER 3 CONTROL/STATUS REGISTER",
    0x1C: "POB_TCONR - TIMER CONSTANT REGISTER",

    // Semi-Custom Chip Addresses
    0x0180: "SCA_LCDCONTROL - LCD CONTROL REGISTER",
    0x0181: "SCA_LCDDATA - LCD DATA REGISTER",
    0x01C0: "SCA_SWITCHOFF - SWITCH OFF",
    0x0200: "SCA_PULSEENABLE - PULSE ENABLE",
    0x0240: "SCA_PULSEDISABLE - PULSE DISABLE",
    0x0280: "SCA_ALARMHIGH - BUZZER ON",
    0x02C0: "SCA_ALARMLOW - BUZZER OFF",
    0x0300: "SCA_COUNTERRESET - SET COUNTER TO 0",
    0x0340: "SCA_COUNTERCLOCK - CLOCK COUNTER ONCE",
    0x0380: "SCA_NMIMPU - ENABLE NMI TO PROCESSOR",
    0x03C0: "SCA_NMICOUNTER - ENABLE NMI TO COUNTER",

    // System Variables & RAM Cells
    0x2000: "ALT_BASE - MACHINE RAM BASE (PERMCELL)",
    0x2002: "MENUCELL - TOP LEVEL MENU CELL",
    0x2004: "DIRYCELL - DIARY CELL",
    0x2006: "TEXTCELL - LANGUAGE TEXT CELL",
    0x2008: "SYMBCELL - SYMBOL TABLE CELL",
    0x200A: "GLOBCELL - GLOBAL RECORD CELL",
    0x200C: "OCODCELL - QCODE OUTPUT CELL",
    0x200E: "FSY1CELL - FIELD NAME SYMBOL TABLE 1",
    0x2010: "FSY2CELL - FIELD NAME SYMBOL TABLE 2",
    0x2012: "FSY3CELL - FIELD NAME SYMBOL TABLE 3",
    0x2014: "FSY4CELL - FIELD NAME SYMBOL TABLE 4",
    0x2016: "FBF1CELL - FIELD BUFFER CELL 1",
    0x2018: "FBF2CELL - FIELD BUFFER CELL 2",
    0x201A: "FBF3CELL - FIELD BUFFER CELL 3",
    0x201C: "FBF4CELL - FIELD BUFFER CELL 4",
    0x201E: "DATACELL - DATABASE CELL",

    // Free Cells
    0x2020: "Free Cell", 0x2021: "Free Cell", 0x2022: "Free Cell",
    0x2023: "Free Cell", 0x2024: "Free Cell", 0x2025: "Free Cell",
    0x2026: "Free Cell", 0x2027: "Free Cell", 0x2028: "Free Cell",
    0x2029: "Free Cell", 0x202A: "Free Cell", 0x202B: "Free Cell",
    0x202C: "Free Cell", 0x202D: "Free Cell", 0x202E: "Free Cell",
    0x202F: "Free Cell", 0x2030: "Free Cell", 0x2031: "Free Cell",
    0x2032: "Free Cell", 0x2033: "Free Cell", 0x2034: "Free Cell",
    0x2035: "Free Cell", 0x2036: "Free Cell", 0x2037: "Free Cell",
    0x2038: "Free Cell", 0x2039: "Free Cell", 0x203A: "Free Cell",
    0x203B: "Free Cell", 0x203C: "Free Cell", 0x203D: "Free Cell",
    0x203E: "Free Cell",

    // Vectors and other variables
    0x2040: "ALA_FREE",
    0x2042: "BTA_2IQ - INTERRUPT REQUEST 2",
    0x2044: "BTA_CMI - TIMER 2 COUNTER MATCH INTERRUPT",
    0x2046: "BTA_TRP - TRAP EXCEPTION INTERRUPT",
    0x2048: "BTA_SIO - SERIAL INPUT/OUTPUT INTERRUPT",
    0x204A: "BTA_TOI - TIMER 1 OVERFLOW INTERRUPT",
    0x204C: "BTA_OCI - TIMER OUTPUT COMPARE INTERRUPT",
    0x204E: "BTA_ICI - TIMER 1 INPUT CAPTURE INTERRUPT",
    0x2050: "BTA_1IQ - INTERRUPT REQUEST 1 INTERRUPT",
    0x2052: "BTA_SWI - SOFTWARE INTERRUPT",
    0x2054: "BTA_NMI - NON-MASKABLE INTERRUPT",
    0x2056: "BTA_WRM - WARM START VECTOR",
    0x2058: "BTA_SOF - POWER DOWN VECTOR (SWITCH OFF)",
    0x205A: "BTA_POLL - KEYBOARD POLL ROUTINE VECTOR",
    0x205C: "BTA_TRAN - KEY TRANSLATE ROUTINE VECTOR",
    0x205E: "BTA_TABL",
    0x2060: "UTW_FP",

    0x2062: "BTB_IGNM",
    0x2063: "BTB_IMSK",
    0x2064: "BTB_TCSR",
    0x2065: "BTA_SBAS",
    0x2067: "BTA_SAVSTACK",
    0x2069: "BTW_1DONTUSE",
    0x206B: "BTW_2DONTUSE",
    0x206D: "BTW_3DONTUSE",
    0x206F: "BTB_4DONTUSE",

    0x2070: "DPT_TLIN",
    0x2080: "DPT_BLIN",
    0x2090: "DPT_SAVE",

    0x20B0: "KBT_BUFF",
    0x20C0: "KBB_CLIK",
    0x20C1: "KBB_PKOF",
    0x20C2: "KBB_CAPK",
    0x20C3: "KBB_NUMK",
    0x20C4: "KBB_SHFK",

    0x20C5: "TMB_YEAR",
    0x20C6: "TMB_MONS",
    0x20C7: "TMB_DAYS",
    0x20C8: "TMB_HOUR",
    0x20C9: "TMB_MINS",
    0x20CA: "TMB_SECS",
    0x20CB: "TMW_FRAM",
    0x20CD: "TMW_TCNT",

    0x20CF: "UTT_TBUF",

    0x20D6: "PKB_IMSK",
    0x20D7: "PKT_ID",
    0x20FF: "RTT_NUMB",
    0x214F: "DVT_SPAR",

    0x2187: "RTB_BL",
    0x2188: "RTT_BF",
    0x2288: "AMT_NOW",

    0x22C8: "RTB_FL",
    0x22C9: "RTT_FF",
    0x22E9: "RTT_FILE",

    0x22F9: "AMT_TAB",
    0x2329: "DVA_BOT",
    0x232B: "DVA_TOP",

    // PSION Reserved
    0x2324: "reserved to PSION",
    0x2325: "reserved to PSION",
    0x2326: "reserved to PSION",
    0x2327: "reserved to PSION",
    0x2328: "reserved to PSION",
    // 0x2329 reserved overlaps DVA_BOT. 
    0x232A: "reserved to PSION",
    // 0x232B reserved overlaps DVA_TOP
    0x232C: "reserved to PSION",
    0x232D: "reserved to PSION",

    0x2335: "AMB_EI",
    0x2336: "AMT_T0",
    0x233C: "AMT_T1",
    0x2342: "AMT_T2",
    0x2348: "AMW_R1",
    0x234A: "AMB_DOIT",

    0x234B: "ITA_UVC",
    0x234D: "ITT_REGS",
    0x236D: "ITT_STAK",
    0x23AD: "IMB_SSGN",
    0x23AE: "FNT_SEED",
    0x23B5: "ACW_STOP",
    0x23B7: "ACW_XTCD",
    0x23B9: "ACT_DDAT",
    0x23BD: "ACT_NVAR",
    0x23C1: "ACT_BRAN",
    0x23C9: "ACT_PSYM",

    0x23CD: "LXA_CEND",
    0x23CF: "LXA_STRT",
    0x23D1: "LXB_STOK",
    0x23D2: "LXB_SCLA",
    0x23D3: "LXB_FTYP",

    0x23D4: "LGB_FIXP",
    0x23D5: "LGB_NL",
    0x23D6: "LGT_NF",
    0x23E0: "LGB_LANT",
    0x23E1: "LGB_MENU",

    0x23E2: "RTA_1VCT",

    0x23E4: "UTW_RETA",
    0x23E6: "PKB_OVBL",
    0x23E7: "BTA_VECT",

    0x228E: "AMT_WEEK"
};

// Handle conflicts / aliases
SYSTEM_CONSTANTS[0x2288] = "MTT_WBUF / AMT_NOW";

if (typeof window !== 'undefined') {
    window.SYSTEM_CONSTANTS = SYSTEM_CONSTANTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SYSTEM_CONSTANTS;
}
