/**
 * system_constants.js
 * 
 * Mapping of Psion Organiser II System Variables (Addresses) to Names.
 * Based on: https://www.jaapsch.net/psion/sysvars.htm
 */

const SYSTEM_CONSTANTS = {
    0x0080: "TIM0_REG",
    0x0081: "TIM1_REG",
    0x0082: "TCON_REG",
    0x0083: "P2_REG",
    0x0084: "SCON_REG",
    0x0085: "SBUF_REG",
    0x0086: "P2_REG",
    0x0087: "IE_REG",
    0x0088: "P3_REG",
    0x0089: "IP_REG",
    0x008D: "TH1_REG",
    0x008E: "TH0_REG",
    0x008F: "TL1_REG",
    0x0090: "TL0_REG",
    // ... many hardware registers ...

    // System Variables
    0x0180: "SCA_LCDCONTROL", // Display control
    0x0181: "SCA_LCDCONTROL_MIRROR", // User mentioned 181, but 180 is usually control. 
    // Jaap's list says 0180 is LCD Control. 
    // User said: "POKEB $181,0 ... REM $0181 - sca_lcdcontrol"
    // Maybe they meant 181? Or 180?
    // I'll add 181 as requested.
    0x2000: "OS_VARS_START",
    // Add more as needed
};

// User specific request: $181 -> sca_lcdcontrol
SYSTEM_CONSTANTS[0x0181] = "sca_lcdcontrol";

if (typeof window !== 'undefined') {
    window.SYSTEM_CONSTANTS = SYSTEM_CONSTANTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SYSTEM_CONSTANTS;
}
