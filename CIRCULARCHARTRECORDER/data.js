/**
 * Circular Chart Recorder Data & Configuration Bundle
 * Global variables/objects to prevent CORS issues when loaded via file:// protocol.
 */
const chartRecorderData = {
    paperStocks: {
        'antique-white': ['#fdfbf7', '#f7f4ed', '#eee8dd'],
        'manila-paper':  ['#f4f1ea', '#ebe6dc', '#ded6c6'],
        'classic-cream': ['#f9f5e9', '#f0ead6', '#e8dfca'],
        'vintage-aged':  ['#edd6b1', '#dfbe92', '#ceaa7b'],
        'blueprint-cyan':['#0f355c', '#0a2542', '#05182e'],
        'dark-slate':    ['#1e293b', '#0f172a', '#090d16'],
        'pure-white':    ['#ffffff', '#f8fafc', '#f1f5f9']
    },
    gridColors: {
        'grid-red':        { major: '#d94343', minor: 'rgba(217,67,67,0.45)', text: '#8b0000' },
        'pale-blue':       { major: '#769cdb', minor: 'rgba(166,193,238,0.5)', text: '#1e3a8a' },
        'faded-green':     { major: '#688e68', minor: 'rgba(153,178,153,0.5)', text: '#14532d' },
        'sepia-warm':      { major: '#b88552', minor: 'rgba(210,166,121,0.5)', text: '#4a2e16' },
        'slate-gray':      { major: '#475569', minor: 'rgba(100,116,139,0.4)', text: '#0f172a' },
        'blueprint-white': { major: '#cbd5e1', minor: 'rgba(226,232,240,0.3)', text: '#f8fafc' }
    },
    textColors: {
        'crimson-red':    '#8b0000',
        'dark-charcoal': '#1e293b',
        'navy-blue':     '#1e3a8a',
        'faded-brown':   '#4a2e16',
        'forest-green':  '#14532d',
        'bright-white':  '#f8fafc'
    },
    defaultRegisterMap: [
        { address: 0,  name: 'DEVICE_STATUS',    type: 'UINT16',  default: 0x0001, desc: 'Device status flags (1=Online)' },
        { address: 1,  name: 'PEN1_PV_HI',       type: 'FLOAT32', default: 25.0,   desc: 'Pen 1 Process Variable High Word' },
        { address: 2,  name: 'PEN1_PV_LO',       type: 'FLOAT32', default: 25.0,   desc: 'Pen 1 Process Variable Low Word' },
        { address: 3,  name: 'PEN2_PV_HI',       type: 'FLOAT32', default: 60.0,   desc: 'Pen 2 Process Variable High Word' },
        { address: 4,  name: 'PEN2_PV_LO',       type: 'FLOAT32', default: 60.0,   desc: 'Pen 2 Process Variable Low Word' },
        { address: 5,  name: 'CHART_SPEED',      type: 'UINT16',  default: 20,     desc: 'Disc rotation speed (hours/rev)' },
        { address: 6,  name: 'PEN1_ALARM_HI',    type: 'UINT16',  default: 1500,   desc: 'Pen 1 High Alarm Threshold (x10)' },
        { address: 7,  name: 'PEN1_ALARM_LO',    type: 'UINT16',  default: 50,     desc: 'Pen 1 Low Alarm Threshold (x10)' },
        { address: 8,  name: 'PEN2_ALARM_HI',    type: 'UINT16',  default: 1500,   desc: 'Pen 2 High Alarm Threshold (x10)' },
        { address: 9,  name: 'PEN2_ALARM_LO',    type: 'UINT16',  default: 50,     desc: 'Pen 2 Low Alarm Threshold (x10)' },
        { address: 10, name: 'ENG_UNITS',        type: 'UINT16',  default: 0,      desc: 'Engineering Units Code (0=°C, 1=°F, 2=PSI, 3=Bar)' },
        { address: 11, name: 'SCALE_HI',         type: 'UINT16',  default: 2000,   desc: 'Chart Scale High Limit (x10)' },
        { address: 12, name: 'SCALE_LO',         type: 'UINT16',  default: 0,      desc: 'Chart Scale Low Limit (x10)' },
        { address: 13, name: 'PEN1_ALM_STATUS',  type: 'UINT16',  default: 0,      desc: 'Pen 1 Alarm Status Flags (0x01=Hi, 0x02=Lo)' },
        { address: 14, name: 'PEN2_ALM_STATUS',  type: 'UINT16',  default: 0,      desc: 'Pen 2 Alarm Status Flags (0x01=Hi, 0x02=Lo)' }
    ],
    modbusExceptionCodes: {
        0x01: 'ILLEGAL_FUNCTION',
        0x02: 'ILLEGAL_DATA_ADDRESS',
        0x03: 'ILLEGAL_DATA_VALUE'
    },
    penPalette: ['#ff4060', '#00b4d8', '#10b981', '#f59e0b']
};

const myData = chartRecorderData;

if (typeof window !== 'undefined') {
    window.chartRecorderData = chartRecorderData;
    window.myData = myData;
}
