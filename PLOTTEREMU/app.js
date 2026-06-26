/* ==========================================================================
   HP 9872B Multi-Colour Plotter Emulator - Core Application & Rendering
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements Mapping
    const plotter = document.getElementById('plotter');
    const canvas = document.getElementById('plotter-canvas');
    const ctx = canvas.getContext('2d');
    const paperSheet = document.getElementById('paper-sheet');
    const xCarriage = document.getElementById('x-carriage');
    const yCarriage = document.getElementById('y-carriage');
    const carriagePenTip = document.getElementById('carriage-pen-tip');
    
    // Console Controls
    const powerSwitch = document.getElementById('power-switch');
    const ledPower = document.getElementById('led-power');
    const ledLimit = document.getElementById('led-limit');
    const ledError = document.getElementById('led-error');
    
    const btnEnter = document.getElementById('btn-enter');
    const btnP1 = document.getElementById('btn-p1');
    const btnP2 = document.getElementById('btn-p2');
    const btnPenUp = document.getElementById('btn-pen-up');
    const btnPenDown = document.getElementById('btn-pen-down');
    const btnChartLoad = document.getElementById('btn-chart-load');
    const btnChartHold = document.getElementById('btn-chart-hold');
    
    // D-Pad Jog controls
    const btnJogUp = document.getElementById('btn-jog-up');
    const btnJogDown = document.getElementById('btn-jog-down');
    const btnJogLeft = document.getElementById('btn-jog-left');
    const btnJogRight = document.getElementById('btn-jog-right');
    const btnJogFast = document.getElementById('btn-jog-fast');
    
    // Sidebar Settings (Controls)
    const sidebarPanel = document.getElementById('sidebar-panel');
    const sidebarTrigger = document.getElementById('sidebar-trigger');
    const sidebarTriggerIcon = document.getElementById('sidebar-trigger-icon');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    // Help tab elements
    const helpTrigger  = document.getElementById('help-trigger');
    const helpPanel    = document.getElementById('help-panel');
    const btnCloseHelp = document.getElementById('btn-close-help');
    
    const btnSerialConnect = document.getElementById('btn-serial-connect');
    const serialStatus = document.getElementById('serial-status');
    const serialUnsupported = document.getElementById('serial-unsupported');
    const selectBaud = document.getElementById('select-baud');
    const chkFlowControl = document.getElementById('chk-flow-control');
    
    const sliderSpeed = document.getElementById('slider-speed');
    const speedDisplay = document.getElementById('speed-display');
    const chkInstantDraw = document.getElementById('chk-instant-draw');
    const chkAutoScale = document.getElementById('chk-auto-scale');
    const chkSoundFx = document.getElementById('chk-sound-fx');
    
    // Background Canvas and Page Template Selectors
    const bgCanvas = document.getElementById('plotter-bg-canvas');
    const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
    const chkGridEnable = document.getElementById('chk-grid-enable');
    const pickerGridColor = document.getElementById('picker-grid-color');
    const selectPaperSize = document.getElementById('select-paper-size');
    const selectPaperOrientation = document.getElementById('select-paper-orientation');
    const selectPaperColor = document.getElementById('select-paper-color');
    const selectPaperTemplate = document.getElementById('select-paper-template');
    const selectHpglLevel = document.getElementById('select-hpgl-level');
    const bedCanvas = document.getElementById('plotter-bed-canvas');
    const bedCtx = bedCanvas ? bedCanvas.getContext('2d') : null;
    
    const btnDrawTest = document.getElementById('btn-draw-test');
    const btnDrawShuttle = document.getElementById('btn-draw-shuttle');
    const btnClearBed = document.getElementById('btn-clear-bed');
    const btnResetPens = document.getElementById('btn-reset-pens');
    const logViewport = document.getElementById('log-viewport');
    const toastContainer = document.getElementById('toast-container');

    // Debugger Panel Elements
    const debugPanel = document.getElementById('debug-panel');
    const debugTrigger = document.getElementById('debug-trigger');
    const debugTriggerIcon = document.getElementById('debug-trigger-icon');
    const btnCloseDebug = document.getElementById('btn-close-debug');
    const debugInput = document.getElementById('debug-input');
    const btnDebugRunAll = document.getElementById('btn-debug-run-all');
    const btnDebugLoad = document.getElementById('btn-debug-load');
    const btnDebugStep = document.getElementById('btn-debug-step');
    const btnDebugResume = document.getElementById('btn-debug-resume');
    const btnDebugPause = document.getElementById('btn-debug-pause');
    const btnDebugReset = document.getElementById('btn-debug-reset');
    const debugStatus = document.getElementById('debug-status');
    const debugViewport = document.getElementById('debug-viewport');

    // 2. Plotter Coordinates & Hard limits
    // Physical bed boundaries (plotter units - PLU)
    // HP 9872B default coordinates roughly:
    const MAX_X = 16000;
    const MAX_Y = 11400;
    
    // Printable bounds on the paper sheet (dynamic based on orientation and margins)
    let PAPER_MIN_X = 600;
    let PAPER_MAX_X = 15400;
    let PAPER_MIN_Y = 800;
    let PAPER_MAX_Y = 10800;
    let PAPER_WIDTH = 14800;
    let PAPER_HEIGHT = 10000;

    // 3. Application State Variables
    let isPowerOn = true;
    let isSerialConnected = false;
    let port = null;
    let reader = null;
    let keepReading = false;
    
    // Pen State variables
    let selectedPen = 0; // 0 = no pen / returned
    let logicalSelectedPen = 0; // Tracks logical selected pen at parse time
    let penState = 'up'; // 'up' or 'down'
    let penStateLogical = 'up'; // Tracks logical selected pen state at parse time
    let isChartOnHold = true; // Electrostatic hold active
    
    // HP-GL/2 State Variables
    let hpglLevel = 'hpgl2';
    let polygonMode = false;
    let polygonBuffer = [];
    
    // Debugger State Variables
    let debugQueue = [];
    let debugActiveIndex = -1;
    let debugState = 'idle'; // 'idle', 'paused', 'running', 'finished'
    
    // Current carriage positions (in plotter units)
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    
    // Animation/Speed settings
    let velocityMultiplier = 36; // mapping to cm/s
    let slewSpeed = 36; // Slew speed for travel/swaps (physical maximum, e.g. 36 cm/s)
    let isInstantDraw = false;
    let soundFxEnabled = true;
    let autoScaleActive = false;
    let flowControlEnabled = true;
    
    // Scaling system parameters (HPGL IP/SC commands)
    let p1X = PAPER_MIN_X;
    let p1Y = PAPER_MIN_Y;
    let p2X = PAPER_MAX_X;
    let p2Y = PAPER_MAX_Y;
    
    let userScaleActive = false;
    let userX1 = 0, userX2 = 1, userY1 = 0, userY2 = 1;
    
    // Soft Limit Boundaries (HPGL IW command)
    let softLimitX1 = 0;
    let softLimitY1 = 0;
    let softLimitX2 = 16000;
    let softLimitY2 = 11400;
    let bedScale = 0.05;
    
    function resetSoftLimits() {
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        softLimitX1 = 0;
        softLimitY1 = 0;
        softLimitX2 = limitX;
        softLimitY2 = limitY;
    }
    
    // Paper Graticules and Templates
    let isGridEnabled = true;
    let gridColor = '#0096ff';
    let activePaperSize = 'A3';
    let activePaperOrientation = 'landscape';
    let activePaperColor = 'cream';
    let activePaperTemplate = 'plain';
    let slotCoordinates = {};
    
    // Line and text styles
    let activeLineType = 'solid'; // 'solid', 'dashed', etc.
    let activeSlant = 0; // SL character slant value
    let activeCharSet = 'standard'; // SS/SA: 'standard' or 'alternate'
    let standardFontKind = 48; // SD typeface (HP-GL font number, 48 = Stick/proportional default)
    let alternateFontKind = 48; // AD typeface (HP-GL font number)
    let labelTerminator = 3; // ETX (ASCII 3)
    let labelCharSize = { width: 0.285, height: 0.375 }; // in cm
    let labelDirection = { run: 1, rise: 0 }; // angle vectors
    let labelOrigin = 21; // Default label origin (21 = align with current position / no offset)
    let labelExtraSpaceWidth = 0.0; // ES width parameter
    let labelExtraSpaceHeight = 0.0; // ES height parameter
    let activeFillType = 1; // FT fill pattern type (default 1 = solid)
    let activeFillSpacing = 0; // FT fill spacing in mm
    let activeFillAngle = 0; // FT fill line angle
    let activeTickLengthX = 100; // TL tick length X in plotter units
    let activeTickLengthY = 100; // TL tick length Y in plotter units
    let symbolModeChar = ''; // SM symbol mode character
    let widthUnit = 0; // WU width unit: 0 = metric (mm), 1 = plotter units
    let userDashPatterns = {}; // UL custom dash patterns
    let chordToleranceMode = 0; // CT mode: 0 = angle (degrees), 1 = chord height (PLU)
    let chordToleranceValue = 5; // CT tolerance parameter (default 5 degrees)
    let coordinateRotation = 0; // RO angle: 0, 90, 180, or 270 degrees (applied around P1)
    
    // Pen Station color arrays (configured in UI, default retro colors)
    let penColors = {
        1: '#1c1917', // Black
        2: '#dc2626', // Red
        3: '#16a34a', // Green
        4: '#2563eb', // Blue
        5: '#eab308', // Yellow
        6: '#d946ef', // Magenta
        7: '#0891b2', // Cyan
        8: '#78350f'  // Brown
    };
	// Assumes default pen pack
    let penWidths = {
        1: 0.3, 2: 0.3, 3: 0.3, 4: 0.3, 
        5: 0.7, 6: 0.7, 7: 0.7, 8: 0.7
    };

    // Horizontal positions of 8 pen stables (aligned with console slots)
    const penSlotsX = {
        1: 2000,  // 12.5%
        2: 3600,  // 22.5%
        3: 5200,  // 32.5%
        4: 6800,  // 42.5%
        5: 8400,  // 52.5%
        6: 10000, // 62.5%
        7: 11600, // 72.5%
        8: 13200  // 82.5%
    };

    // Action Queue for sequential operations
    let actionQueue = [];
    let isProcessingQueue = false;
    
    // Auto-Fit Pre-Scan Variables
    let fitScale = 1;
    let fitOffsetX = PAPER_MIN_X;
    let fitOffsetY = PAPER_MIN_Y;
    let scannedMinX = 0, scannedMaxX = 0, scannedMinY = 0, scannedMaxY = 0;
    
    // Jog state
    let jogInterval = null;
    let isJogFast = false;
    let jogStepSize = 10; // Tracks manual controls jog step in plotter units
    
    // Web Audio Synthesizer (for retro motor hums)
    let audioCtx = null;
    let motorOsc = null;
    let motorGain = null;

    // Layout cached dimensions for pen alignment
    let penTipOffsetX = 0;
    let penTipOffsetY = 0;
    let bedRectCached = { left: 0, top: 0 };
    let canvasRectCached = { left: 0, top: 0, width: 0, height: 0 };

    function cacheLayoutDimensions() {
        const bed = document.querySelector('.plotter-bed');
        if (!bed) return;
        
        // Update printable bounds based on orientation (preserving margin spacing)
        if (activePaperOrientation === 'portrait') {
            PAPER_MIN_X = 800;
            PAPER_MAX_X = 10600; // Symmetric left/right: 11400 - 800
            PAPER_MIN_Y = 800;   // Symmetric bottom/top: 16000 - 800
            PAPER_MAX_Y = 15200;
        } else {
            PAPER_MIN_X = 600;
            PAPER_MAX_X = 15400;
            PAPER_MIN_Y = 800;
            PAPER_MAX_Y = 10800;
        }
        PAPER_WIDTH = PAPER_MAX_X - PAPER_MIN_X;
        PAPER_HEIGHT = PAPER_MAX_Y - PAPER_MIN_Y;

        // Dynamic, pixel-perfect aspect ratio scaling for the paper sheet bed
        const container = bed.querySelector('.paper-bed-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const bedAspectRatio = 1.4142; // Physical aspect ratio of A3 bed recess (sqrt(2))
            
            // Calculate base bed dimensions keeping aspect ratio
            let baseBedWidth = containerRect.width;
            let baseBedHeight = containerRect.width / bedAspectRatio;
            if (baseBedHeight > containerRect.height) {
                baseBedHeight = containerRect.height;
                baseBedWidth = containerRect.height * bedAspectRatio;
            }
            
            // Calculate absolute bed scale factor relative to orientation limits
            const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
            const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
            const scaleX = (activePaperOrientation === 'portrait' ? baseBedHeight : baseBedWidth) / limitX;
            const scaleY = (activePaperOrientation === 'portrait' ? baseBedWidth : baseBedHeight) / limitY;
            bedScale = Math.min(scaleX, scaleY);
            
            let targetWidth, targetHeight;
            
            if (activePaperSize === 'A3') {
                if (activePaperOrientation === 'portrait') {
                    targetWidth = baseBedHeight;
                    targetHeight = baseBedWidth;
                } else {
                    targetWidth = baseBedWidth;
                    targetHeight = baseBedHeight;
                }
            } else if (activePaperSize === 'A4') {
                if (activePaperOrientation === 'portrait') {
                    targetWidth = baseBedHeight * 0.7071;
                    targetHeight = baseBedWidth * 0.7071;
                } else {
                    targetWidth = baseBedWidth * 0.7071;
                    targetHeight = baseBedHeight * 0.7071;
                }
            } else if (activePaperSize === 'A5') {
                if (activePaperOrientation === 'portrait') {
                    targetWidth = baseBedHeight * 0.5;
                    targetHeight = baseBedWidth * 0.5;
                } else {
                    targetWidth = baseBedWidth * 0.5;
                    targetHeight = baseBedHeight * 0.5;
                }
            } else if (activePaperSize === 'Letter') {
                // Letter: 8.5 x 11 inches (215.9 x 279.4 mm)
                // A3: 297 x 420 mm
                const widthScale = 279.4 / 420;  // 0.6652
                const heightScale = 215.9 / 297; // 0.7269
                if (activePaperOrientation === 'portrait') {
                    targetWidth = baseBedHeight * heightScale;
                    targetHeight = baseBedWidth * widthScale;
                } else {
                    targetWidth = baseBedWidth * widthScale;
                    targetHeight = baseBedHeight * heightScale;
                }
            }
            
            paperSheet.style.width = `${targetWidth}px`;
            paperSheet.style.height = `${targetHeight}px`;
        }
        
        // Save current transforms and disable transitions temporarily for instant snapping
        const oldXTransform = xCarriage.style.transform;
        const oldYTransform = yCarriage.style.transform;
        const oldXTransition = xCarriage.style.transition;
        const oldYTransition = yCarriage.style.transition;
        
        xCarriage.style.transition = 'none';
        yCarriage.style.transition = 'none';
        
        // Force reflow
        xCarriage.offsetHeight;
        
        // Reset transforms to baseline for measurement
        xCarriage.style.transform = 'translateX(0px)';
        yCarriage.style.transform = 'translateY(0px)';
        
        // Force reflow to snap instantly to baseline
        xCarriage.offsetHeight;
        
        const bedRect = bed.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const penTipRect = carriagePenTip.getBoundingClientRect();
        
        bedRectCached = { 
            left: bedRect.left, 
            top: bedRect.top,
            width: bedRect.width,
            height: bedRect.height
        };
        canvasRectCached = { 
            left: canvasRect.left, 
            top: canvasRect.top, 
            width: canvasRect.width, 
            height: canvasRect.height 
        };
        
        penTipOffsetX = (penTipRect.left + penTipRect.width / 2) - bedRect.left;
        penTipOffsetY = (penTipRect.top + penTipRect.height / 2) - bedRect.top;
        
        // Measure pen slot positions relative to the bed top-left
        for (let i = 1; i <= 8; i++) {
            const station = document.getElementById(`station-${i}`);
            if (station) {
                const rect = station.getBoundingClientRect();
                const slotX = (rect.left + rect.width / 2) - bedRect.left;
                
                const hole = station.querySelector('.pen-slot-hole');
                let slotY = rect.top - bedRect.top;
                if (hole) {
                    const holeRect = hole.getBoundingClientRect();
                    slotY = (holeRect.top + holeRect.height / 2) - bedRect.top;
                }
                
                const clearanceY = slotY - 45; // 45px clearance above slot center
                
                slotCoordinates[i] = {
                    x: slotX,
                    y: slotY,
                    clearanceY: clearanceY
                };
            }
        }
        
        // Restore transforms
        xCarriage.style.transform = oldXTransform;
        yCarriage.style.transform = oldYTransform;
        
        // Force reflow
        xCarriage.offsetHeight;
        
        // Restore transitions
        xCarriage.style.transition = oldXTransition;
        yCarriage.style.transition = oldYTransition;
    }

    // 4. Initialization & Setup
    function initCanvas() {
        // High DPI Canvas resizing
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        // Foreground Canvas
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Background Canvas
        if (bgCanvas && bgCtx) {
            bgCanvas.width = rect.width * dpr;
            bgCanvas.height = rect.height * dpr;
            bgCtx.scale(dpr, dpr);
        }
        
        // Bed Canvas
        if (bedCanvas && bedCtx) {
            const container = bedCanvas.parentElement;
            if (container) {
                const containerRect = container.getBoundingClientRect();
                bedCanvas.width = containerRect.width * dpr;
                bedCanvas.height = containerRect.height * dpr;
                bedCtx.scale(dpr, dpr);
            }
        }
        
        clearDrawingCanvas();
        updatePaperColorDOM();
        drawGraticuleGrid();
        drawBackgroundTemplate();
    }
    
    window.addEventListener('resize', () => {
        // Redraw content on resize
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        
        cacheLayoutDimensions(); // Recalculate dimensions!
        initCanvas();
        ctx.drawImage(tempCanvas, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        
        // Refresh carriage layout
        updateCarriageDOM(currentX, currentY);
    });

    // 5. Audio Synthesizer Engine
    function initAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Stepper motor sound source (Triangle wave)
            motorOsc = audioCtx.createOscillator();
            motorOsc.type = 'triangle';
            motorOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
            
            // Stepper resonance filter
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(150, audioCtx.currentTime);
            filter.Q.setValueAtTime(1.5, audioCtx.currentTime);

            motorGain = audioCtx.createGain();
            motorGain.gain.setValueAtTime(0, audioCtx.currentTime);
            
            motorOsc.connect(filter);
            filter.connect(motorGain);
            motorGain.connect(audioCtx.destination);
            
            motorOsc.start();
        } catch (e) {
            console.error('Audio initialization failed:', e);
        }
    }
    
    function playBeep(freq, duration) {
        if (!isPowerOn || !soundFxEnabled) return;
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    }
    
    function playClick() {
        playBeep(1200, 0.05);
    }
    
    function playChime() {
        if (!soundFxEnabled) return;
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        
        try {
            const now = audioCtx.currentTime;
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.frequency.setValueAtTime(800, now);
            gain1.gain.setValueAtTime(0.04, now);
            gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.15);
            
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.frequency.setValueAtTime(1050, now + 0.08);
            gain2.gain.setValueAtTime(0.04, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.3);
        } catch (e) {}
    }
    
    function updateMotorSound(velocityPct) {
        if (!isPowerOn || !soundFxEnabled || !motorGain) return;
        try {
            if (velocityPct < 0.02) {
                motorGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
            } else {
                const freq = 65 + velocityPct * 110; // Stepper motor pitch range 65Hz - 175Hz
                const vol = 0.005 + velocityPct * 0.012; // Cap motor sound to be soft
                
                motorOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.04);
                motorGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.04);
            }
        } catch (e) {}
    }

    // 6. Coordinate Translations (Plotter units -> Screen Coordinates)
    function plotterToCanvas(px, py) {
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        
        // Clamp to virtual physical limits [0, limitX] and [0, limitY]
        const clampedX = Math.max(0, Math.min(limitX, px));
        const clampedY = Math.max(0, Math.min(limitY, py));
        
        // Translate coords within the entire page bounds using bedScale
        const cx = clampedX * bedScale;
        const cy = canvasRectCached.height - clampedY * bedScale;
        
        return { x: cx, y: cy };
    }

    // Scaling template coordinates relative to current paper size to fit
    function templatePlotterToCanvas(px, py) {
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        
        const clampedX = Math.max(0, Math.min(limitX, px));
        const clampedY = Math.max(0, Math.min(limitY, py));
        
        const scaleX = canvasRectCached.width / limitX;
        const scaleY = canvasRectCached.height / limitY;
        const scale = Math.min(scaleX, scaleY);
        
        const offsetX = (canvasRectCached.width - limitX * scale) / 2;
        const offsetY = (canvasRectCached.height - limitY * scale) / 2;
        
        const cx = offsetX + clampedX * scale;
        const cy = canvasRectCached.height - (offsetY + clampedY * scale);
        
        return { x: cx, y: cy };
    }

    function plotterToPhysicalSlot(penIndex, py) {
        const slot = slotCoordinates[penIndex];
        
        // Logical baseline Y coordinate on the canvas (relative to bed)
        const canvasPt = plotterToCanvas(0, 0);
        const canvasY0 = canvasRectCached.top - bedRectCached.top + canvasPt.y;
        
        let slotX;
        let slotY;
        
        if (slot && slot.x !== 0 && slot.y !== 0) {
            slotX = slot.x;
            slotY = slot.y;
        } else {
            // Fallback to logical slot position mapped to canvas coordinate space
            const logicalPt = plotterToCanvas(penSlotsX[penIndex] || 0, 1200);
            slotX = canvasRectCached.left - bedRectCached.left + logicalPt.x;
            slotY = canvasRectCached.top - bedRectCached.top + logicalPt.y;
        }
        
        // py is logical Y from 0 (clearance/baseline) to 1200 (slot center/deposit)
        const ratio = Math.max(0, Math.min(1200, py)) / 1200;
        
        // Y goes from canvasY0 (when py = 0) to slotY (when py = 1200)
        const cy = canvasY0 + ratio * (slotY - canvasY0);
        
        return { x: slotX, y: cy };
    }
    
    let lastIsPhysical = false;
    let lastPenIndex = undefined;
    
    function updateCarriageDOM(px, py, isPhysical = undefined, penIndex = undefined) {
        if (arguments.length >= 3) {
            lastIsPhysical = !!isPhysical;
            if (penIndex !== undefined) {
                lastPenIndex = penIndex;
            } else if (!lastIsPhysical) {
                lastPenIndex = undefined;
            }
        }
        
        let expectedX, expectedY;
        if (lastPenIndex !== undefined) {
            const pt = plotterToPhysicalSlot(lastPenIndex, py);
            const canvasPt = plotterToCanvas(px, py);
            const canvasX = canvasRectCached.left - bedRectCached.left + canvasPt.x;
            const canvasY = canvasRectCached.top - bedRectCached.top + canvasPt.y;
            
            const targetSlotX = penSlotsX[lastPenIndex];
            const dist = Math.abs(px - targetSlotX);
            const blendRange = 1000;
            
            if (dist >= blendRange) {
                expectedX = canvasX;
                if (!lastIsPhysical) {
                    lastPenIndex = undefined; // clear tracking once we slide far away
                }
            } else {
                const ratio = dist / blendRange;
                const t = ratio * ratio * (3 - 2 * ratio);
                expectedX = pt.x + t * (canvasX - pt.x);
            }
            
            if (lastIsPhysical) {
                expectedY = pt.y;
            } else {
                expectedY = canvasY;
            }
        } else {
            const pt = plotterToCanvas(px, py);
            expectedX = canvasRectCached.left - bedRectCached.left + pt.x;
            expectedY = canvasRectCached.top - bedRectCached.top + pt.y;
        }
        
        // Required translations
        const tx = expectedX - penTipOffsetX;
        const ty = expectedY - penTipOffsetY;
        
        xCarriage.style.transform = `translateX(${tx}px)`;
        yCarriage.style.transform = `translateY(${ty}px)`;
        
        // Update Out of Limit LED based on physical hard limits and logical soft limits
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        
        const isOutOfHardLimits = px < 0 || px > limitX || py < 0 || py > limitY;
        const isOutOfSoftLimits = px < Math.min(softLimitX1, softLimitX2) || px > Math.max(softLimitX1, softLimitX2) || py < Math.min(softLimitY1, softLimitY2) || py > Math.max(softLimitY1, softLimitY2);
        
        if (!isPhysical && (isOutOfHardLimits || isOutOfSoftLimits)) {
            ledLimit.classList.add('active');
        } else {
            ledLimit.classList.remove('active');
        }
        
        // Update debugger card pen stats
        const debugCoordsEl = document.getElementById('debug-coords');
        if (debugCoordsEl) debugCoordsEl.textContent = `X: ${Math.round(px)}, Y: ${Math.round(py)}`;
        
        const debugPenStateEl = document.getElementById('debug-pen-state');
        if (debugPenStateEl) {
            debugPenStateEl.textContent = penState.toUpperCase();
            debugPenStateEl.style.color = penState === 'down' ? '#22c55e' : '#9ca3af';
        }
        
        const debugActivePenEl = document.getElementById('debug-active-pen');
        if (debugActivePenEl) {
            if (selectedPen === 0) {
                debugActivePenEl.textContent = 'None';
                debugActivePenEl.style.color = '';
            } else {
                debugActivePenEl.textContent = `Pen ${selectedPen}`;
                debugActivePenEl.style.color = penColors[selectedPen];
            }
        }
        
        const debugChartHoldEl = document.getElementById('debug-chart-hold');
        if (debugChartHoldEl) {
            debugChartHoldEl.textContent = isChartOnHold ? 'ON' : 'OFF';
            debugChartHoldEl.style.color = isChartOnHold ? '#22c55e' : '#ef4444';
        }
        
        // Update alignment lens magnification scope
        updateMagnifier(px, py);
    }

    function renderMagnifierToCanvas(canvasId, px, py, size) {
        const mCanvas = document.getElementById(canvasId);
        if (!mCanvas) return;
        const mCtx = mCanvas.getContext('2d');
        if (!mCtx) return;
        
        const dpr = window.devicePixelRatio || 1;
        const zoom = 2; // 2x magnification factor
        const srcSize = size / zoom;
        
        mCanvas.width = size * dpr;
        mCanvas.height = size * dpr;
        
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
        
        mCtx.save();
        mCtx.scale(dpr, dpr);
        
        const pt = plotterToCanvas(px, py);
        const sx = (pt.x - srcSize / 2) * dpr;
        const sy = (pt.y - srcSize / 2) * dpr;
        const sWidth = srcSize * dpr;
        const sHeight = srcSize * dpr;
        
        if (bgCanvas && bgCanvas.width > 0) {
            mCtx.drawImage(bgCanvas, sx, sy, sWidth, sHeight, 0, 0, size, size);
        }
        if (canvas && canvas.width > 0) {
            mCtx.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, size, size);
        }
        
        mCtx.restore();
    }

    function updateMagnifier(px, py) {
        // 1. Render to Debug Sidebar Magnifier Scope (Always if powered on)
        if (isPowerOn) {
            renderMagnifierToCanvas('debug-magnifier-canvas', px, py, 70);
        } else {
            // Clear debug canvas if powered off
            const mCanvas = document.getElementById('debug-magnifier-canvas');
            if (mCanvas) {
                const mCtx = mCanvas.getContext('2d');
                if (mCtx) mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
            }
        }

        // 2. Render to main Bed Magnifier Scope
        const lens = document.getElementById('magnifier-lens');
        if (!lens) return;
        
        if (selectedPen > 0 || !isPowerOn || lastIsPhysical) {
            lens.classList.remove('active');
            return;
        }
        
        lens.classList.add('active');
        renderMagnifierToCanvas('magnifier-canvas', px, py, 26);
        
        const ptCanvas = plotterToCanvas(px, py);
        const expectedX = canvasRectCached.left - bedRectCached.left + ptCanvas.x;
        const expectedY = canvasRectCached.top - bedRectCached.top + ptCanvas.y;
        
        lens.style.transform = `translate(${expectedX}px, ${expectedY}px) translate(-50%, -50%)`;
    }

    // 7. Stepper Motor Physics & Interpolation Loop
    let lastTime = 0;
    function animationLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        
        if (isPowerOn && !isInstantDraw && actionQueue.length > 0) {
            const currentAction = actionQueue[0];
            
            if (currentAction.type === 'move') {
                const dx = currentAction.x - currentX;
                const dy = currentAction.y - currentY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Slewing velocity (pen-up and physical moves) runs at slewSpeed (physical maximum).
                // Pen-down drawing movements are restricted to the selected writing speed.
                const activeSpeed = (!currentAction.draw || currentAction.isPhysical) ? slewSpeed : velocityMultiplier;
                const speedPlu = activeSpeed * 400;
                const maxStep = speedPlu * dt;
                
                if (dist <= maxStep) {
                    // Snap to target
                    if (currentAction.draw && penState === 'down' && selectedPen > 0) {
                        drawLineSegment(currentX, currentY, currentAction.x, currentAction.y);
                    }
                    currentX = currentAction.x;
                    currentY = currentAction.y;
                    
                    actionQueue.shift(); // complete move
                    updateMotorSound(0);
                } else {
                    // Interpolate step
                    const stepX = (dx / dist) * maxStep;
                    const stepY = (dy / dist) * maxStep;
                    
                    const nextX = currentX + stepX;
                    const nextY = currentY + stepY;
                    
                    if (currentAction.draw && penState === 'down' && selectedPen > 0) {
                        drawLineSegment(currentX, currentY, nextX, nextY);
                    }
                    
                    currentX = nextX;
                    currentY = nextY;
                    
                    // Velocity percentage for whine audio (uses active movement speed)
                    const speedPct = activeSpeed / 100;
                    updateMotorSound(speedPct);
                }
                
                updateCarriageDOM(currentX, currentY, currentAction.isPhysical, currentAction.penIndex);
                
            } else if (currentAction.type === 'state') {
                // Instantly update penState or physical components
                if (currentAction.key === 'penState') {
                    penState = currentAction.val;
                    if (penState === 'down') {
                        carriagePenTip.classList.add('down');
                        playBeep(450, 0.08); // Pen Drop click
                    } else {
                        carriagePenTip.classList.remove('down');
                        playBeep(650, 0.08); // Pen Lift click
                    }
                } else if (currentAction.key === 'takePen') {
                    selectedPen = currentAction.val;
                    // Carriage takes pen
                    carriagePenTip.style.backgroundColor = penColors[selectedPen];
                    // Slot is empty
                    document.getElementById(`pen-body-${selectedPen}`).classList.add('empty');
                    playBeep(900, 0.12);
                    updateMagnifier(currentX, currentY);
                } else if (currentAction.key === 'putPen') {
                    const pen = currentAction.val;
                    // Slot is full
                    document.getElementById(`pen-body-${pen}`).classList.remove('empty');
                    // Carriage is empty
                    selectedPen = 0;
                    carriagePenTip.style.backgroundColor = 'transparent';
                    playBeep(700, 0.12);
                    updateMagnifier(currentX, currentY);
                } else if (currentAction.key === 'selectPen') {
                    // Lightweight pen select used by fill — no carousel animation
                    selectedPen = currentAction.val;
                    if (selectedPen > 0) {
                        carriagePenTip.style.backgroundColor = penColors[selectedPen];
                    } else {
                        carriagePenTip.style.backgroundColor = 'transparent';
                    }
                } else if (currentAction.key === 'char') {
                    renderSingleChar(currentAction.val.char, currentAction.val.x, currentAction.val.y, currentAction.val.isSymbol, currentAction.val.slant, currentAction.val.fontKind || 48);
                } else if (currentAction.key === 'softLimits') {
                    softLimitX1 = currentAction.val.x1;
                    softLimitY1 = currentAction.val.y1;
                    softLimitX2 = currentAction.val.x2;
                    softLimitY2 = currentAction.val.y2;
                } else if (currentAction.key === 'lineType') {
                    activeLineType = currentAction.val;
                } else if (currentAction.key === 'fillPolygon') {
                    drawFillPolygon(
                        currentAction.val,
                        currentAction.penIndex,
                        currentAction.fillType !== undefined ? currentAction.fillType : 1,
                        currentAction.fillSpacing !== undefined ? currentAction.fillSpacing : 0,
                        currentAction.fillAngle !== undefined ? currentAction.fillAngle : 0
                    );
                }
                
                actionQueue.shift(); // complete state change
                
            }
        } else if (isPowerOn && isInstantDraw && actionQueue.length > 0) {
            // Instant drawing mode (bypass carriage interpolation)
            updateMotorSound(0);
            let lastPhysical = false;
            let lastPenIndex = undefined;
            while (actionQueue.length > 0) {
                const currentAction = actionQueue.shift();
                if (currentAction.type === 'move') {
                    if (currentAction.draw && penState === 'down' && selectedPen > 0) {
                        drawLineSegment(currentX, currentY, currentAction.x, currentAction.y);
                    }
                    currentX = currentAction.x;
                    currentY = currentAction.y;
                    lastPhysical = !!currentAction.isPhysical;
                    lastPenIndex = currentAction.penIndex;
                } else if (currentAction.type === 'state') {
                    if (currentAction.key === 'penState') {
                        penState = currentAction.val;
                        if (penState === 'down') carriagePenTip.classList.add('down');
                        else carriagePenTip.classList.remove('down');
                    } else if (currentAction.key === 'takePen') {
                        selectedPen = currentAction.val;
                        carriagePenTip.style.backgroundColor = penColors[selectedPen];
                        document.getElementById(`pen-body-${selectedPen}`).classList.add('empty');
                    } else if (currentAction.key === 'putPen') {
                        const pen = currentAction.val;
                        document.getElementById(`pen-body-${pen}`).classList.remove('empty');
                        selectedPen = 0;
                        carriagePenTip.style.backgroundColor = 'transparent';
                    } else if (currentAction.key === 'char') {
                        renderSingleChar(currentAction.val.char, currentAction.val.x, currentAction.val.y, currentAction.val.isSymbol, currentAction.val.slant, currentAction.val.fontKind || 48);
                    } else if (currentAction.key === 'softLimits') {
                        softLimitX1 = currentAction.val.x1;
                        softLimitY1 = currentAction.val.y1;
                        softLimitX2 = currentAction.val.x2;
                        softLimitY2 = currentAction.val.y2;
                    } else if (currentAction.key === 'lineType') {
                        activeLineType = currentAction.val;
                    } else if (currentAction.key === 'fillPolygon') {
                        drawFillPolygon(
                            currentAction.val,
                            currentAction.penIndex,
                            currentAction.fillType !== undefined ? currentAction.fillType : 1,
                            currentAction.fillSpacing !== undefined ? currentAction.fillSpacing : 0,
                            currentAction.fillAngle !== undefined ? currentAction.fillAngle : 0
                        );
                    }
                }
            }
            updateCarriageDOM(currentX, currentY, lastPhysical, lastPenIndex);
        } else {
            // Idle
            updateMotorSound(0);
            
            // Debugger auto-advancer hook
            if (isPowerOn && debugState === 'running' && actionQueue.length === 0) {
                if (debugActiveIndex >= 0 && debugActiveIndex < debugQueue.length && debugQueue[debugActiveIndex].state === 'active') {
                    debugQueue[debugActiveIndex].state = 'done';
                }
                stepDebugger();
            } else if (isPowerOn && debugState === 'paused' && actionQueue.length === 0) {
                if (debugActiveIndex >= 0 && debugActiveIndex < debugQueue.length && debugQueue[debugActiveIndex].state === 'active') {
                    debugQueue[debugActiveIndex].state = 'done';
                    renderDebugQueue();
                    updateDebugUIStatus();
                }
            }
        }
        
        // Update live status indicators
        updateTerminalLogStatus();
        
        requestAnimationFrame(animationLoop);
    }
    requestAnimationFrame(animationLoop);

    // 8. Line Drawing Operations
    // Cohen-Sutherland Line Clipping Helper
    const INSIDE = 0; // 0000
    const LEFT = 1;   // 0001
    const RIGHT = 2;  // 0010
    const BOTTOM = 4; // 0100
    const TOP = 8;    // 1000

    function computeOutCode(x, y, xmin, ymin, xmax, ymax) {
        let code = INSIDE;
        if (x < xmin)      code |= LEFT;
        else if (x > xmax) code |= RIGHT;
        if (y < ymin)      code |= BOTTOM;
        else if (y > ymax) code |= TOP;
        return code;
    }

    function clipLine(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
        let code1 = computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
        let code2 = computeOutCode(x2, y2, xmin, ymin, xmax, ymax);
        let accept = false;

        while (true) {
            if ((code1 | code2) === 0) {
                accept = true;
                break;
            } else if ((code1 & code2) !== 0) {
                break;
            } else {
                let x, y;
                const outcodeOut = code1 !== 0 ? code1 : code2;

                if (outcodeOut & TOP) {
                    x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
                    y = ymax;
                } else if (outcodeOut & BOTTOM) {
                    x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
                    y = ymin;
                } else if (outcodeOut & RIGHT) {
                    y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
                    x = xmax;
                } else if (outcodeOut & LEFT) {
                    y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
                    x = xmin;
                }

                if (outcodeOut === code1) {
                    x1 = x;
                    y1 = y;
                    code1 = computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
                } else {
                    x2 = x;
                    y2 = y;
                    code2 = computeOutCode(x2, y2, xmin, ymin, xmax, ymax);
                }
            }
        }

        if (accept) {
            return { x1, y1, x2, y2, visible: true };
        } else {
            return { visible: false };
        }
    }
        
    function getPolygonHatchLines(pts, spacingPlu, angleDeg) {
        if (pts.length < 3) return [];
        
        const angleRad = angleDeg * Math.PI / 180;
        const cosA = Math.cos(angleRad);
        const sinA = Math.sin(angleRad);
        
        const rotPts = pts.map(pt => {
            return {
                x: pt.x * cosA + pt.y * sinA,
                y: -pt.x * sinA + pt.y * cosA
            };
        });
        
        let minY = rotPts[0].y;
        let maxY = rotPts[0].y;
        for (const pt of rotPts) {
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
        }
        
        const lines = [];
        const startY = Math.ceil(minY / spacingPlu) * spacingPlu;
        
        for (let y = startY; y <= maxY; y += spacingPlu) {
            const intersections = [];
            
            for (let i = 0; i < rotPts.length; i++) {
                const p1 = rotPts[i];
                const p2 = rotPts[(i + 1) % rotPts.length];
                
                if (Math.abs(p1.y - p2.y) < 1e-5) continue;
                
                if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                    const intersectX = p1.x + (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y);
                    intersections.push(intersectX);
                }
            }
            
            intersections.sort((a, b) => a - b);
            
            for (let j = 0; j < intersections.length - 1; j += 2) {
                const x1 = intersections[j];
                const x2 = intersections[j + 1];
                
                const rx1 = x1 * cosA - y * sinA;
                const ry1 = x1 * sinA + y * cosA;
                const rx2 = x2 * cosA - y * sinA;
                const ry2 = x2 * sinA + y * cosA;
                
                lines.push({ x1: rx1, y1: ry1, x2: rx2, y2: ry2 });
            }
        }
        
        return lines;
    }

    function queuePolygonFillOrHatch(pts) {
        if (pts.length < 3) return;

        // Use selected pen, falling back to pen 1 if none is active
        const effectivePen = logicalSelectedPen > 0 ? logicalSelectedPen : 1;

        let spacingPlu = 400; // default 10mm
        // FT1 = solid fill, FT2 = line fill, FT3 = single-angle hatch, FT4 = cross-hatch
        const isSolid = (activeFillType === 1 || !activeFillType);

        if (isSolid) {
            const penWidthMm = penWidths[effectivePen] || 0.3;
            spacingPlu = penWidthMm * 40;
            if (spacingPlu < 4) spacingPlu = 12; // safety minimum
        } else {
            if (activeFillSpacing && activeFillSpacing > 0) {
                spacingPlu = activeFillSpacing * 40; // mm to plotter units
            } else {
                const diag = Math.sqrt(Math.pow(p2X - p1X, 2) + Math.pow(p2Y - p1Y, 2));
                spacingPlu = Math.max(10, diag * 0.01);
            }
        }

        const fillAngle = activeFillAngle || 0;
        let hatchLines = getPolygonHatchLines(pts, spacingPlu, fillAngle);

        // FT4 = cross-hatch: add a second pass perpendicular to the first
        if (activeFillType === 4) {
            hatchLines = hatchLines.concat(getPolygonHatchLines(pts, spacingPlu, fillAngle + 90));
        }

        if (hatchLines.length > 0) {
            const savedPenState = penStateLogical;
            actionQueue.push({ type: 'state', key: 'penState', val: 'up' });

            for (const line of hatchLines) {
                actionQueue.push({ type: 'move', x: line.x1, y: line.y1, draw: false });
                actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                actionQueue.push({ type: 'move', x: line.x2, y: line.y2, draw: true });
                actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
            }

            actionQueue.push({ type: 'state', key: 'penState', val: savedPenState });
        }
    }

    function drawFillPolygon(pts, penIndex, type, spacing, angle) {
        if (pts.length < 3) return;

        // No pen selected = nothing draws (correct HP-GL behaviour)
        if (penIndex === 0) return;
        const effectivePen = penIndex;

        ctx.beginPath();
        const firstPt = plotterToCanvas(pts[0].x, pts[0].y);
        ctx.moveTo(firstPt.x, firstPt.y);
        for (let i = 1; i < pts.length; i++) {
            const pt = plotterToCanvas(pts[i].x, pts[i].y);
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();

        const color = penColors[effectivePen] || '#1c1917';

        // FT1 or default = solid canvas fill
        if (type === 1 || !type) {
            ctx.fillStyle = color;
            ctx.fill();
        } else if (type === 2 || type === 3 || type === 4) {
            // FT2 = line fill, FT3 = single-angle hatch, FT4 = cross-hatch
            ctx.save();
            ctx.clip();

            ctx.strokeStyle = color;
            const widthMm = penWidths[effectivePen] || 0.3;
            ctx.lineWidth = Math.max(0.5, widthMm * 3.5);
            ctx.setLineDash([]);

            let spacingPlu = 400; // default 10mm
            if (spacing && spacing > 0) {
                spacingPlu = spacing * 40; // mm to plotter units
            } else {
                const diag = Math.sqrt(Math.pow(p2X - p1X, 2) + Math.pow(p2Y - p1Y, 2));
                spacingPlu = Math.max(10, diag * 0.01);
            }
            const currentScaleFactor = bedScale * (autoScaleActive ? fitScale : 1);
            const spacingPx = spacingPlu * currentScaleFactor;

            const angleRad = (angle || 0) * Math.PI / 180;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const diagMax = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);

            ctx.translate(cx, cy);
            ctx.rotate(-angleRad);

            ctx.beginPath();
            for (let offset = -diagMax; offset <= diagMax; offset += spacingPx) {
                ctx.moveTo(-diagMax, offset);
                ctx.lineTo(diagMax, offset);
            }
            ctx.stroke();

            // FT4 = cross-hatch: add perpendicular set of lines
            if (type === 4) {
                ctx.beginPath();
                for (let offset = -diagMax; offset <= diagMax; offset += spacingPx) {
                    ctx.moveTo(offset, -diagMax);
                    ctx.lineTo(offset, diagMax);
                }
                ctx.stroke();
            }

            ctx.restore();
        } else {
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    function drawLineSegment(x1, y1, x2, y2) {
        if (x1 === x2 && y1 === y2) return;
        
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        
        const clipX1 = Math.max(0, Math.min(softLimitX1, softLimitX2));
        const clipX2 = Math.min(limitX, Math.max(softLimitX1, softLimitX2));
        const clipY1 = Math.max(0, Math.min(softLimitY1, softLimitY2));
        const clipY2 = Math.min(limitY, Math.max(softLimitY1, softLimitY2));
        
        const clipped = clipLine(x1, y1, x2, y2, clipX1, clipY1, clipX2, clipY2);
        if (!clipped.visible) return;
        
        const pt1 = plotterToCanvas(clipped.x1, clipped.y1);
        const pt2 = plotterToCanvas(clipped.x2, clipped.y2);
        
        if (activeLineType === 'type-0') {
            ctx.fillStyle = penColors[selectedPen] || '#1c1917';
            const widthMm = penWidths[selectedPen] || 0.3;
            const radius = Math.max(0.5, widthMm * 3.5) / 2;
            ctx.beginPath();
            ctx.arc(pt1.x, pt1.y, radius, 0, 2 * Math.PI);
            ctx.arc(pt2.x, pt2.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            return;
        }
        
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        
        ctx.strokeStyle = penColors[selectedPen] || '#1c1917';
        const widthMm = penWidths[selectedPen] || 0.3;
        ctx.lineWidth = Math.max(0.5, widthMm * 3.5);
        
        applyLineType();
        
        ctx.stroke();
    }
    
    function applyLineType() {
        if (activeLineType === 'solid') {
            ctx.setLineDash([]);
        } else if (activeLineType.startsWith('custom-')) {
            const idx = activeLineType.substring(7);
            const pattern = userDashPatterns[idx];
            if (pattern && pattern.length > 0) {
                const scale = bedScale * (autoScaleActive ? fitScale : 1);
                ctx.setLineDash(pattern.map(v => v * scale));
            } else {
                ctx.setLineDash([]);
            }
        } else if (activeLineType === 'type-1') { // Dotted pattern
            ctx.setLineDash([1, 8]);
        } else if (activeLineType === 'type-2') { // Short dashed pattern
            ctx.setLineDash([6, 6]);
        } else if (activeLineType === 'type-3') { // Long dashed pattern
            ctx.setLineDash([16, 8]);
        } else if (activeLineType === 'type-4') { // Dot-Dash pattern
            ctx.setLineDash([16, 6, 1, 6]);
        } else if (activeLineType === 'type-5') { // Short/Long Dash alternative pattern
            ctx.setLineDash([10, 6, 4, 6]);
        } else if (activeLineType === 'type-6') { // Long/Medium Dash pattern
            ctx.setLineDash([16, 6, 8, 6]);
        } else if (activeLineType === 'type-7') { // Double Dot-Dash pattern
            ctx.setLineDash([16, 6, 1, 6, 1, 6]);
        } else if (activeLineType === 'type-8') { // Triple Dot-Dash pattern
            ctx.setLineDash([16, 6, 1, 6, 1, 6, 1, 6]);
        }
    }

    // Map HP-GL/2 typeface number (SD/AD kind 7) to a CSS font-family stack.
    // Common HP-GL typeface numbers: 48=Stick/proportional, 5=Roman, 6=Roman Italic,
    // 3=Simplex Roman, 4=Complex Roman, 31=Gothic English, 34=Script, 52=Proportional
    function hpglFontKindToFace(kind) {
        switch (kind) {
            case 3:  // Simplex Roman (Stick)
            case 48: // HP Stick (default proportional)
                return '"Fira Code", Courier, monospace';
            case 4:  // Complex Roman
            case 5:  // Roman Simplex
            case 52: // Proportional Helvetica-style
                return '"Arial", "Helvetica", sans-serif';
            case 6:  // Roman Italic
                return 'italic "Arial", "Helvetica", sans-serif';
            case 31: // Gothic English
            case 34: // Script
                return '"Courier New", Courier, monospace';
            default:
                return '"Fira Code", Courier, monospace';
        }
    }
    // Single Character Rendering (LB command character-by-character step)
    function renderSingleChar(char, px, py, isSymbol = false, slant = 0, charFontKind = 48) {
        if (selectedPen === 0) return;
        
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        
        const clipX1 = Math.max(0, Math.min(softLimitX1, softLimitX2));
        const clipX2 = Math.min(limitX, Math.max(softLimitX1, softLimitX2));
        const clipY1 = Math.max(0, Math.min(softLimitY1, softLimitY2));
        const clipY2 = Math.min(limitY, Math.max(softLimitY1, softLimitY2));
        
        // Skip rendering if origin of character is outside the intersection of hard and soft limits
        if (px < clipX1 || px > clipX2 || py < clipY1 || py > clipY2) {
            return;
        }
        
        const angle = Math.atan2(labelDirection.rise, labelDirection.run);
        const charHeightPlu = labelCharSize.height * 400;
        
        // Canvas pixel scale mapping
        const scaleX = canvasRectCached.width / PAPER_WIDTH;
        const scaleY = canvasRectCached.height / PAPER_HEIGHT;
        const canvasScale = Math.min(scaleX, scaleY);
        const targetHeightPx = charHeightPlu * (autoScaleActive ? fitScale : 1) * canvasScale;
        
        // Enforce a minimum readable font size of 10px on screen
        const minFontSizePx = 10;
        const charHeightPx = Math.max(minFontSizePx, targetHeightPx);
        
        ctx.save();
        const pt = plotterToCanvas(px, py);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(-angle); // Rotate canvas context counter-clockwise (plotter-relative coords)
        if (slant !== 0) {
            ctx.transform(1, 0, -slant, 1, 0, 0); // Apply character slant (shear) transform
        }
        
        ctx.fillStyle = penColors[selectedPen];
        // Resolve canvas font from HP-GL character set (fontKind from queued char action)
        const resolvedFont = hpglFontKindToFace(charFontKind || 48);
        ctx.font = `${charHeightPx}px ${resolvedFont}`;
        
        if (isSymbol) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
        } else {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
        }
        
        ctx.fillText(char, 0, 0);
        
        ctx.restore();
    }

    function clearDrawingCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // --- Background Template & Graticule Rendering ---
    function getHexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function drawBgLine(x1, y1, x2, y2, color, width = 1) {
        if (!bgCtx) return;
        const pt1 = templatePlotterToCanvas(x1, y1);
        const pt2 = templatePlotterToCanvas(x2, y2);
        bgCtx.beginPath();
        bgCtx.moveTo(pt1.x, pt1.y);
        bgCtx.lineTo(pt2.x, pt2.y);
        bgCtx.strokeStyle = color;
        bgCtx.lineWidth = width;
        bgCtx.stroke();
    }

    // Background text drawer
    function drawBgText(text, x, y, color, align = "center", baseline = "middle") {
        if (!bgCtx) return;
        const pt = templatePlotterToCanvas(x, y);
        bgCtx.font = "8px sans-serif";
        bgCtx.fillStyle = color;
        bgCtx.textAlign = align;
        bgCtx.textBaseline = baseline;
        bgCtx.fillText(text, pt.x, pt.y);
    }

    function drawBgCircle(cx, cy, r, color, width = 1) {
        if (!bgCtx) return;
        const pt = templatePlotterToCanvas(cx, cy);
        const scaleX = canvasRectCached.width / PAPER_WIDTH;
        const scaleY = canvasRectCached.height / PAPER_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        const rPx = r * scale;
        bgCtx.beginPath();
        bgCtx.arc(pt.x, pt.y, rPx, 0, 2 * Math.PI);
        bgCtx.strokeStyle = color;
        bgCtx.lineWidth = width;
        bgCtx.stroke();
    }

    function drawBedLine(x1, y1, x2, y2, color, width = 1) {
        if (!bedCtx) return;
        const pt1 = plotterToBedCanvas(x1, y1);
        const pt2 = plotterToBedCanvas(x2, y2);
        bedCtx.beginPath();
        bedCtx.moveTo(pt1.x, pt1.y);
        bedCtx.lineTo(pt2.x, pt2.y);
        bedCtx.strokeStyle = color;
        bedCtx.lineWidth = width;
        bedCtx.stroke();
    }

    function drawBedText(text, x, y, color, align = "center", baseline = "middle") {
        if (!bedCtx) return;
        const pt = plotterToBedCanvas(x, y);
        bedCtx.font = "8px sans-serif";
        bedCtx.fillStyle = color;
        bedCtx.textAlign = align;
        bedCtx.textBaseline = baseline;
        bedCtx.fillText(text, pt.x, pt.y);
    }

    function plotterToBedCanvas(px, py) {
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        const clampedX = Math.max(0, Math.min(limitX, px));
        const clampedY = Math.max(0, Math.min(limitY, py));
        const bedRect = bedCanvas.getBoundingClientRect();
        const cx = (clampedX / limitX) * bedRect.width;
        const cy = (1 - clampedY / limitY) * bedRect.height;
        return { x: cx, y: cy };
    }

    function drawGraticuleGrid() {
        if (!bedCtx || !bedCanvas) return;
        
        bedCtx.clearRect(0, 0, bedCanvas.width / (window.devicePixelRatio || 1), bedCanvas.height / (window.devicePixelRatio || 1));
        
        if (!isGridEnabled) return;
        
        const hex = gridColor;
        const mmCol = getHexToRgba(hex, 0.05);
        const cmCol = getHexToRgba(hex, 0.16);
        const majorCol = getHexToRgba(hex, 0.32);
        const textCol = getHexToRgba(hex, 0.65);
        
        // Centimeter graticule covers the entire active bed space [0, limitX] and [0, limitY]
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        
        // Draw vertical lines (X)
        for (let xOffset = 0; xOffset <= limitX; xOffset += 40) {
            const isCm = (xOffset % 400 === 0);
            const isMajor = (xOffset % 2000 === 0);
            
            if (!isCm) {
                drawBedLine(xOffset, 0, xOffset, limitY, mmCol, 0.5);
            } else {
                drawBedLine(xOffset, 0, xOffset, limitY, isMajor ? majorCol : cmCol, isMajor ? 1.0 : 0.7);
                if (isMajor && xOffset > 0 && xOffset < limitX) {
                    drawBedText(`${xOffset / 400}`, xOffset, 120, textCol, "center", "top");
                }
            }
        }
        
        // Draw horizontal lines (Y)
        for (let yOffset = 0; yOffset <= limitY; yOffset += 40) {
            const isCm = (yOffset % 400 === 0);
            const isMajor = (yOffset % 2000 === 0);
            
            if (!isCm) {
                drawBedLine(0, yOffset, limitX, yOffset, mmCol, 0.5);
            } else {
                drawBedLine(0, yOffset, limitX, yOffset, isMajor ? majorCol : cmCol, isMajor ? 1.0 : 0.7);
                if (isMajor && yOffset > 0 && yOffset < limitY) {
                    drawBedText(`${yOffset / 400}`, 120, yOffset, textCol, "left", "middle");
                }
            }
        }
    }

    function drawTemplateHeader(titleText) {
        if (!bgCtx) return;
        const color = ['blueprint', 'black'].includes(activePaperColor) ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.8)';
        const textCol = ['blueprint', 'black'].includes(activePaperColor) ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)';
        
        // Draw outer borders
        drawBgLine(PAPER_MIN_X, PAPER_MIN_Y, PAPER_MAX_X, PAPER_MIN_Y, color, 1.6);
        drawBgLine(PAPER_MAX_X, PAPER_MIN_Y, PAPER_MAX_X, PAPER_MAX_Y, color, 1.6);
        drawBgLine(PAPER_MAX_X, PAPER_MAX_Y, PAPER_MIN_X, PAPER_MAX_Y, color, 1.6);
        drawBgLine(PAPER_MIN_X, PAPER_MAX_Y, PAPER_MIN_X, PAPER_MIN_Y, color, 1.6);
        
        // Draw double line effect (inner border 80 PLU inside)
        const offset = 80;
        drawBgLine(PAPER_MIN_X + offset, PAPER_MIN_Y + offset, PAPER_MAX_X - offset, PAPER_MIN_Y + offset, color, 0.6);
        drawBgLine(PAPER_MAX_X - offset, PAPER_MIN_Y + offset, PAPER_MAX_X - offset, PAPER_MAX_Y - offset, color, 0.6);
        drawBgLine(PAPER_MAX_X - offset, PAPER_MAX_Y - offset, PAPER_MIN_X + offset, PAPER_MAX_Y - offset, color, 0.6);
        drawBgLine(PAPER_MIN_X + offset, PAPER_MAX_Y - offset, PAPER_MIN_X + offset, PAPER_MIN_Y + offset, color, 0.6);
        
        // Draw title blocks
        const blockY = PAPER_MAX_Y + 120;
        drawBgText(titleText, PAPER_MIN_X + 100, blockY, color, "left", "bottom");
        drawBgText("DATE: ____________   PROJECT: ______________________   SHEET NO: ____", PAPER_MAX_X - 100, blockY, textCol, "right", "bottom");
    }

    function drawLinearGridLabels() {
        const color = ['blueprint', 'black'].includes(activePaperColor) ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
        
        // X centimeter numbers
        for (let xOffset = 0; xOffset <= PAPER_WIDTH; xOffset += 400) {
            const px = PAPER_MIN_X + xOffset;
            if (xOffset > 0 && xOffset < PAPER_WIDTH) {
                drawBgText(`${xOffset / 400}`, px, PAPER_MIN_Y - 180, color, "center", "top");
            }
        }
        
        // Y centimeter numbers
        for (let yOffset = 0; yOffset <= PAPER_HEIGHT; yOffset += 400) {
            const py = PAPER_MIN_Y + yOffset;
            if (yOffset > 0 && yOffset < PAPER_HEIGHT) {
                drawBgText(`${yOffset / 400}`, PAPER_MIN_X - 180, py, color, "right", "middle");
            }
        }
    }

    function drawLogLabelsX(startX, stepX, cycleNum) {
        const color = ['blueprint', 'black'].includes(activePaperColor) ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
        const base = Math.pow(10, cycleNum);
        
        const labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        labels.forEach(d => {
            const px = startX + stepX * Math.log10(d);
            const val = d * base;
            if (d === 1 || d === 2 || d === 5 || d === 10) {
                drawBgText(`${val}`, px, PAPER_MIN_Y - 180, color, "center", "top");
            }
        });
    }

    function drawLogLabelsY(startY, stepY, cycleNum) {
        const color = ['blueprint', 'black'].includes(activePaperColor) ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
        const base = Math.pow(10, cycleNum);
        
        const labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        labels.forEach(d => {
            const py = startY + stepY * Math.log10(d);
            const val = d * base;
            if (d === 1 || d === 2 || d === 5 || d === 10) {
                drawBgText(`${val}`, PAPER_MIN_X - 180, py, color, "right", "middle");
            }
        });
    }

    function drawEngineeringTemplate() {
        drawTemplateHeader("ENGINEERING DRAWING SHEET");
    }

    function drawLinearGrid() {
        const isDark = ['blueprint', 'black'].includes(activePaperColor);
        
        let gridColorHex = 'rgba(234, 88, 12, 0.12)';
        let majorColorHex = 'rgba(234, 88, 12, 0.25)';
        if (activePaperColor === 'white') {
            gridColorHex = 'rgba(9, 9, 11, 0.08)';
            majorColorHex = 'rgba(9, 9, 11, 0.18)';
        } else if (isDark) {
            gridColorHex = 'rgba(244, 63, 94, 0.15)';
            majorColorHex = 'rgba(244, 63, 94, 0.3)';
        } else if (activePaperColor === 'green') {
            gridColorHex = 'rgba(4, 120, 87, 0.12)';
            majorColorHex = 'rgba(4, 120, 87, 0.25)';
        }
        
        for (let xOffset = 0; xOffset <= PAPER_WIDTH; xOffset += 80) {
            const px = PAPER_MIN_X + xOffset;
            const isCm = (xOffset % 400 === 0);
            drawBgLine(px, PAPER_MIN_Y, px, PAPER_MAX_Y, isCm ? majorColorHex : gridColorHex, isCm ? 0.9 : 0.45);
        }
        for (let yOffset = 0; yOffset <= PAPER_HEIGHT; yOffset += 80) {
            const py = PAPER_MIN_Y + yOffset;
            const isCm = (yOffset % 400 === 0);
            drawBgLine(PAPER_MIN_X, py, PAPER_MAX_X, py, isCm ? majorColorHex : gridColorHex, isCm ? 0.9 : 0.45);
        }
        
        drawTemplateHeader("CENTIMETER GRID GRAPH PAPER");
        drawLinearGridLabels();
    }

    function drawLogLogGrid() {
        const isDark = ['blueprint', 'black'].includes(activePaperColor);
        const color = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.12)';
        const majorColor = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.3)';
        
        const cyclesX = 3;
        const stepX = PAPER_WIDTH / cyclesX;
        for (let c = 0; c < cyclesX; c++) {
            const startX = PAPER_MIN_X + c * stepX;
            for (let d = 1; d <= 10; d++) {
                const px = startX + stepX * Math.log10(d);
                drawBgLine(px, PAPER_MIN_Y, px, PAPER_MAX_Y, d === 1 || d === 10 ? majorColor : color, d === 1 || d === 10 ? 1.2 : 0.6);
            }
            drawLogLabelsX(startX, stepX, c);
        }
        
        const cyclesY = 3;
        const stepY = PAPER_HEIGHT / cyclesY;
        for (let c = 0; c < cyclesY; c++) {
            const startY = PAPER_MIN_Y + c * stepY;
            for (let d = 1; d <= 10; d++) {
                const py = startY + stepY * Math.log10(d);
                drawBgLine(PAPER_MIN_X, py, PAPER_MAX_X, py, d === 1 || d === 10 ? majorColor : color, d === 1 || d === 10 ? 1.2 : 0.6);
            }
            drawLogLabelsY(startY, stepY, c);
        }
        
        drawTemplateHeader("LOG-LOG GRAPH PAPER - 3 x 3 CYCLES");
    }

    function drawSemiLogGrid() {
        const isDark = ['blueprint', 'black'].includes(activePaperColor);
        const color = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.12)';
        const majorColor = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.3)';
        
        for (let xOffset = 0; xOffset <= PAPER_WIDTH; xOffset += 80) {
            const px = PAPER_MIN_X + xOffset;
            const isCm = (xOffset % 400 === 0);
            drawBgLine(px, PAPER_MIN_Y, px, PAPER_MAX_Y, isCm ? majorColor : color, isCm ? 0.9 : 0.45);
        }
        
        // Label X axis
        const labelCol = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
        for (let xOffset = 0; xOffset <= PAPER_WIDTH; xOffset += 400) {
            const px = PAPER_MIN_X + xOffset;
            if (xOffset > 0 && xOffset < PAPER_WIDTH) {
                drawBgText(`${xOffset / 400}`, px, PAPER_MIN_Y - 180, labelCol, "center", "top");
            }
        }
        
        const cyclesY = 3;
        const stepY = PAPER_HEIGHT / cyclesY;
        for (let c = 0; c < cyclesY; c++) {
            const startY = PAPER_MIN_Y + c * stepY;
            for (let d = 1; d <= 10; d++) {
                const py = startY + stepY * Math.log10(d);
                drawBgLine(PAPER_MIN_X, py, PAPER_MAX_X, py, d === 1 || d === 10 ? majorColor : color, d === 1 || d === 10 ? 1.2 : 0.6);
            }
            drawLogLabelsY(startY, stepY, c);
        }
        
        drawTemplateHeader("SEMI-LOGARITHMIC GRAPH PAPER - 3 CYCLES");
    }

    function drawSemiLogXGrid() {
        const isDark = ['blueprint', 'black'].includes(activePaperColor);
        const color = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.12)';
        const majorColor = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.3)';
        
        // Linear Y axis lines
        for (let yOffset = 0; yOffset <= PAPER_HEIGHT; yOffset += 80) {
            const py = PAPER_MIN_Y + yOffset;
            const isCm = (yOffset % 400 === 0);
            drawBgLine(PAPER_MIN_X, py, PAPER_MAX_X, py, isCm ? majorColor : color, isCm ? 0.9 : 0.45);
        }
        
        // Label Y axis
        const labelCol = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
        for (let yOffset = 0; yOffset <= PAPER_HEIGHT; yOffset += 400) {
            const py = PAPER_MIN_Y + yOffset;
            if (yOffset > 0 && yOffset < PAPER_HEIGHT) {
                drawBgText(`${yOffset / 400}`, PAPER_MIN_X - 180, py, labelCol, "right", "middle");
            }
        }
        
        // Logarithmic X axis lines (3 cycles)
        const cyclesX = 3;
        const stepX = PAPER_WIDTH / cyclesX;
        for (let c = 0; c < cyclesX; c++) {
            const startX = PAPER_MIN_X + c * stepX;
            for (let d = 1; d <= 10; d++) {
                const px = startX + stepX * Math.log10(d);
                drawBgLine(px, PAPER_MIN_Y, px, PAPER_MAX_Y, d === 1 || d === 10 ? majorColor : color, d === 1 || d === 10 ? 1.2 : 0.6);
            }
            drawLogLabelsX(startX, stepX, c);
        }
        
        drawTemplateHeader("SEMI-LOGARITHMIC GRAPH PAPER - 3 CYCLES (X-AXIS)");
    }

    function drawPolarGrid() {
        const isDark = ['blueprint', 'black'].includes(activePaperColor);
        const color = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.12)';
        const majorColor = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(15, 23, 42, 0.3)';
        
        const cx = PAPER_MIN_X + PAPER_WIDTH / 2;
        const cy = PAPER_MIN_Y + PAPER_HEIGHT / 2;
        const maxR = Math.min(PAPER_WIDTH, PAPER_HEIGHT) / 2 - 120;
        
        for (let r = 1000; r <= maxR; r += 1000) {
            const isMajor = (r % 2000 === 0);
            drawBgCircle(cx, cy, r, isMajor ? majorColor : color, isMajor ? 1.2 : 0.6);
            
            const textCol = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.55)';
            drawBgText(`${r}`, cx + r, cy + 80, textCol, "center", "bottom");
        }
        
        for (let deg = 0; deg < 360; deg += 15) {
            const rad = deg * Math.PI / 180;
            const rx = cx + maxR * Math.cos(rad);
            const ry = cy + maxR * Math.sin(rad);
            const isMajor = (deg % 45 === 0);
            drawBgLine(cx, cy, rx, ry, isMajor ? majorColor : color, isMajor ? 1.0 : 0.5);
            
            if (deg % 30 === 0) {
                const lx = cx + (maxR + 220) * Math.cos(rad);
                const ly = cy + (maxR + 220) * Math.sin(rad);
                drawBgText(`${deg}°`, lx, ly, isMajor ? majorColor : color, "center", "middle");
            }
        }
        
        drawTemplateHeader("POLAR COORDINATE REFERENCE SHEET");
    }

    function drawIsometricGrid() {
        if (!bgCtx) return;
        const isDark = ['blueprint', 'black'].includes(activePaperColor);
        const color = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.09)';
        
        bgCtx.save();
        
        // Define clipping path to keep lines within borders
        bgCtx.beginPath();
        const ptTopLeft = templatePlotterToCanvas(PAPER_MIN_X, PAPER_MAX_Y);
        const ptTopRight = templatePlotterToCanvas(PAPER_MAX_X, PAPER_MAX_Y);
        const ptBottomRight = templatePlotterToCanvas(PAPER_MAX_X, PAPER_MIN_Y);
        const ptBottomLeft = templatePlotterToCanvas(PAPER_MIN_X, PAPER_MIN_Y);
        
        bgCtx.moveTo(ptTopLeft.x, ptTopLeft.y);
        bgCtx.lineTo(ptTopRight.x, ptTopRight.y);
        bgCtx.lineTo(ptBottomRight.x, ptBottomRight.y);
        bgCtx.lineTo(ptBottomLeft.x, ptBottomLeft.y);
        bgCtx.closePath();
        bgCtx.clip();
        
        const step = 400;
        for (let y = PAPER_MIN_Y; y <= PAPER_MAX_Y; y += step) {
            drawBgLine(PAPER_MIN_X, y, PAPER_MAX_X, y, color, 0.6);
        }
        
        const tan30 = Math.tan(30 * Math.PI / 180);
        for (let x = PAPER_MIN_X - PAPER_HEIGHT / tan30; x <= PAPER_MAX_X + PAPER_HEIGHT / tan30; x += step * 2) {
            drawBgLine(x, PAPER_MIN_Y, x + PAPER_HEIGHT / tan30, PAPER_MAX_Y, color, 0.5);
            drawBgLine(x, PAPER_MIN_Y, x - PAPER_HEIGHT / tan30, PAPER_MAX_Y, color, 0.5);
        }
        
        bgCtx.restore();
        
        drawTemplateHeader("ISOMETRIC GRID 3D WORK SHEET");
    }

    function drawSmithChart() {
        if (!bgCtx) return;
        const isDark = ['blueprint', 'black'].includes(activePaperColor);
        const color = isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.15)';
        const majorColor = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(15, 23, 42, 0.35)';
        
        const cx = PAPER_MIN_X + PAPER_WIDTH / 2;
        const cy = PAPER_MIN_Y + PAPER_HEIGHT / 2;
        const scaleRadius = Math.min(PAPER_WIDTH, PAPER_HEIGHT) * 0.45;
        
        bgCtx.save();
        
        const outerPt = templatePlotterToCanvas(cx, cy);
        const scaleX = canvasRectCached.width / PAPER_WIDTH;
        const scaleY = canvasRectCached.height / PAPER_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        const outerR = scaleRadius * scale;
        bgCtx.beginPath();
        bgCtx.arc(outerPt.x, outerPt.y, outerR, 0, 2 * Math.PI);
        bgCtx.clip();
        
        const resistances = [0, 0.2, 0.5, 1.0, 2.0, 5.0];
        resistances.forEach(r => {
            const gr_c = r / (r + 1);
            const R_g = 1 / (r + 1);
            const circle_cx = cx + gr_c * scaleRadius;
            const circle_cy = cy;
            const circle_r = R_g * scaleRadius;
            const isMajor = (r === 0 || r === 1.0);
            drawBgCircle(circle_cx, circle_cy, circle_r, isMajor ? majorColor : color, isMajor ? 1.2 : 0.6);
        });
        
        const reactances = [0.2, 0.5, 1.0, 2.0, 5.0];
        reactances.forEach(x => {
            [x, -x].forEach(val => {
                const gr_c = 1;
                const gi_c = 1 / val;
                const R_g = Math.abs(1 / val);
                const circle_cx = cx + gr_c * scaleRadius;
                const circle_cy = cy + gi_c * scaleRadius;
                const circle_r = R_g * scaleRadius;
                drawBgCircle(circle_cx, circle_cy, circle_r, color, 0.6);
            });
        });
        
        drawBgLine(cx - scaleRadius, cy, cx + scaleRadius, cy, majorColor, 1.2);
        bgCtx.restore();
        
        // Draw outer boundary circle outline
        drawBgCircle(cx, cy, scaleRadius, majorColor, 1.5);
        
        // Add Smith Chart labels
        const labelCol = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
        resistances.forEach(r => {
            const gr_c = (r - 1) / (r + 1);
            const px = cx + gr_c * scaleRadius;
            drawBgText(`${r}`, px, cy - 80, labelCol, "center", "bottom");
        });
        
        // Add outer angle ring labels
        for (let deg = -180; deg <= 180; deg += 30) {
            const rad = deg * Math.PI / 180;
            const rx = cx + (scaleRadius + 180) * Math.cos(rad);
            const ry = cy + (scaleRadius + 180) * Math.sin(rad);
            drawBgText(`${deg}°`, rx, ry, labelCol, "center", "middle");
        }
        
        drawTemplateHeader("SMITH CHART IMPEDANCE REFERENCE CHART");
    }

    function drawCopyrightNotice() {
        if (!bgCtx) return;
        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const color = ['blueprint', 'black'].includes(activePaperColor) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(15, 23, 42, 0.25)';
        
        // Draw notice near bottom right of the page
        const pt = templatePlotterToCanvas(limitX - 300, 200);
        bgCtx.font = "5.5px sans-serif";
        bgCtx.fillStyle = color;
        bgCtx.textAlign = "right";
        bgCtx.textBaseline = "bottom";
        bgCtx.fillText("© NFfP 2026", pt.x, pt.y);
    }

    function drawBackgroundTemplate() {
        if (!bgCanvas || !bgCtx) return;
        bgCtx.clearRect(0, 0, bgCanvas.width / (window.devicePixelRatio || 1), bgCanvas.height / (window.devicePixelRatio || 1));
        
        if (activePaperTemplate === 'plain') {
            // Draw absolutely nothing (true plain sheet)
        } else if (activePaperTemplate === 'engineering') {
            drawEngineeringTemplate();
        } else if (activePaperTemplate === 'grid') {
            drawLinearGrid();
        } else if (activePaperTemplate === 'loglog') {
            drawLogLogGrid();
        } else if (activePaperTemplate === 'semilog') {
            drawSemiLogGrid();
        } else if (activePaperTemplate === 'semilogx') {
            drawSemiLogXGrid();
        } else if (activePaperTemplate === 'smith') {
            drawSmithChart();
        } else if (activePaperTemplate === 'polar') {
            drawPolarGrid();
        } else if (activePaperTemplate === 'isometric') {
            drawIsometricGrid();
        }
        
        drawCopyrightNotice();
    }

    function updatePaperColorDOM() {
        let colorValue = '#faf9f6'; // Cream default
        if (activePaperColor === 'white') colorValue = '#ffffff';
        else if (activePaperColor === 'blueprint') colorValue = '#0f172a';
        else if (activePaperColor === 'black') colorValue = '#1c1917';
        else if (activePaperColor === 'green') colorValue = '#ecfdf5';
        else if (activePaperColor === 'paleblue') colorValue = '#eff6ff'; // Pale Blue (HSL-based)
        else if (activePaperColor === 'paleyellow') colorValue = '#fefce8'; // Pale Yellow (HSL-based)
        else if (activePaperColor === 'palepink') colorValue = '#fdf2f8'; // Pale Pink (HSL-based)
        else if (activePaperColor === 'mattefilm') colorValue = 'rgba(228, 228, 231, 0.65)'; // Translucent Matte Mylar
        else if (activePaperColor === 'transparent') colorValue = 'transparent'; // Transparent film (clear plastic)
        
        paperSheet.style.backgroundColor = colorValue;
    }

    // 9. HPGL Parser State Machine
    function processIncomingHPGL(hpglText) {
        if (!isPowerOn) return;
        
        logCommand(hpglText);
        
        const rawText = hpglText.replace(/\r?\n|\r/g, ' ');
        let i = 0;
        const len = rawText.length;
        
        while (i < len) {
            // Skip leading spaces, semicolons, and control chars
            while (i < len && (rawText[i] === ' ' || rawText[i] === ';' || rawText[i] === '\r' || rawText[i] === '\n')) {
                i++;
            }
            if (i >= len) break;
            
            // Extract command mnemonic (first 2 alphabetical characters)
            if (i + 1 >= len) break;
            
            const mnemonic = rawText.substring(i, i + 2).toUpperCase();
            if (!/^[A-Z]{2}$/.test(mnemonic)) {
                i++;
                continue;
            }
            
            i += 2;
            
            let paramStr = "";
            if (mnemonic === 'LB') {
                const termChar = String.fromCharCode(labelTerminator);
                while (i < len) {
                    const char = rawText[i];
                    if (char === termChar) {
                        i++; // consume terminator
                        break;
                    }
                    paramStr += char;
                    i++;
                }
                executeHPGLCommand(mnemonic, [], paramStr);
                continue;
            }
            
            // General command parameter parsing: read until next mnemonic or semicolon
            while (i < len) {
                const char = rawText[i];
                if (char === ';') {
                    i++; // consume semicolon
                    break;
                }
                
                // If we see two letters starting a new command
                if (i + 1 < len) {
                    const nextTwo = rawText.substring(i, i + 2).toUpperCase();
                    if (/^[A-Z]{2}$/.test(nextTwo)) {
                        break;
                    }
                }
                
                paramStr += char;
                i++;
            }
            
            const params = [];
            const regex = /[-+]?[0-9]*\.?[0-9]+/g;
            let match;
            while ((match = regex.exec(paramStr)) !== null) {
                params.push(parseFloat(match[0]));
            }
            
            executeHPGLCommand(mnemonic, params, paramStr.trim());
        }
    }
    
    function executeHPGLCommand(mnemonic, params, rawParamStr) {
        try {
            switch (mnemonic) {
                case 'IN': // Initialize
                    actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                    // Put pen back if carriage is holding one (using safe vertical clearance route)
                    if (logicalSelectedPen > 0) {
                        const prevPen = logicalSelectedPen;
                        const clearanceY = 1200;
                        // Move vertically first to clearance line from current logical target coordinates
                        actionQueue.push({ type: 'move', x: targetX, y: clearanceY, draw: false });
                        // Move horizontally to slot
                        actionQueue.push({ type: 'move', x: penSlotsX[prevPen], y: clearanceY, draw: false, isPhysical: true, penIndex: prevPen });
                        // Move vertically down to deposit
                        actionQueue.push({ type: 'move', x: penSlotsX[prevPen], y: 0, draw: false, isPhysical: true, penIndex: prevPen });
                        // Put pen
                        actionQueue.push({ type: 'state', key: 'putPen', val: prevPen });
                        // Move straight up to clearance line
                        actionQueue.push({ type: 'move', x: penSlotsX[prevPen], y: clearanceY, draw: false, isPhysical: true, penIndex: prevPen });
                        // Move horizontally to target coordinate column (which is 0)
                        actionQueue.push({ type: 'move', x: 0, y: clearanceY, draw: false });
                    }
                    actionQueue.push({ type: 'move', x: 0, y: 0, draw: false });
                    
                    logicalSelectedPen = 0;
                    // Reset target coordinates logically to (0, 0)
                    targetX = 0;
                    targetY = 0;
                    penStateLogical = 'up';
                    
                    // Reset scaling parameters
                    p1X = PAPER_MIN_X; p1Y = PAPER_MIN_Y;
                    p2X = PAPER_MAX_X; p2Y = PAPER_MAX_Y;
                    userScaleActive = false;

                    // Reset auto-scale boundaries
                    scannedMinX = 0; scannedMaxX = MAX_X;
                    scannedMinY = 0; scannedMaxY = MAX_Y;
                    fitScale = 1;
                    fitOffsetX = PAPER_MIN_X;
                    fitOffsetY = PAPER_MIN_Y;
                    
                    // Reset labels parameters
                    labelCharSize = { width: 0.285, height: 0.375 };
                    labelDirection = { run: 1, rise: 0 };
                    activeLineType = 'solid';
                    actionQueue.push({ type: 'state', key: 'lineType', val: 'solid' });
                    labelTerminator = 3; // Reset to default ETX
                    labelOrigin = 21;
                    labelExtraSpaceWidth = 0.0;
                    labelExtraSpaceHeight = 0.0;
                    activeFillType = 1;
                    activeFillSpacing = 0;
                    activeFillAngle = 0;
                    activeTickLengthX = 100;
                    activeTickLengthY = 100;
                    activeSlant = 0;
                    activeCharSet = 'standard';
                    standardFontKind = 48;
                    alternateFontKind = 48;
                    chordToleranceMode = 0;
                    chordToleranceValue = 5;
                    symbolModeChar = '';
                    widthUnit = 0;
                    userDashPatterns = {};
                    coordinateRotation = 0;
                    
                    // Reset soft limits to physical limits in the queue
                    {
                        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
                        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
                        actionQueue.push({ type: 'state', key: 'softLimits', val: { x1: 0, y1: 0, x2: limitX, y2: limitY } });
                    }
                    
                    ledError.classList.remove('active');
                    break;
                    
                case 'DF': // Default Settings
                    p1X = PAPER_MIN_X; p1Y = PAPER_MIN_Y;
                    p2X = PAPER_MAX_X; p2Y = PAPER_MAX_Y;
                    userScaleActive = false;
                    labelCharSize = { width: 0.285, height: 0.375 };
                    labelDirection = { run: 1, rise: 0 };
                    activeLineType = 'solid';
                    actionQueue.push({ type: 'state', key: 'lineType', val: 'solid' });
                    labelTerminator = 3; // Reset to default ETX
                    labelOrigin = 21;
                    labelExtraSpaceWidth = 0.0;
                    labelExtraSpaceHeight = 0.0;
                    activeFillType = 1;
                    activeFillSpacing = 0;
                    activeFillAngle = 0;
                    activeTickLengthX = 100;
                    activeTickLengthY = 100;
                    activeSlant = 0;
                    activeCharSet = 'standard';
                    standardFontKind = 48;
                    alternateFontKind = 48;
                    chordToleranceMode = 0;
                    chordToleranceValue = 5;
                    symbolModeChar = '';
                    widthUnit = 0;
                    userDashPatterns = {};
                    coordinateRotation = 0;
                    
                    // Reset soft limits to physical limits in the queue
                    {
                        const limitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
                        const limitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
                        actionQueue.push({ type: 'state', key: 'softLimits', val: { x1: 0, y1: 0, x2: limitX, y2: limitY } });
                    }
                    break;
                    
                case 'SP': // Select Pen
                    const penVal = params[0] || 0;
                    const nextPen = Math.floor(Math.max(0, Math.min(8, penVal)));
                    
                    if (nextPen !== logicalSelectedPen) {
                        const originalX = targetX;
                        const originalY = targetY;
                        const clearanceY = 1200; // Y coordinate depth for the slot center (deposit)
                        
                        // 1. Lift Pen UP
                        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                        
                        // 2. Move vertically down to baseline y = 0 from current logical coordinate
                        actionQueue.push({ type: 'move', x: originalX, y: 0, draw: false });
                        
                        // 3. Put old pen back (if any)
                        if (logicalSelectedPen > 0) {
                            const oldPen = logicalSelectedPen;
                            // Move horizontally along the baseline y = 0 to old pen slot X coordinate
                            actionQueue.push({ type: 'move', x: penSlotsX[oldPen], y: 0, draw: false });
                            // Move straight down into the slot
                            actionQueue.push({ type: 'move', x: penSlotsX[oldPen], y: clearanceY, draw: false, isPhysical: true, penIndex: oldPen });
                            // Put the pen
                            actionQueue.push({ type: 'state', key: 'putPen', val: oldPen });
                            // Move straight up to physical clearance/baseline height (vertical exit)
                            actionQueue.push({ type: 'move', x: penSlotsX[oldPen], y: 0, draw: false, isPhysical: true, penIndex: oldPen });
                            // Transition to logical baseline y = 0 on the bed
                            actionQueue.push({ type: 'move', x: penSlotsX[oldPen], y: 0, draw: false });
                        }
                        
                        // 4. Retrieve new pen (if any)
                        if (nextPen > 0) {
                            // Move horizontally along the baseline y = 0 to the new pen slot X coordinate
                            actionQueue.push({ type: 'move', x: penSlotsX[nextPen], y: 0, draw: false });
                            // Move straight down into the slot (vertical entry)
                            actionQueue.push({ type: 'move', x: penSlotsX[nextPen], y: clearanceY, draw: false, isPhysical: true, penIndex: nextPen });
                            // Take the pen
                            actionQueue.push({ type: 'state', key: 'takePen', val: nextPen });
                            // Move straight up to physical clearance/baseline height (vertical exit)
                            actionQueue.push({ type: 'move', x: penSlotsX[nextPen], y: 0, draw: false, isPhysical: true, penIndex: nextPen });
                            // Transition to logical baseline y = 0 on the bed
                            actionQueue.push({ type: 'move', x: penSlotsX[nextPen], y: 0, draw: false });
                        }
                        
                        // 5. Return to pre-swap draw position
                        actionQueue.push({ type: 'move', x: originalX, y: 0, draw: false });
                        actionQueue.push({ type: 'move', x: originalX, y: originalY, draw: false });
                        
                        logicalSelectedPen = nextPen;
                    }
                    break;
                    
                case 'PU': // Pen Up
                    actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                    penStateLogical = 'up';
                    // Loop coordinate pairs
                    for (let i = 0; i < params.length; i += 2) {
                        if (params[i+1] !== undefined) {
                            const pt = scaleCoordinate(params[i], params[i+1]);
                            targetX = pt.x;
                            targetY = pt.y;
                            if (polygonMode) {
                                polygonBuffer.push({ x: targetX, y: targetY, draw: false });
                            } else {
                                actionQueue.push({ type: 'move', x: targetX, y: targetY, draw: false });
                            }
                        }
                    }
                    break;
                    
                case 'PD': // Pen Down
                    actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                    penStateLogical = 'down';
                    // Loop coordinate pairs
                    for (let i = 0; i < params.length; i += 2) {
                        if (params[i+1] !== undefined) {
                            const pt = scaleCoordinate(params[i], params[i+1]);
                            targetX = pt.x;
                            targetY = pt.y;
                            if (polygonMode) {
                                polygonBuffer.push({ x: targetX, y: targetY, draw: true });
                            } else {
                                actionQueue.push({ type: 'move', x: targetX, y: targetY, draw: true });
                            }
                        }
                    }
                    break;
                    
                case 'PA': // Plot Absolute
                    for (let i = 0; i < params.length; i += 2) {
                        if (params[i+1] !== undefined) {
                            const pt = scaleCoordinate(params[i], params[i+1]);
                            targetX = pt.x;
                            targetY = pt.y;
                            if (polygonMode) {
                                polygonBuffer.push({ x: targetX, y: targetY, draw: (penStateLogical === 'down') });
                            } else {
                                actionQueue.push({ type: 'move', x: targetX, y: targetY, draw: (penStateLogical === 'down') });
                                if (symbolModeChar && penStateLogical === 'down') {
                                    actionQueue.push({ type: 'state', key: 'char', val: { char: symbolModeChar, x: targetX, y: targetY, isSymbol: true } });
                                }
                            }
                        }
                    }
                    break;
                    
                case 'PR': // Plot Relative
                    for (let i = 0; i < params.length; i += 2) {
                        if (params[i+1] !== undefined) {
                            // Relatives are offset based on user scaling unit factors
                            let dx = params[i];
                            let dy = params[i+1];
                            
                            if (userScaleActive) {
                                dx = dx * (Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1));
                                dy = dy * (Math.abs(p2Y - p1Y) / (Math.abs(userY2 - userY1) || 1));
                            }
                            
                            if (autoScaleActive) {
                                dx = dx * fitScale;
                                dy = dy * fitScale;
                            }
                            
                            // Apply RO rotation to the relative delta vector
                            if (coordinateRotation !== 0) {
                                const rdx = dx, rdy = dy;
                                switch (coordinateRotation) {
                                    case 90:  dx = -rdy; dy =  rdx; break;
                                    case 180: dx = -rdx; dy = -rdy; break;
                                    case 270: dx =  rdy; dy = -rdx; break;
                                }
                            }
                            
                            targetX += dx;
                            targetY += dy;
                            if (polygonMode) {
                                polygonBuffer.push({ x: targetX, y: targetY, draw: (penStateLogical === 'down') });
                            } else {
                                actionQueue.push({ type: 'move', x: targetX, y: targetY, draw: (penStateLogical === 'down') });
                                if (symbolModeChar && penStateLogical === 'down') {
                                    actionQueue.push({ type: 'state', key: 'char', val: { char: symbolModeChar, x: targetX, y: targetY, isSymbol: true } });
                                }
                            }
                        }
                    }
                    break;
                    
                case 'IP': // Input scaling coordinates (P1 and P2)
                    if (params.length >= 4) {
                        p1X = params[0]; p1Y = params[1];
                        p2X = params[2]; p2Y = params[3];
                    } else {
                        // Reset defaults
                        p1X = PAPER_MIN_X; p1Y = PAPER_MIN_Y;
                        p2X = PAPER_MAX_X; p2Y = PAPER_MAX_Y;
                    }
                    break;
                    
                case 'SC': // Scale user coordinate limits
                    if (params.length >= 4) {
                        userScaleActive = true;
                        userX1 = params[0]; userX2 = params[1];
                        userY1 = params[2]; userY2 = params[3];
                    } else {
                        userScaleActive = false;
                    }
                    break;
                    
                case 'IW': // Input Window (Soft limits)
                    {
                        let x1, y1, x2, y2;
                        if (params.length >= 4) {
                            x1 = params[0];
                            y1 = params[1];
                            x2 = params[2];
                            y2 = params[3];
                        } else {
                            // Reset to current P1 and P2 coordinates
                            x1 = Math.min(p1X, p2X);
                            y1 = Math.min(p1Y, p2Y);
                            x2 = Math.max(p1X, p2X);
                            y2 = Math.max(p1Y, p2Y);
                        }
                        actionQueue.push({ type: 'state', key: 'softLimits', val: { x1, y1, x2, y2 } });
                    }
                    break;
                    
                case 'CI': // Circle
                    let r = params[0];
                    if (userScaleActive) {
                        r = r * (Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1));
                    }
                    if (autoScaleActive) {
                        r = r * fitScale;
                    }
                    const chordAngle = params[1] !== undefined ? params[1] : undefined;
                    if (r) {
                        drawCircleArc(r, chordAngle);
                    }
                    break;
                    
                case 'AA': // Arc Absolute
                    if (params.length >= 3) {
                        drawArc(params[0], params[1], params[2], params[3] !== undefined ? params[3] : undefined, false);
                    }
                    break;
                    
                case 'AR': // Arc Relative
                    if (params.length >= 3) {
                        drawArc(params[0], params[1], params[2], params[3] !== undefined ? params[3] : undefined, true);
                    }
                    break;

                case 'AT': // Arc Three-Point Absolute (HP-GL/2)
                    if (params.length >= 4) {
                        drawArcThreePoint(params[0], params[1], params[2], params[3], params[4] !== undefined ? params[4] : undefined, false);
                    }
                    break;

                 case 'RT': // Arc Three-Point Relative (HP-GL/2)
                    if (params.length >= 4) {
                        drawArcThreePoint(params[0], params[1], params[2], params[3], params[4] !== undefined ? params[4] : undefined, true);
                    }
                    break;
                    
                case 'WG': // Fill Wedge (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
    console.warn(`HP-GL/2 command WG not supported in HP-GL mode`);
    break;
                    }
                    if (params.length >= 3) {
                        let r = params[0];
                        if (userScaleActive) {
                            r = r * (Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1));
                        }
                        if (autoScaleActive) {
                            r = r * fitScale;
                        }
                        const startAngle = params[1];
                        const sweepAngle = params[2];
                        const chordAngle = params[3] !== undefined ? params[3] : getChordAngle(r);
                        
                        const cx = targetX;
                        const cy = targetY;
                        
                        const pts = [];
                        pts.push({ x: cx, y: cy });
                        
                        const startAngleRad = startAngle * Math.PI / 180;
                        const sweepAngleRad = sweepAngle * Math.PI / 180;
                        const chordAngleRad = chordAngle * Math.PI / 180;
                        const steps = Math.ceil(Math.abs(sweepAngleRad) / chordAngleRad);
                        const stepAngle = sweepAngle / steps;
                        
                        for (let j = 0; j <= steps; j++) {
                            const ang = (startAngle + j * stepAngle) * Math.PI / 180;
                            pts.push({ x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) });
                        }
                        pts.push({ x: cx, y: cy });
                        
                        queuePolygonFillOrHatch(pts);
                        actionQueue.push({ type: 'move', x: cx, y: cy, draw: false });
                    }
                    break;
                    
                case 'EW': // Edge Wedge (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
    console.warn(`HP-GL/2 command EW not supported in HP-GL mode`);
    break;
                    }
                    if (params.length >= 3) {
                        let r = params[0];
                        if (userScaleActive) {
                            r = r * (Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1));
                        }
                        if (autoScaleActive) {
                            r = r * fitScale;
                        }
                        const startAngle = params[1];
                        const sweepAngle = params[2];
                        const chordAngle = params[3] !== undefined ? params[3] : getChordAngle(r);
                        
                        const cx = targetX;
                        const cy = targetY;
                        
                        const startAngleRad = startAngle * Math.PI / 180;
                        const sweepAngleRad = sweepAngle * Math.PI / 180;
                        const chordAngleRad = chordAngle * Math.PI / 180;
                        const steps = Math.ceil(Math.abs(sweepAngleRad) / chordAngleRad);
                        const stepAngle = sweepAngle / steps;
                        
                        const savedPenState = penStateLogical;
                        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                        actionQueue.push({ type: 'move', x: cx, y: cy, draw: false });
                        actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                        
                        actionQueue.push({ x: cx + r * Math.cos(startAngleRad), y: cy + r * Math.sin(startAngleRad), draw: true, type: 'move' });
                        
                        for (let j = 1; j <= steps; j++) {
                            const ang = (startAngle + j * stepAngle) * Math.PI / 180;
                            actionQueue.push({ x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), draw: true, type: 'move' });
                        }
                        
                        actionQueue.push({ x: cx, y: cy, draw: true, type: 'move' });
                        
                        actionQueue.push({ type: 'state', key: 'penState', val: savedPenState });
                    }
                    break;
                    
                case 'LB': // Label
                    // Special parser override for label content:
                    // Text string terminated by the labelTerminator character code (default ETX / code 3)
                    const termChar = String.fromCharCode(labelTerminator);
                    const labelEndIndex = rawParamStr.indexOf(termChar);
                    
                    let labelText = "";
                    if (labelEndIndex !== -1) {
                        labelText = rawParamStr.substring(0, labelEndIndex);
                    } else {
                        labelText = rawParamStr; // fallback if terminator is missing
                    }
                    
                    const angle = Math.atan2(labelDirection.rise, labelDirection.run);
                    
                    const charWidthPlu = labelCharSize.width * 400 * (autoScaleActive ? fitScale : 1);
                    const charHeightPlu = labelCharSize.height * 400 * (autoScaleActive ? fitScale : 1);
                    
                    const stepWidthPlu = charWidthPlu * (1 + labelExtraSpaceWidth);
                    const totalWidthPlu = labelText.length * stepWidthPlu;
                    const totalHeightPlu = charHeightPlu;
                    
                    let shiftHorizontal = 0;
                    let shiftVertical = 0;
                    
                    switch (labelOrigin) {
                        case 1: case 4: case 7:
                        case 11: case 14: case 17:
                            shiftHorizontal = 0;
                            break;
                        case 2: case 5: case 8:
                        case 12: case 15: case 18:
                            shiftHorizontal = -totalWidthPlu / 2;
                            break;
                        case 3: case 6: case 9:
                        case 13: case 16: case 19:
                            shiftHorizontal = -totalWidthPlu;
                            break;
                        default:
                            shiftHorizontal = 0;
                    }
                    
                    switch (labelOrigin) {
                        case 1: case 2: case 3:
                        case 17: case 18: case 19:
                            shiftVertical = 0;
                            break;
                        case 4: case 5: case 6:
                        case 14: case 15: case 16:
                            shiftVertical = -totalHeightPlu / 2;
                            break;
                        case 7: case 8: case 9:
                        case 11: case 12: case 13:
                            shiftVertical = -totalHeightPlu;
                            break;
                        default:
                            shiftVertical = 0;
                    }
                    
                    const dxPlu = shiftHorizontal * Math.cos(angle) - shiftVertical * Math.sin(angle);
                    const dyPlu = shiftHorizontal * Math.sin(angle) + shiftVertical * Math.cos(angle);
                    
                    let tempX = targetX + dxPlu;
                    let tempY = targetY + dyPlu;
                    
                    for (let i = 0; i < labelText.length; i++) {
                        const char = labelText[i];
                        if (char === '\n') {
                            tempX -= charHeightPlu * (1 + labelExtraSpaceHeight) * Math.sin(angle);
                            tempY += charHeightPlu * (1 + labelExtraSpaceHeight) * Math.cos(angle);
                            continue;
                        }
                        const charX = tempX;
                        const charY = tempY;
                        
                        const nextX = tempX + stepWidthPlu * Math.cos(angle);
                        const nextY = tempY + stepWidthPlu * Math.sin(angle);
                        
                        actionQueue.push({ type: 'state', key: 'char', val: { char: char, x: charX, y: charY, slant: activeSlant, charSet: activeCharSet, fontKind: activeCharSet === 'alternate' ? alternateFontKind : standardFontKind } });
                        actionQueue.push({ type: 'move', x: nextX, y: nextY, draw: false });
                        
                        tempX = nextX;
                        tempY = nextY;
                    }
                    
                    targetX = tempX;
                    targetY = tempY;
                    break;
                    
                case 'DT': // Define label Terminator
                    if (rawParamStr.length > 0) {
                        labelTerminator = rawParamStr.charCodeAt(0);
                    } else {
                        labelTerminator = 3; // default ETX
                    }
                    break;
                    
                case 'SI': // Character Size Absolute (cm)
                    if (params.length >= 2) {
                        labelCharSize.width = params[0];
                        labelCharSize.height = params[1];
                    } else {
                        labelCharSize = { width: 0.285, height: 0.375 };
                    }
                    break;
                    
                case 'SR': // Character Size Relative (ratio to P1/P2)
                    if (params.length >= 2) {
                        const widthRatio = params[0] * 0.01;
                        const heightRatio = params[1] * 0.01;
                        labelCharSize.width = widthRatio * (p2X - p1X) / 400; // translate plu to cm
                        labelCharSize.height = heightRatio * (p2Y - p1Y) / 400;
                    }
                    break;
                    
                case 'DI': // Character Direction Absolute
                    if (params.length >= 2) {
                        labelDirection.run = params[0];
                        labelDirection.rise = params[1];
                    } else {
                        labelDirection = { run: 1, rise: 0 };
                    }
                    break;
                    
                case 'DR': // Character Direction Relative
                    if (params.length >= 2) {
                        labelDirection.run = params[0] * (p2X - p1X);
                        labelDirection.rise = params[1] * (p2Y - p1Y);
                    }
                    break;
                    
                case 'LT': // Line Type
                    const patternVal = params[0];
                    if (patternVal !== undefined && patternVal >= 0 && patternVal <= 8) {
                        activeLineType = `type-${Math.floor(patternVal)}`;
                    } else if (patternVal === 99) {
                        activeLineType = 'solid';
                    } else {
                        activeLineType = 'solid';
                    }
                    actionQueue.push({ type: 'state', key: 'lineType', val: activeLineType });
                    break;
                    
                case 'EA': // Edge Rectangle Absolute (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
    console.warn(`HP-GL/2 command EA not supported in HP-GL mode`);
    break;
                    }
                    if (params.length >= 2) {
                        const pt = scaleCoordinate(params[0], params[1]);
                        const x1 = targetX;
                        const y1 = targetY;
                        const x2 = pt.x;
                        const y2 = pt.y;
                        
                        polygonBuffer = [
                            { x: x1, y: y1 },
                            { x: x2, y: y1 },
                            { x: x2, y: y2 },
                            { x: x1, y: y2 },
                            { x: x1, y: y1 }
                        ];
                        
                        const savedPenState = penState;
                        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                        actionQueue.push({ type: 'move', x: x1, y: y1, draw: false });
                        actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                        actionQueue.push({ type: 'move', x: x2, y: y1, draw: true });
                        actionQueue.push({ type: 'move', x: x2, y: y2, draw: true });
                        actionQueue.push({ type: 'move', x: x1, y: y2, draw: true });
                        actionQueue.push({ type: 'move', x: x1, y: y1, draw: true });
                        actionQueue.push({ type: 'state', key: 'penState', val: savedPenState });
                        targetX = x2;
                        targetY = y2;
                    }
                    break;

                case 'ER': // Edge Rectangle Relative (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
    console.warn(`HP-GL/2 command ER not supported in HP-GL mode`);
    break;
                    }
                    if (params.length >= 2) {
                        let dx = params[0];
                        let dy = params[1];
                        if (userScaleActive) {
                            dx = dx * (Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1));
                            dy = dy * (Math.abs(p2Y - p1Y) / (Math.abs(userY2 - userY1) || 1));
                        }
                        if (autoScaleActive) {
                            dx = dx * fitScale;
                            dy = dy * fitScale;
                        }
                        const x1 = targetX;
                        const y1 = targetY;
                        const x2 = x1 + dx;
                        const y2 = y1 + dy;
                        
                        polygonBuffer = [
                            { x: x1, y: y1 },
                            { x: x2, y: y1 },
                            { x: x2, y: y2 },
                            { x: x1, y: y2 },
                            { x: x1, y: y1 }
                        ];
                        
                        const savedPenState = penState;
                        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                        actionQueue.push({ type: 'move', x: x1, y: y1, draw: false });
                        actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                        actionQueue.push({ type: 'move', x: x2, y: y1, draw: true });
                        actionQueue.push({ type: 'move', x: x2, y: y2, draw: true });
                        actionQueue.push({ type: 'move', x: x1, y: y2, draw: true });
                        actionQueue.push({ type: 'move', x: x1, y: y1, draw: true });
                        actionQueue.push({ type: 'state', key: 'penState', val: savedPenState });
                        targetX = x2;
                        targetY = y2;
                    }
                    break;

                case 'RA': // Fill Rectangle Absolute (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
                        console.warn('HP-GL/2 command RA not supported in HP-GL mode');
                        break;
                    }
                    if (params.length >= 2) {
                        const pt = scaleCoordinate(params[0], params[1]);
                        const x1 = targetX;
                        const y1 = targetY;
                        const x2 = pt.x;
                        const y2 = pt.y;
                        
                        polygonBuffer = [
                            { x: x1, y: y1 },
                            { x: x2, y: y1 },
                            { x: x2, y: y2 },
                            { x: x1, y: y2 },
                            { x: x1, y: y1 }
                        ];
                        
                        queuePolygonFillOrHatch([
                            { x: x1, y: y1 },
                            { x: x2, y: y1 },
                            { x: x2, y: y2 },
                            { x: x1, y: y2 }
                        ]);
                        actionQueue.push({ type: 'move', x: x1, y: y1, draw: false });
                        targetX = x2;
                        targetY = y2;
                    }
                    break;

                case 'RR': // Fill Rectangle Relative (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
                        console.warn('HP-GL/2 command RR not supported in HP-GL mode');
                        break;
                    }
                    if (params.length >= 2) {
                        let dx = params[0];
                        let dy = params[1];
                        if (userScaleActive) {
                            dx = dx * (Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1));
                            dy = dy * (Math.abs(p2Y - p1Y) / (Math.abs(userY2 - userY1) || 1));
                        }
                        if (autoScaleActive) {
                            dx = dx * fitScale;
                            dy = dy * fitScale;
                        }
                        const x1 = targetX;
                        const y1 = targetY;
                        const x2 = x1 + dx;
                        const y2 = y1 + dy;
                        
                        polygonBuffer = [
                            { x: x1, y: y1 },
                            { x: x2, y: y1 },
                            { x: x2, y: y2 },
                            { x: x1, y: y2 },
                            { x: x1, y: y1 }
                        ];
                        
                        queuePolygonFillOrHatch([
                            { x: x1, y: y1 },
                            { x: x2, y: y1 },
                            { x: x2, y: y2 },
                            { x: x1, y: y2 }
                        ]);
                        actionQueue.push({ type: 'move', x: x1, y: y1, draw: false });
                        targetX = x2;
                        targetY = y2;
                    }
                    break;

                case 'PW': // Pen Width (HP-GL/2)
                    if (params.length > 0) {
                        let width = params[0];
                        if (widthUnit === 1) {
                            width = width * 0.025; // 1 plu = 0.025 mm
                        }
                        const targetPen = params[1] !== undefined ? Math.floor(params[1]) : selectedPen;
                        if (targetPen >= 1 && targetPen <= 8) {
                            penWidths[targetPen] = width;
                            const inputEl = document.getElementById(`width-pen-${targetPen}`);
                            if (inputEl) inputEl.value = width;
                        }
                    }
                    break;

                case 'PC': // Pen Color Definition (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
    console.warn(`HP-GL/2 command PC not supported in HP-GL mode`);
    break;
                    }
                    if (params.length >= 4) {
                        const targetPen = Math.floor(params[0]);
                        const r = Math.max(0, Math.min(255, Math.floor(params[1])));
                        const g = Math.max(0, Math.min(255, Math.floor(params[2])));
                        const b = Math.max(0, Math.min(255, Math.floor(params[3])));
                        if (targetPen >= 1 && targetPen <= 8) {
                            const hexColor = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                            penColors[targetPen] = hexColor;
                            document.documentElement.style.setProperty(`--pen-${targetPen}-color`, hexColor);
                            const penBody = document.getElementById(`pen-body-${targetPen}`);
                            if (penBody) penBody.style.backgroundColor = hexColor;
                            const previewColor = document.getElementById(`preview-color-${targetPen}`);
                            if (previewColor) previewColor.style.backgroundColor = hexColor;
                            const colorPicker = document.getElementById(`picker-color-${targetPen}`);
                            if (colorPicker) colorPicker.value = hexColor;
                            
                            if (selectedPen === targetPen && carriagePenTip) {
                                carriagePenTip.style.backgroundColor = hexColor;
                            }
                        }
                    }
                    break;

                case 'PM': // Polygon Mode (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
    console.warn(`HP-GL/2 command PM not supported in HP-GL mode`);
    break;
                    }
                    const pmVal = params[0] !== undefined ? params[0] : 0;
                    if (pmVal === 0) {
                        polygonBuffer = [];
                        polygonMode = true;
                    } else if (pmVal === 2) {
                        polygonMode = false;
                    }
                    break;

                case 'EP': // Edge Polygon (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
                        break;
                    }
                    if (polygonBuffer.length > 1) {
                        const savedPenState = penState;
                        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                        actionQueue.push({ type: 'move', x: polygonBuffer[0].x, y: polygonBuffer[0].y, draw: false });
                        actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                        for (let i = 1; i < polygonBuffer.length; i++) {
                            actionQueue.push({ type: 'move', x: polygonBuffer[i].x, y: polygonBuffer[i].y, draw: true });
                        }
                        const lastPt = polygonBuffer[polygonBuffer.length - 1];
                        if (lastPt.x !== polygonBuffer[0].x || lastPt.y !== polygonBuffer[0].y) {
                            actionQueue.push({ type: 'move', x: polygonBuffer[0].x, y: polygonBuffer[0].y, draw: true });
                        }
                        actionQueue.push({ type: 'state', key: 'penState', val: savedPenState });
                        targetX = polygonBuffer[0].x;
                        targetY = polygonBuffer[0].y;
                    }
                    break;

                case 'FP': // Fill Polygon (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
                        break;
                    }
                    if (polygonBuffer.length > 2) {
                        queuePolygonFillOrHatch(polygonBuffer);
                        const lastPt = polygonBuffer[polygonBuffer.length - 1];
                        actionQueue.push({ type: 'move', x: lastPt.x, y: lastPt.y, draw: false });
                        targetX = lastPt.x;
                        targetY = lastPt.y;
                    }
                    break;

                case 'CO': // Comment (HP-GL/2)
                    if (hpglLevel !== 'hpgl2') {
                        ledError.classList.add('active');
                        break;
                    }
                    break;

                case 'VS': // Velocity Select
                    if (params.length > 0) {
                        const customSpeed = Math.floor(params[0]);
                        velocityMultiplier = Math.max(5, Math.min(100, customSpeed));
                        sliderSpeed.value = velocityMultiplier;
                        speedDisplay.textContent = `${velocityMultiplier} cm/s`;
                    }
                    break;

                case 'RO': // Rotate Coordinate System
                    // RO [angle]; Rotates the coordinate frame by 0, 90, 180, or 270 degrees
                    // around P1. Applied to all subsequent absolute coordinates via scaleCoordinate()
                    // and to relative (PR) delta vectors directly.
                    {
                        const roAngle = params[0] !== undefined ? Math.floor(params[0]) : 0;
                        if (roAngle === 0 || roAngle === 90 || roAngle === 180 || roAngle === 270) {
                            coordinateRotation = roAngle;
                        } else {
                            // Invalid angle — reset and signal error per HP-GL spec
                            coordinateRotation = 0;
                            ledError.classList.add('active');
                        }
                    }
                    break;
                    
                case 'FT': // Fill Type
                    activeFillType = params[0] !== undefined ? Math.floor(params[0]) : 1;
                    activeFillSpacing = params[1] !== undefined ? params[1] : 0;
                    activeFillAngle = params[2] !== undefined ? params[2] : 0;
                    break;
                    
                case 'LO': // Label Origin
                    labelOrigin = params[0] !== undefined ? Math.floor(params[0]) : 21;
                    break;
                    
                case 'ES': // Extra Space
                    labelExtraSpaceWidth = params[0] !== undefined ? params[0] : 0.0;
                    labelExtraSpaceHeight = params[1] !== undefined ? params[1] : 0.0;
                    break;
                    
                case 'WU': // Width Unit
                    widthUnit = params[0] !== undefined ? Math.floor(params[0]) : 0;
                    break;
                    
                case 'CT': // Chord Tolerance
                    if (params.length > 0) {
                        chordToleranceMode = Math.floor(params[0]) === 1 ? 1 : 0;
                        if (params.length > 1 && params[1] > 0) {
                            chordToleranceValue = params[1];
                        } else {
                            chordToleranceValue = 5;
                        }
                    } else {
                        chordToleranceMode = 0;
                        chordToleranceValue = 5;
                    }
                    break;
                    
                case 'SM': // Symbol Mode
                    if (rawParamStr && rawParamStr.trim().length > 0) {
                        symbolModeChar = rawParamStr.trim().substring(0, 1);
                    } else {
                        symbolModeChar = '';
                    }
                    break;
                    
                case 'XT': // X-tick
                    {
                        const savedPen = penStateLogical;
                        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                        actionQueue.push({ type: 'move', x: targetX, y: targetY - activeTickLengthY / 2, draw: false });
                        actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                        actionQueue.push({ type: 'move', x: targetX, y: targetY + activeTickLengthY / 2, draw: true });
                        actionQueue.push({ type: 'state', key: 'penState', val: savedPen });
                        actionQueue.push({ type: 'move', x: targetX, y: targetY, draw: false });
                    }
                    break;
                    
                case 'YT': // Y-tick
                    {
                        const savedPen = penStateLogical;
                        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
                        actionQueue.push({ type: 'move', x: targetX - activeTickLengthX / 2, y: targetY, draw: false });
                        actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
                        actionQueue.push({ type: 'move', x: targetX + activeTickLengthX / 2, y: targetY, draw: true });
                        actionQueue.push({ type: 'state', key: 'penState', val: savedPen });
                        actionQueue.push({ type: 'move', x: targetX, y: targetY, draw: false });
                    }
                    break;
                    
                case 'TL': // Tick Length
                    if (params.length > 0) {
                        activeTickLengthX = params[0];
                        activeTickLengthY = params[1] !== undefined ? params[1] : params[0];
                    } else {
                        activeTickLengthX = 100;
                        activeTickLengthY = 100;
                    }
                    break;
                    
                case 'UL': // User-defined Line Type
                    if (params.length > 1) {
                        const index = Math.floor(params[0]);
                        const gaps = params.slice(1);
                        userDashPatterns[index] = gaps;
                    } else if (params.length === 1) {
                        const index = Math.floor(params[0]);
                        delete userDashPatterns[index];
                    }
                    break;
                    
                case 'SD': // Standard Font Designator
                case 'SL': // Character Slant
                    activeSlant = params[0] !== undefined ? params[0] : 0;
                    break;
                    
                case 'SD': { // Standard Font Designator - paired attribute list (kind 7 = typeface)
                    for (let pi = 0; pi < params.length - 1; pi += 2) {
                        if (params[pi] === 7) standardFontKind = params[pi + 1];
                    }
                    break;
                }
                case 'AD': { // Alternate Font Designator
                    for (let pi = 0; pi < params.length - 1; pi += 2) {
                        if (params[pi] === 7) alternateFontKind = params[pi + 1];
                    }
                    break;
                }
                case 'SS': // Select Standard Character Set
                    activeCharSet = 'standard';
                    break;
                    
                case 'SA': // Select Alternate Character Set
                    activeCharSet = 'alternate';
                    break;
                    
                case 'TD': // Transparent Data
                case 'AS': // Acceleration Select
                case 'FS': // Force Select
                case 'NP': // Number of Pens
                case 'TR': // Transparency mode
                case 'MC': // Merge Control
                    // Safely stubbed to prevent lighting the console Error LED
                    console.log(`HP-GL/2 Command stubbed: ${mnemonic} with params: ${params.join(`,`)}`);
                    break;
                    
                default:
                    // Unknown command - light console Error LED
                    ledError.classList.add('active');
                    console.warn(`HPGL Command Emulation Unsupported: ${mnemonic}`);
                    break;
            }
        } catch (e) {
            console.error('Parser command execution failed:', e);
            ledError.classList.add('active');
        }
    }

    function getChordAngle(radius) {
        if (chordToleranceMode === 0) {
            return Math.max(0.5, Math.min(180, chordToleranceValue || 5));
        } else {
            const tolerance = chordToleranceValue || 5;
            const r = Math.abs(radius) || 1;
            if (tolerance >= r) {
                return 180;
            }
            const thetaRad = 2 * Math.acos(1 - tolerance / r);
            const thetaDeg = thetaRad * 180 / Math.PI;
            return Math.max(0.5, Math.min(180, thetaDeg));
        }
    }

    // Helper: Scales user coordinates (via SC) into raw plotter units,
    // then applies any active RO rotation around P1.
    function scaleCoordinate(ux, uy) {
        let px, py;

        if (!userScaleActive) {
            // No SC active — pass through (or apply auto-fit)
            if (autoScaleActive) {
                px = fitOffsetX + (ux - scannedMinX) * fitScale;
                py = fitOffsetY + (uy - scannedMinY) * fitScale;
            } else {
                px = ux;
                py = uy;
            }
        } else {
            // SC active — map user bounds [userX1..userX2] → PLU space via P1/P2
            const xPct = (ux - userX1) / ((userX2 - userX1) || 1);
            const yPct = (uy - userY1) / ((userY2 - userY1) || 1);
            px = p1X + xPct * (p2X - p1X);
            py = p1Y + yPct * (p2Y - p1Y);

            if (autoScaleActive) {
                px = fitOffsetX + (px - scannedMinX) * fitScale;
                py = fitOffsetY + (py - scannedMinY) * fitScale;
            }
        }

        // Apply RO rotation around P1 (after SC, in PLU space)
        if (coordinateRotation !== 0) {
            const ox = px - p1X; // translate so P1 is the origin
            const oy = py - p1Y;
            let rx, ry;
            switch (coordinateRotation) {
                case 90:  rx = -oy; ry =  ox; break;
                case 180: rx = -ox; ry = -oy; break;
                case 270: rx =  oy; ry = -ox; break;
                default:  rx =  ox; ry =  oy; break;
            }
            px = p1X + rx;
            py = p1Y + ry;
        }

        return { x: px, y: py };
    }

    // Math Helper: Draws a circle using small vector steps (standard plotter mechanism)
    function drawCircleArc(r, chordAngle) {
        const cx = targetX;
        const cy = targetY;
        
        // Starting point X is centre + radius, Y is centre
        const startX = cx + r;
        const startY = cy;
        
        // Move to start point
        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
        actionQueue.push({ type: 'move', x: startX, y: startY, draw: false });
        actionQueue.push({ type: 'state', key: 'penState', val: 'down' });
        
        // Generate segments (360 degrees sweep)
        const actualChordAngle = chordAngle !== undefined ? chordAngle : getChordAngle(r);
        const radChord = (actualChordAngle * Math.PI) / 180;
        const totalSteps = Math.ceil(2 * Math.PI / radChord);
        
        for (let i = 1; i <= totalSteps; i++) {
            const angle = i * radChord;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            actionQueue.push({ type: 'move', x: x, y: y, draw: true });
        }
        
        // Return to centre
        actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
        actionQueue.push({ type: 'move', x: cx, y: cy, draw: false });
        actionQueue.push({ type: 'state', key: 'penState', val: penState }); // restore original
    }

    // Math Helper: Draws a circular arc
    function drawArc(xParam, yParam, sweepAngle, chordAngle, isRelative) {
        let centerX = xParam;
        let centerY = yParam;
        
        if (isRelative) {
            let dx = xParam;
            let dy = yParam;
            if (userScaleActive) {
                dx = dx * (Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1));
                dy = dy * (Math.abs(p2Y - p1Y) / (Math.abs(userY2 - userY1) || 1));
            }
            if (autoScaleActive) {
                dx = dx * fitScale;
                dy = dy * fitScale;
            }
            centerX = targetX + dx;
            centerY = targetY + dy;
        } else {
            // Apply scale if absolute
            if (userScaleActive) {
                const pt = scaleCoordinate(xParam, yParam);
                centerX = pt.x;
                centerY = pt.y;
            }
        }
        
        const startX = targetX;
        const startY = targetY;
        
        // Calculate radius and initial start angle
        const dx = startX - centerX;
        const dy = startY - centerY;
        const r = Math.sqrt(dx * dx + dy * dy);
        const startAngle = Math.atan2(dy, dx);
        
        const sweepRad = (sweepAngle * Math.PI) / 180;
        const actualChordAngle = chordAngle !== undefined ? chordAngle : getChordAngle(r);
        const chordRad = (actualChordAngle * Math.PI) / 180;
        const steps = Math.ceil(Math.abs(sweepRad) / chordRad);
        
        // Loop drawing arc segments
        actionQueue.push({ type: 'state', key: 'penState', val: penState });
        for (let i = 1; i <= steps; i++) {
            let angleOffset = i * chordRad;
            if (sweepAngle < 0) angleOffset = -angleOffset; // clockwise
            
            // Cap at exact sweepRad for the last step
            if (Math.abs(angleOffset) > Math.abs(sweepRad)) angleOffset = sweepRad;
            
            const currentAngle = startAngle + angleOffset;
            const x = centerX + r * Math.cos(currentAngle);
            const y = centerY + r * Math.sin(currentAngle);
            
            targetX = x;
            targetY = y;
            actionQueue.push({ type: 'move', x: x, y: y, draw: (penState === 'down') });
        }
    }

    // Math Helper: Draws a 3-point circular arc passing through starting point, intermediate point, and end point.
    function drawArcThreePoint(xInter, yInter, xEnd, yEnd, chordAngle, isRelative) {
        const startX = targetX;
        const startY = targetY;
        
        let interX = xInter;
        let interY = yInter;
        let endX = xEnd;
        let endY = yEnd;
        
        if (isRelative) {
            let dxInter = xInter;
            let dyInter = yInter;
            let dxEnd = xEnd;
            let dyEnd = yEnd;
            if (userScaleActive) {
                const fX = Math.abs(p2X - p1X) / (Math.abs(userX2 - userX1) || 1);
                const fY = Math.abs(p2Y - p1Y) / (Math.abs(userY2 - userY1) || 1);
                dxInter *= fX;
                dyInter *= fY;
                dxEnd *= fX;
                dyEnd *= fY;
            }
            if (autoScaleActive) {
                dxInter *= fitScale;
                dyInter *= fitScale;
                dxEnd *= fitScale;
                dyEnd *= fitScale;
            }
            interX = startX + dxInter;
            interY = startY + dyInter;
            endX = startX + dxEnd;
            endY = startY + dyEnd;
        } else {
            const ptInter = scaleCoordinate(xInter, yInter);
            interX = ptInter.x;
            interY = ptInter.y;
            const ptEnd = scaleCoordinate(xEnd, yEnd);
            endX = ptEnd.x;
            endY = ptEnd.y;
        }
        
        // Find the circumcenter of (startX, startY), (interX, interY), (endX, endY)
        // Midpoints of AB and BC
        const midAB_X = (startX + interX) / 2;
        const midAB_Y = (startY + interY) / 2;
        const midBC_X = (interX + endX) / 2;
        const midBC_Y = (interY + endY) / 2;
        
        // Circumcenter calculation using standard formula
        const d = 2 * (startX * (interY - endY) + interX * (endY - startY) + endX * (startY - interY));
        
        // Collinear check with det
        if (Math.abs(d) < 0.001) {
            // Collinear: Draw straight line instead
            actionQueue.push({ type: 'state', key: 'penState', val: penState });
            actionQueue.push({ type: 'move', x: interX, y: interY, draw: (penState === 'down') });
            actionQueue.push({ type: 'move', x: endX, y: endY, draw: (penState === 'down') });
            targetX = endX;
            targetY = endY;
            return;
        }

        const startSq = startX * startX + startY * startY;
        const interSq = interX * interX + interY * interY;
        const endSq = endX * endX + endY * endY;

        const cx = (startSq * (interY - endY) + interSq * (endY - startY) + endSq * (startY - interY)) / d;
        const cy = (startSq * (endX - interX) + interSq * (startX - endX) + endSq * (interX - startX)) / d;
        
        const r = Math.sqrt((startX - cx) * (startX - cx) + (startY - cy) * (startY - cy));
        
        // Angles of three points from center
        let startAngle = Math.atan2(startY - cy, startX - cx);
        let interAngle = Math.atan2(interY - cy, interX - cx);
        let endAngle = Math.atan2(endY - cy, endX - cx);
        
        // Ensure angle sweeps are ordered directionally
        // Normalize angles to 0..2PI relative to startAngle
        let diffInter = interAngle - startAngle;
        while (diffInter < 0) diffInter += 2 * Math.PI;
        while (diffInter >= 2 * Math.PI) diffInter -= 2 * Math.PI;
        
        let diffEnd = endAngle - startAngle;
        while (diffEnd < 0) diffEnd += 2 * Math.PI;
        while (diffEnd >= 2 * Math.PI) diffEnd -= 2 * Math.PI;
        
        // Direction of sweep (counterclockwise if intermediate point is reached first in positive direction)
        const isCounterClockwise = diffInter < diffEnd;
        let totalSweep = isCounterClockwise ? diffEnd : (diffEnd - 2 * Math.PI);
        
        const actualChordAngle = chordAngle !== undefined ? chordAngle : getChordAngle(r);
        const chordRad = (actualChordAngle * Math.PI) / 180;
        const steps = Math.ceil(Math.abs(totalSweep) / chordRad);
        
        actionQueue.push({ type: 'state', key: 'penState', val: penStateLogical });
        const drawActive = (penStateLogical === 'down');
        console.log(`drawArcThreePoint: start=(${startX},${startY}), inter=(${interX},${interY}), end=(${endX},${endY}), cx=${cx}, cy=${cy}, r=${r}, steps=${steps}, drawActive=${drawActive}`);
        for (let i = 1; i <= steps; i++) {
            let angleOffset = i * chordRad;
            if (!isCounterClockwise) angleOffset = -angleOffset;
            
            if (Math.abs(angleOffset) > Math.abs(totalSweep)) {
                angleOffset = totalSweep;
            }
            
            const currentAngle = startAngle + angleOffset;
            const x = cx + r * Math.cos(currentAngle);
            const y = cy + r * Math.sin(currentAngle);
            
            targetX = x;
            targetY = y;
            actionQueue.push({ type: 'move', x: x, y: y, draw: drawActive });
        }
    }

    // 10. Bounding Box Scanners (for Auto-Fit to Paper Bed)
    function preScanHPGLBounds(hpglText) {
        const cleanText = hpglText.replace(/\r?\n|\r/g, '').trim();
        const commands = cleanText.split(';');
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let pointsScanned = 0;
        
        let activeScale = false;
        let p1x = PAPER_MIN_X, p1y = PAPER_MIN_Y, p2x = PAPER_MAX_X, p2y = PAPER_MAX_Y;
        let usX1 = 0, usX2 = 1, usY1 = 0, usY2 = 1;
        
        let localX = 0, localY = 0;
        
        for (let cmd of commands) {
            cmd = cmd.trim();
            if (cmd.length < 2) continue;
            
            const mnemonic = cmd.substring(0, 2).toUpperCase();
            const paramStr = cmd.substring(2);
            
            const params = [];
            const regex = /[-+]?[0-9]*\.?[0-9]+/g;
            let match;
            while ((match = regex.exec(paramStr)) !== null) {
                params.push(parseFloat(match[0]));
            }
            
            if (mnemonic === 'SC') {
                if (params.length >= 4) {
                    activeScale = true;
                    usX1 = params[0]; usX2 = params[1];
                    usY1 = params[2]; usY2 = params[3];
                } else {
                    activeScale = false;
                }
            } else if (mnemonic === 'IP') {
                if (params.length >= 4) {
                    p1x = params[0]; p1y = params[1];
                    p2x = params[2]; p2y = params[3];
                }
            } else if (mnemonic === 'PA' || mnemonic === 'PU' || mnemonic === 'PD') {
                for (let i = 0; i < params.length; i += 2) {
                    if (params[i+1] !== undefined) {
                        let px = params[i];
                        let py = params[i+1];
                        
                        if (activeScale) {
                            const xPct = (px - usX1) / ((usX2 - usX1) || 1);
                            const yPct = (py - usY1) / ((usY2 - usY1) || 1);
                            px = p1x + xPct * (p2x - p1x);
                            py = p1y + yPct * (p2y - p1y);
                        }
                        
                        localX = px;
                        localY = py;
                        
                        minX = Math.min(minX, px);
                        maxX = Math.max(maxX, px);
                        minY = Math.min(minY, py);
                        maxY = Math.max(maxY, py);
                        pointsScanned++;
                    }
                }
            } else if (mnemonic === 'PR') {
                for (let i = 0; i < params.length; i += 2) {
                    if (params[i+1] !== undefined) {
                        let dx = params[i];
                        let dy = params[i+1];
                        if (activeScale) {
                            dx = dx * (Math.abs(p2x - p1x) / (Math.abs(usX2 - usX1) || 1));
                            dy = dy * (Math.abs(p2y - p1y) / (Math.abs(usY2 - usY1) || 1));
                        }
                        localX += dx;
                        localY += dy;
                        
                        minX = Math.min(minX, localX);
                        maxX = Math.max(maxX, localX);
                        minY = Math.min(minY, localY);
                        maxY = Math.max(maxY, localY);
                        pointsScanned++;
                    }
                }
            } else if (mnemonic === 'EA' || mnemonic === 'RA') {
                if (params.length >= 2) {
                    let px = params[0];
                    let py = params[1];
                    if (activeScale) {
                        const xPct = (px - usX1) / ((usX2 - usX1) || 1);
                        const yPct = (py - usY1) / ((usY2 - usY1) || 1);
                        px = p1x + xPct * (p2x - p1x);
                        py = p1y + yPct * (p2y - p1y);
                    }
                    
                    minX = Math.min(minX, px, localX);
                    maxX = Math.max(maxX, px, localX);
                    minY = Math.min(minY, py, localY);
                    maxY = Math.max(maxY, py, localY);
                    pointsScanned += 2;
                    
                    localX = px;
                    localY = py;
                }
            } else if (mnemonic === 'ER' || mnemonic === 'RR') {
                if (params.length >= 2) {
                    let dx = params[0];
                    let dy = params[1];
                    if (activeScale) {
                        dx = dx * (Math.abs(p2x - p1x) / (Math.abs(usX2 - usX1) || 1));
                        dy = dy * (Math.abs(p2y - p1y) / (Math.abs(usY2 - usY1) || 1));
                    }
                    const rx = localX + dx;
                    const ry = localY + dy;
                    
                    minX = Math.min(minX, rx, localX);
                    maxX = Math.max(maxX, rx, localX);
                    minY = Math.min(minY, ry, localY);
                    maxY = Math.max(maxY, ry, localY);
                    pointsScanned += 2;
                }
            } else if (mnemonic === 'AT') {
                if (params.length >= 4) {
                    let px1 = params[0];
                    let py1 = params[1];
                    let px2 = params[2];
                    let py2 = params[3];
                    if (activeScale) {
                        const xPct1 = (px1 - usX1) / ((usX2 - usX1) || 1);
                        const yPct1 = (py1 - usY1) / ((usY2 - usY1) || 1);
                        px1 = p1x + xPct1 * (p2x - p1x);
                        py1 = p1y + yPct1 * (p2y - p1y);
                        
                        const xPct2 = (px2 - usX1) / ((usX2 - usX1) || 1);
                        const yPct2 = (py2 - usY1) / ((usY2 - usY1) || 1);
                        px2 = p1x + xPct2 * (p2x - p1x);
                        py2 = p1y + yPct2 * (p2y - p1y);
                    }
                    minX = Math.min(minX, px1, px2, localX);
                    maxX = Math.max(maxX, px1, px2, localX);
                    minY = Math.min(minY, py1, py2, localY);
                    maxY = Math.max(maxY, py1, py2, localY);
                    pointsScanned += 3;
                    localX = px2;
                    localY = py2;
                }
            } else if (mnemonic === 'RT') {
                if (params.length >= 4) {
                    let dx1 = params[0];
                    let dy1 = params[1];
                    let dx2 = params[2];
                    let dy2 = params[3];
                    if (activeScale) {
                        const fX = Math.abs(p2x - p1x) / (Math.abs(usX2 - usX1) || 1);
                        const fY = Math.abs(p2y - p1y) / (Math.abs(usY2 - usY1) || 1);
                        dx1 *= fX;
                        dy1 *= fY;
                        dx2 *= fX;
                        dy2 *= fY;
                    }
                    const rx1 = localX + dx1;
                    const ry1 = localY + dy1;
                    const rx2 = localX + dx2;
                    const ry2 = localY + dy2;
                    minX = Math.min(minX, rx1, rx2, localX);
                    maxX = Math.max(maxX, rx1, rx2, localX);
                    minY = Math.min(minY, ry1, ry2, localY);
                    maxY = Math.max(maxY, ry1, ry2, localY);
                    pointsScanned += 3;
                    localX = rx2;
                    localY = ry2;
                }
            }
        }
        
        if (pointsScanned > 0) {
            scannedMinX = minX; scannedMaxX = maxX;
            scannedMinY = minY; scannedMaxY = maxY;
            
            const w = maxX - minX || 1;
            const h = maxY - minY || 1;
            
            // Calculate scale to fit printable A3 dimensions (15000 x 10400)
            fitScale = Math.min(PAPER_WIDTH / w, PAPER_HEIGHT / h);
            
            // Center drawing
            fitOffsetX = PAPER_MIN_X + (PAPER_WIDTH - w * fitScale) / 2;
            fitOffsetY = PAPER_MIN_Y + (PAPER_HEIGHT - h * fitScale) / 2;
        } else {
            // Default mappings
            scannedMinX = 0; scannedMaxX = MAX_X;
            scannedMinY = 0; scannedMaxY = MAX_Y;
            fitScale = 1;
            fitOffsetX = PAPER_MIN_X;
            fitOffsetY = PAPER_MIN_Y;
        }
    }

    // 11. Manual Joystick Jogging Logic
    function startJog(dir) {
        if (!isPowerOn) return;
        initAudio();
        
        // Stop any running animations
        actionQueue = [];
        
        const step = isJogFast ? 300 : jogStepSize;
        const intervalMs = 40;
        
        if (jogInterval) clearInterval(jogInterval);
        
        jogInterval = setInterval(() => {
            let nextX = currentX;
            let nextY = currentY;
            
            if (dir === 'up') nextY += step;
            if (dir === 'down') nextY -= step;
            if (dir === 'left') nextX -= step;
            if (dir === 'right') nextX += step;
            
            // Check hard bounds limits
            nextX = Math.max(0, Math.min(MAX_X, nextX));
            nextY = Math.max(0, Math.min(MAX_Y, nextY));
            
            if (nextX !== currentX || nextY !== currentY) {
                if (penState === 'down' && selectedPen > 0) {
                    drawLineSegment(currentX, currentY, nextX, nextY);
                }
                currentX = nextX;
                currentY = nextY;
                targetX = currentX;
                targetY = currentY;
                
                updateCarriageDOM(currentX, currentY);
                updateMotorSound(isJogFast ? 0.6 : 0.25);
            }
        }, intervalMs);
    }
    
    function stopJog() {
        if (jogInterval) {
            clearInterval(jogInterval);
            jogInterval = null;
        }
        updateMotorSound(0);
    }

    // 12. Web Serial API Integration
    if (!('serial' in navigator)) {
        btnSerialConnect.disabled = true;
        serialUnsupported.style.display = 'flex';
    } else {
        btnSerialConnect.addEventListener('click', async () => {
            if (isSerialConnected) {
                await disconnectSerial();
            } else {
                await connectSerial();
            }
        });
    }

    async function connectSerial() {
        playClick();
        try {
            port = await navigator.serial.requestPort();
            const baud = parseInt(selectBaud.value) || 9600;
            
            await port.open({
                baudRate: baud,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });
            
            isSerialConnected = true;
            serialStatus.textContent = 'Online';
            serialStatus.className = 'status-indicator online';
            btnSerialConnect.innerHTML = '<i class="fa-solid fa-plug-circle-xmark"></i> Disconnect';
            showToast('Serial Port Connected Successfully!', 'fa-plug');
            
            readLoop();
        } catch (err) {
            console.error('Serial connection error:', err);
            isSerialConnected = false;
            serialStatus.textContent = 'Offline';
            serialStatus.className = 'status-indicator offline';
            showToast('Connection Failed!', 'fa-circle-xmark');
            ledError.classList.add('active'); // Light console Error LED for COMMS port errors
        }
    }

    async function readLoop() {
        keepReading = true;
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        
        let textBuffer = '';
        
        try {
            while (keepReading) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    textBuffer += value;
                    
                    // HPGL commands end with a semicolon. Split buffers by semicolons.
                    let semiIndex;
                    while ((semiIndex = textBuffer.indexOf(';')) !== -1) {
                        const cmd = textBuffer.substring(0, semiIndex + 1);
                        textBuffer = textBuffer.substring(semiIndex + 1);
                        
                        // Parse command
                        processIncomingHPGL(cmd);
                    }
                    
                    // Hardware Flow Control Simulator (XON/XOFF Feedback)
                    if (flowControlEnabled && actionQueue.length > 100) {
                        // Send XOFF
                        sendFlowControl(19); // ASCII DC3 / XOFF
                    }
                }
            }
        } catch (err) {
            console.error('Serial read loop error:', err);
            ledError.classList.add('active'); // Light console Error LED for COMMS read errors
        } finally {
            reader.releaseLock();
            await readableStreamClosed.catch(() => {});
            await disconnectSerial();
        }
    }

    async function sendFlowControl(byteVal) {
        if (!port || !port.writable) return;
        const writer = port.writable.getWriter();
        try {
            const data = new Uint8Array([byteVal]);
            await writer.write(data);
        } catch (e) {
            console.error('Failed to send flow control code:', e);
        } finally {
            writer.releaseLock();
        }
    }

    function updateTerminalLogStatus() {
        // Resume sender when queue drops below watermark
        if (flowControlEnabled && isSerialConnected && actionQueue.length < 20) {
            sendFlowControl(17); // ASCII DC1 / XON
        }
    }

    async function disconnectSerial() {
        keepReading = false;
        isSerialConnected = false;
        
        serialStatus.textContent = 'Offline';
        serialStatus.className = 'status-indicator offline';
        btnSerialConnect.innerHTML = '<i class="fa-solid fa-plug"></i> Connect Serial';
        
        if (port) {
            try {
                await port.close();
            } catch (e) {}
            port = null;
        }
        showToast('Serial Port Disconnected.', 'fa-plug-circle-xmark');
    }

    // 13. UI Event Listeners & Interaction Handlers

    // Sidebar Slide Toggling
    function toggleSidebar() {
        playClick();
        sidebarPanel.classList.toggle('open');
        const isOpen = sidebarPanel.classList.contains('open');
        sidebarTrigger.classList.toggle('panel-open', isOpen);

        if (isOpen) {
            sidebarTriggerIcon.className = 'fa-solid fa-chevron-right';
            if (debugPanel.classList.contains('open')) {
                toggleDebugSidebar();
            }
            // Close Help panel if Controls is opening
            if (helpPanel && helpPanel.classList.contains('open')) {
                helpPanel.classList.remove('open');
                if (helpTrigger) helpTrigger.classList.remove('panel-open');
            }
        } else {
            sidebarTriggerIcon.className = 'fa-solid fa-chevron-left';
        }
    }

    sidebarTrigger.addEventListener('click', toggleSidebar);
    btnCloseSidebar.addEventListener('click', toggleSidebar);

    // Help Panel Slide Toggling
    function toggleHelp() {
        playClick();
        helpPanel.classList.toggle('open');
        const isOpen = helpPanel.classList.contains('open');
        helpTrigger.classList.toggle('panel-open', isOpen);

        if (isOpen) {
            // Close Controls panel if Help is opening
            if (sidebarPanel.classList.contains('open')) {
                toggleSidebar();
            }
        }
    }

    if (helpTrigger)  helpTrigger.addEventListener('click', toggleHelp);
    if (btnCloseHelp) btnCloseHelp.addEventListener('click', toggleHelp);

    function resetPensToStables() {
        selectedPen = 0;
        logicalSelectedPen = 0;
        penState = 'up';
        if (carriagePenTip) {
            carriagePenTip.style.backgroundColor = 'transparent';
            carriagePenTip.classList.remove('down');
        }
        for (let i = 1; i <= 8; i++) {
            const penBody = document.getElementById(`pen-body-${i}`);
            if (penBody) {
                penBody.classList.remove('empty');
            }
        }
        currentX = 0;
        currentY = 0;
        targetX = 0;
        targetY = 0;
        updateCarriageDOM(currentX, currentY);
    }

    // Power Rocker Switch toggling
    powerSwitch.addEventListener('click', () => {
        isPowerOn = !isPowerOn;
        if (isPowerOn) {
            powerSwitch.className = 'rocker-switch on';
            ledPower.classList.add('active');
            plotter.classList.remove('power-off');
            resetPensToStables();
            playChime();
            showToast('Power Turned ON', 'fa-power-off');
        } else {
            powerSwitch.className = 'rocker-switch off';
            ledPower.classList.remove('active');
            ledLimit.classList.remove('active');
            ledError.classList.remove('active');
            plotter.classList.add('power-off');
            
            // Terminate operations
            actionQueue = [];
            stopJog();
            updateMotorSound(0);
            resetPensToStables();
            
            playBeep(200, 0.15); // Power-off click
            showToast('Power Turned OFF', 'fa-power-off');
        }
    });

    // Console buttons click feedback
    document.querySelectorAll('.btn-console').forEach(btn => {
        btn.addEventListener('click', playClick);
    });

    // Console Arrow Jogging
    const handleJogStart = (dir) => (e) => { e.preventDefault(); startJog(dir); };
    const handleJogEnd = (e) => { e.preventDefault(); stopJog(); };
    
    btnJogUp.addEventListener('mousedown', handleJogStart('up'));
    btnJogUp.addEventListener('mouseup', handleJogEnd);
    btnJogUp.addEventListener('mouseleave', handleJogEnd);
    
    btnJogDown.addEventListener('mousedown', handleJogStart('down'));
    btnJogDown.addEventListener('mouseup', handleJogEnd);
    btnJogDown.addEventListener('mouseleave', handleJogEnd);
    
    btnJogLeft.addEventListener('mousedown', handleJogStart('left'));
    btnJogLeft.addEventListener('mouseup', handleJogEnd);
    btnJogLeft.addEventListener('mouseleave', handleJogEnd);
    
    btnJogRight.addEventListener('mousedown', handleJogStart('right'));
    btnJogRight.addEventListener('mouseup', handleJogEnd);
    btnJogRight.addEventListener('mouseleave', handleJogEnd);
    
    // FAST Jog button modifier
    btnJogFast.addEventListener('mousedown', () => {
        isJogFast = true;
        btnJogFast.classList.add('active');
        playBeep(800, 0.05);
    });
    btnJogFast.addEventListener('mouseup', () => {
        isJogFast = false;
        btnJogFast.classList.remove('active');
    });
    btnJogFast.addEventListener('mouseleave', () => {
        isJogFast = false;
        btnJogFast.classList.remove('active');
    });

    // Pen pick up stations manual controls
    document.querySelectorAll('.btn-pen-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!isPowerOn) return;
            const pen = parseInt(e.target.dataset.pen);
            const targetPen = (pen === logicalSelectedPen) ? 0 : pen;
            executeHPGLCommand('SP', [targetPen], `SP${targetPen}`);
        });
    });

    // Operations Row console actions
    btnPenUp.addEventListener('click', () => {
        if (!isPowerOn) return;
        executeHPGLCommand('PU', [], 'PU');
    });
    
    btnPenDown.addEventListener('click', () => {
        if (!isPowerOn) return;
        executeHPGLCommand('PD', [], 'PD');
    });
    
    btnChartLoad.addEventListener('click', () => {
        if (!isPowerOn) return;
        // Chart Load: releases hold and centers/parks carriage to the top-right
        isChartOnHold = false;
        showToast('Chart Released (Load state)', 'fa-file');
        
        const targetLimitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
        const targetLimitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
        
        executeHPGLCommand('PU', [], 'PU');
        executeHPGLCommand('PA', [targetLimitX, targetLimitY], `PA${targetLimitX},${targetLimitY}`);
    });
    
    btnChartHold.addEventListener('click', () => {
        if (!isPowerOn) return;
        isChartOnHold = true;
        showToast('Chart Hold Electrostatics ON', 'fa-file');
    });
    
    btnP1.addEventListener('click', (e) => {
        if (!isPowerOn) return;
        if (e.shiftKey) {
            // SHIFT+P1: Set P1 to the current pen position
            p1X = currentX;
            p1Y = currentY;
            showToast(`P1 set to (${Math.round(p1X)}, ${Math.round(p1Y)})`, 'fa-crosshairs');
        } else {
            // P1 alone: Move pen to the P1 position (pen up)
            actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
            actionQueue.push({ type: 'move', x: p1X, y: p1Y, draw: false });
            showToast(`Moving to P1 (${Math.round(p1X)}, ${Math.round(p1Y)})`, 'fa-location-crosshairs');
        }
    });
    
    btnP2.addEventListener('click', (e) => {
        if (!isPowerOn) return;
        if (e.shiftKey) {
            // SHIFT+P2: Set P2 to the current pen position
            p2X = currentX;
            p2Y = currentY;
            showToast(`P2 set to (${Math.round(p2X)}, ${Math.round(p2Y)})`, 'fa-crosshairs');
        } else {
            // P2 alone: Move pen to the P2 position (pen up)
            actionQueue.push({ type: 'state', key: 'penState', val: 'up' });
            actionQueue.push({ type: 'move', x: p2X, y: p2Y, draw: false });
            showToast(`Moving to P2 (${Math.round(p2X)}, ${Math.round(p2Y)})`, 'fa-location-crosshairs');
        }
    });
    
    btnEnter.addEventListener('click', () => {
        if (!isPowerOn) return;
        console.log(`Registered point coordinates: (${currentX}, ${currentY})`);
        showToast(`Coords: (${Math.round(currentX)}, ${Math.round(currentY)})`, 'fa-circle-dot');
    });

    // Velocity / Speed Slider
    sliderSpeed.addEventListener('input', (e) => {
        velocityMultiplier = parseInt(e.target.value);
        speedDisplay.textContent = `${velocityMultiplier} cm/s`;
    });

    // Settings checkboxes toggles
    chkInstantDraw.addEventListener('change', (e) => {
        isInstantDraw = e.target.checked;
        showToast(`Instant draw: ${isInstantDraw ? 'ON' : 'OFF'}`, 'fa-bolt');
    });
    
    chkAutoScale.addEventListener('change', (e) => {
        autoScaleActive = e.target.checked;
        showToast(`Auto scaling: ${autoScaleActive ? 'ON' : 'OFF'}`, 'fa-compress');
    });
    
    chkSoundFx.addEventListener('change', (e) => {
        soundFxEnabled = e.target.checked;
        if (!soundFxEnabled) updateMotorSound(0);
    });

    chkFlowControl.addEventListener('change', (e) => {
        flowControlEnabled = e.target.checked;
    });

    // Clear Bed Button
    btnClearBed.addEventListener('click', () => {
        playClick();
        clearDrawingCanvas();
        actionQueue = [];
        showToast('Drawing bed cleared', 'fa-trash-can');
    });

    // Pen stations carousel customizer inputs
    document.querySelectorAll('.pen-color-preview').forEach(preview => {
        preview.addEventListener('click', (e) => {
            const penId = e.target.id.split('-').pop();
            const picker = document.getElementById(`picker-color-${penId}`);
            picker.click();
        });
    });

    for (let i = 1; i <= 8; i++) {
        const picker = document.getElementById(`picker-color-${i}`);
        const preview = document.getElementById(`preview-color-${i}`);
        const penBody = document.getElementById(`pen-body-${i}`);
        const widthInput = document.getElementById(`width-pen-${i}`);
        
        picker.addEventListener('input', (e) => {
            const color = e.target.value;
            penColors[i] = color;
            preview.style.backgroundColor = color;
            penBody.style.backgroundColor = color;
            
            // If active in carriage, update carriage pentip color
            if (selectedPen === i) {
                carriagePenTip.style.backgroundColor = color;
            }
        });
        
        widthInput.addEventListener('change', (e) => {
            penWidths[i] = parseFloat(e.target.value) || 0.3;
        });
    }

    // Reset Pen Carousel Settings to Default
    if (btnResetPens) {
        btnResetPens.addEventListener('click', () => {
            playClick();
            
            const defaultColors = {
                1: '#1c1917', // Black
                2: '#dc2626', // Red
                3: '#16a34a', // Green
                4: '#2563eb', // Blue
                5: '#eab308', // Yellow
                6: '#d946ef', // Magenta
                7: '#0891b2', // Cyan
                8: '#78350f'  // Brown
            };
            const defaultWidths = {
                1: 0.3, 2: 0.3, 3: 0.3, 4: 0.3,
                5: 0.3, 6: 0.3, 7: 0.3, 8: 0.3
            };
            
            for (let i = 1; i <= 8; i++) {
                penColors[i] = defaultColors[i];
                penWidths[i] = defaultWidths[i];
                
                const picker = document.getElementById(`picker-color-${i}`);
                const preview = document.getElementById(`preview-color-${i}`);
                const penBody = document.getElementById(`pen-body-${i}`);
                const widthInput = document.getElementById(`width-pen-${i}`);
                
                if (picker) picker.value = defaultColors[i];
                if (preview) preview.style.backgroundColor = defaultColors[i];
                if (penBody) penBody.style.backgroundColor = defaultColors[i];
                if (widthInput) widthInput.value = defaultWidths[i];
            }
            
            if (selectedPen > 0) {
                carriagePenTip.style.backgroundColor = penColors[selectedPen];
            }
            
            showToast('Pen settings reset to default', 'fa-rotate-left');
        });
    }

    // Toast Messages system
    function showToast(msg, icon = 'fa-check') {
        const toast = document.createElement('div');
        toast.className = 'toast-feedback';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 2200);
    }

    // Live terminal HPGL commands logging
    function logCommand(cmdText) {
        // Append log line
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = cmdText;
        
        const emptyMsg = logViewport.querySelector('.log-empty-msg');
        if (emptyMsg) emptyMsg.remove();
        
        logViewport.appendChild(line);
        
        // Auto scroll
        logViewport.scrollTop = logViewport.scrollHeight;
        
        // Cap lines
        if (logViewport.children.length > 50) {
            logViewport.children[0].remove();
        }
    }

    // 14. Demo Drawing Actions triggers
    btnDrawShuttle.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) {
            showToast('Turn ON the plotter power first!', 'fa-triangle-exclamation');
            return;
        }
        
        clearDrawingCanvas();
        actionQueue = [];
        
        showToast('Loading Space Shuttle coordinates...', 'fa-space-shuttle');
        
        // Pre-scan shuttle HPGL bounds for fitting
        preScanHPGLBounds(SPACE_SHUTTLE_HPGL);
        
        // Feed coordinates
        processIncomingHPGL(SPACE_SHUTTLE_HPGL);
    });

    btnDrawTest.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) {
            showToast('Turn ON the plotter power first!', 'fa-triangle-exclamation');
            return;
        }
        
        clearDrawingCanvas();
        actionQueue = [];
        
        showToast('Loading HPGL Emulation Test suite...', 'fa-vial');
        
        // Vector test suite commands script generator
        let testHpgl = "";
        if (hpglLevel === 'hpgl2') {
            testHpgl = [
                "IN;",
                "SP1;", // Black pen
                "PA1000,1200;",
                "PD15000,1200,15000,10400,1000,10400,1000,1200;", // Border
                "PU3000,9500;SI0.4,0.6;DI1,0;LBHP-GL/2 PLOTTER EMULATION HPGL 2\x03;", // Title
                "PC2,220,38,38;PC3,37,99,235;PC4,22,163,74;", // Custom colors red, blue, green using PC
                "PW0.8,2;PW0.5,3;", // Custom widths for pen 2 and 3 using PW
                "SP2;", // Red pen (thick)
                "PU8000,6000;CI1500;", // Circles
                "SP3;", // Blue pen (medium)
                "CI2500,15;",
                "SP4;", // Green pen
                "PU4000,6000;PD12000,6000;PU8000,3000;PD8000,9000;", // Crosshairs
                "SP5;", // Yellow pen
                // Define and fill a polygon (triangle)
                "PU11000,6500;PM0;PD14000,6500,12500,9000,11000,6500;PM2;FP;", // Fill Polygon
                "SP6;", // Magenta pen
                // Define and edge a polygon (pentagon)
                "PU2000,2000;PM0;PD4000,2000,4500,3500,3000,4500,1500,3500;PM2;EP;", // Edge Polygon
                "SP7;", // Cyan pen
                "PU8000,6000;AA8000,6000,180;", // Arc
                "SP8;", // Brown pen
                "PU11500,2500;LT2;PA14500,2500;LT5;PA14500,4500;LT;" // Line types
            ].join("");
        } else {
            testHpgl = [
                "IN;",
                "SP1;", // Black pen
                "PA1000,1200;",
                "PD15000,1200,15000,10400,1000,10400,1000,1200;", // Border
                "PU3000,9500;SI0.4,0.6;DI1,0;LBHP 9872B PLOTTER EMULATION - HPGL 1\x03;", // Title
                "SP2;", // Red pen
                "PU8000,6000;CI1500;", // Circles
                "SP3;", // Blue pen
                "CI2500,15;",
                "SP4;", // Green Pen
                "PU4000,6000;PD12000,6000;PU8000,3000;PD8000,9000;", // Crosshairs
                "SP5;", // Yellow Gold pen
                "PU2000,2000;PD4000,4000;PR1500,0,0,1500,-1500,0,0,-1500;", // Relative Square
                "SP6;", // Magenta / Pink pen
                "PU3000,8500;SI0.3,0.45;DI1,-0.3;LBArc & Directional Text Demo\x03;",
                "SP7;", // Cyan pen
                "PU8000,6000;AA8000,6000,180;", // Arc
                "SP8;", // Brown pen
                "PU11500,2500;LT2;PA14500,2500;LT5;PA14500,4500;LT;", // Line types
				"SP0;PA16000,11400" // Top Right of paper with Cross hair pen 09872-60066
            ].join("");
        }
        
        // Pre-scan test page bounds
        preScanHPGLBounds(testHpgl);
        
        // Parse test page
        processIncomingHPGL(testHpgl);
    });

    // 14.5 HPGL Step Debugger Logic
    function loadIntoDebugger(hpglText) {
        debugQueue = [];
        debugActiveIndex = -1;
        debugState = 'paused';
        actionQueue = []; // clear current motion queue
        
        // Tokenize HPGL commands
        const cleanText = hpglText.replace(/\r?\n|\r/g, '').trim();
        const commands = cleanText.split(';');
        
        for (let cmd of commands) {
            cmd = cmd.trim();
            if (cmd.length < 2) continue;
            
            const mnemonic = cmd.substring(0, 2).toUpperCase();
            const paramStr = cmd.substring(2);
            
            const params = [];
            const regex = /[-+]?[0-9]*\.?[0-9]+/g;
            let match;
            while ((match = regex.exec(paramStr)) !== null) {
                params.push(parseFloat(match[0]));
            }
            
            debugQueue.push({
                mnemonic: mnemonic,
                params: params,
                raw: cmd + ';',
                state: 'pending'
            });
        }
        
        // Pre-scan bounds for fitting if auto-scaling is enabled
        if (autoScaleActive) {
            preScanHPGLBounds(hpglText);
        }
        
        renderDebugQueue();
        updateDebugUIStatus();
        showToast(`Loaded ${debugQueue.length} commands into debugger`, 'fa-bug');
    }

    function stepDebugger() {
        if (!isPowerOn || debugQueue.length === 0) return;
        
        // Check if finished
        if (debugActiveIndex >= debugQueue.length - 1) {
            if (debugActiveIndex >= 0) {
                debugQueue[debugActiveIndex].state = 'done';
            }
            debugState = 'finished';
            renderDebugQueue();
            updateDebugUIStatus();
            showToast('Debugger execution completed successfully!', 'fa-circle-check');
            return;
        }
        
        // Mark previous active command as done
        if (debugActiveIndex >= 0) {
            debugQueue[debugActiveIndex].state = 'done';
        }
        
        debugActiveIndex++;
        const currentCmd = debugQueue[debugActiveIndex];
        currentCmd.state = 'active';
        
        renderDebugQueue();
        updateDebugUIStatus();
        
        // Execute the single command (adds steps to actionQueue)
        executeHPGLCommand(currentCmd.mnemonic, currentCmd.params, currentCmd.raw);
    }

    function renderDebugQueue() {
        debugViewport.innerHTML = '';
        
        if (debugQueue.length === 0) {
            debugViewport.innerHTML = '<span class="log-empty-msg">No commands loaded...</span>';
            return;
        }
        
        debugQueue.forEach((cmd, idx) => {
            const item = document.createElement('div');
            item.className = `debug-item ${cmd.state}`;
            
            let iconHtml = '<i class="fa-solid fa-circle"></i>';
            if (cmd.state === 'done') {
                iconHtml = '<i class="fa-solid fa-circle-check"></i>';
            } else if (cmd.state === 'active') {
                iconHtml = '<i class="fa-solid fa-circle-play"></i>';
            } else if (cmd.state === 'pending') {
                iconHtml = '<i class="fa-solid fa-circle-dot"></i>';
            }
            
            item.innerHTML = `${iconHtml} <span>${String(idx + 1).padStart(3, '0')}: ${cmd.raw}</span>`;
            
            // Allow stepping directly by clicking on an item
            item.addEventListener('click', () => {
                if (debugState === 'paused' && cmd.state === 'pending' && idx === debugActiveIndex + 1) {
                    stepDebugger();
                }
            });
            
            debugViewport.appendChild(item);
            
            // Scroll active item into view
            if (cmd.state === 'active') {
                setTimeout(() => {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 50);
            }
        });
    }

    function updateDebugUIStatus() {
        if (debugState === 'idle') {
            debugStatus.textContent = 'Idle';
            debugStatus.className = 'status-indicator offline';
            btnDebugStep.disabled = true;
            btnDebugResume.disabled = true;
            btnDebugPause.disabled = true;
            btnDebugReset.disabled = true;
        } else if (debugState === 'paused') {
            debugStatus.textContent = `Paused (${debugActiveIndex + 1}/${debugQueue.length})`;
            debugStatus.className = 'status-indicator jogging';
            btnDebugStep.disabled = false;
            btnDebugResume.disabled = false;
            btnDebugPause.disabled = true;
            btnDebugReset.disabled = false;
        } else if (debugState === 'running') {
            debugStatus.textContent = `Running (${debugActiveIndex + 1}/${debugQueue.length})`;
            debugStatus.className = 'status-indicator online';
            btnDebugStep.disabled = true;
            btnDebugResume.disabled = true;
            btnDebugPause.disabled = false;
            btnDebugReset.disabled = false;
        } else if (debugState === 'finished') {
            debugStatus.textContent = 'Finished';
            debugStatus.className = 'status-indicator online';
            btnDebugStep.disabled = true;
            btnDebugResume.disabled = true;
            btnDebugPause.disabled = true;
            btnDebugReset.disabled = false;
        }
    }

    function toggleDebugSidebar() {
        playClick();
        debugPanel.classList.toggle('open');
        const isOpen = debugPanel.classList.contains('open');
        debugTrigger.classList.toggle('panel-open', isOpen);
        
        if (isOpen) {
            debugTriggerIcon.className = 'fa-solid fa-chevron-left';
            // Symmetrical check: close right sidebar if open to prevent overlap
            if (sidebarPanel.classList.contains('open')) {
                toggleSidebar();
            }
        } else {
            debugTriggerIcon.className = 'fa-solid fa-chevron-right';
        }
    }

    // Debug Panel Trigger Click listeners
    debugTrigger.addEventListener('click', toggleDebugSidebar);
    btnCloseDebug.addEventListener('click', toggleDebugSidebar);

    // Support drag and drop file loading into debugInput textarea
    const debugInputContainer = document.getElementById('debug-input-container');
    const debugDragPlaceholder = document.getElementById('debug-drag-placeholder');
    const debugFileInput = document.getElementById('debug-file-input');

    if (debugInput && debugInputContainer) {
        // Toggle placeholder on input/focus
        const updatePlaceholderState = () => {
            if (debugInput.value.trim().length > 0) {
                debugInputContainer.classList.add('has-content');
            } else {
                debugInputContainer.classList.remove('has-content');
            }
        };

        debugInput.addEventListener('input', updatePlaceholderState);
        debugInput.addEventListener('focus', () => {
            debugInputContainer.classList.add('has-content');
        });
        debugInput.addEventListener('blur', updatePlaceholderState);

        // Click on select file link triggers file picker
        const btnSelectFileLink = document.getElementById('btn-select-file-link');
        if (btnSelectFileLink && debugFileInput) {
            btnSelectFileLink.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent textarea focus if link is clicked
                debugFileInput.click();
            });
            
            debugFileInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files.length > 0) {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        debugInput.value = event.target.result;
                        updatePlaceholderState();
                        showToast(`Loaded ${file.name} successfully!`, 'fa-file-import');
                    };
                    reader.readAsText(file);
                }
            });
        }

        debugInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            debugInput.classList.add('dragover');
            debugInputContainer.classList.add('has-content'); // hide overlay while dragging over
        });

        debugInput.addEventListener('dragleave', () => {
            debugInput.classList.remove('dragover');
            updatePlaceholderState();
        });

        debugInput.addEventListener('drop', (e) => {
            e.preventDefault();
            debugInput.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    debugInput.value = event.target.result;
                    updatePlaceholderState();
                    showToast(`Loaded ${file.name} successfully!`, 'fa-file-import');
                };
                reader.onerror = () => {
                    showToast('Failed to read file!', 'fa-triangle-exclamation');
                };
                reader.readAsText(file);
            } else {
                updatePlaceholderState();
            }
        });
    }

    // Command runner buttons
    btnDebugRunAll.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) {
            showToast('Turn ON the plotter power first!', 'fa-triangle-exclamation');
            return;
        }
        
        const text = debugInput.value.trim();
        if (text.length < 2) {
            showToast('Please enter HPGL commands first!', 'fa-circle-xmark');
            return;
        }
        
        // Reset debugger states
        debugQueue = [];
        debugActiveIndex = -1;
        debugState = 'idle';
        updateDebugUIStatus();
        renderDebugQueue();
        
        // Scale and process commands immediately
        if (autoScaleActive) {
            preScanHPGLBounds(text);
        }
        processIncomingHPGL(text);
        showToast('Running HPGL input script...', 'fa-play');
    });

    btnDebugLoad.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) {
            showToast('Turn ON the plotter power first!', 'fa-triangle-exclamation');
            return;
        }
        
        const text = debugInput.value.trim();
        if (text.length < 2) {
            showToast('Please enter HPGL commands first!', 'fa-circle-xmark');
            return;
        }
        
        loadIntoDebugger(text);
    });

    // Stepper Debugger Operation buttons
    btnDebugStep.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) return;
        if (debugState === 'paused') {
            stepDebugger();
        }
    });

    btnDebugResume.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) return;
        if (debugState === 'paused') {
            debugState = 'running';
            updateDebugUIStatus();
            stepDebugger();
        }
    });

    btnDebugPause.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) return;
        if (debugState === 'running') {
            debugState = 'paused';
            updateDebugUIStatus();
        }
    });

    btnDebugReset.addEventListener('click', () => {
        playClick();
        if (!isPowerOn) return;
        
        // Reset debugger states and queue
        debugQueue = [];
        debugActiveIndex = -1;
        debugState = 'idle';
        actionQueue = []; // clear motion queue
        
        updateDebugUIStatus();
        renderDebugQueue();
        updateMotorSound(0);
        showToast('Debugger reset successfully.', 'fa-rotate-left');
    });

    // Collapsible Panels toggling
    document.querySelectorAll('.settings-title').forEach(title => {
        title.addEventListener('click', (e) => {
            // Prevent collapse if clicked on a button or selector inside the title (like Copy button)
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('button')) {
                return;
            }
            
            const group = title.closest('.settings-group');
            if (group) {
                playClick();
                group.classList.toggle('collapsed');
            }
        });
    });

    // Copy Command Queue Log button
    const btnCopyLog = document.getElementById('btn-copy-log');
    if (btnCopyLog) {
        btnCopyLog.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent panel from collapsing
            playClick();
            
            const logLines = Array.from(logViewport.querySelectorAll('.log-line'))
                .map(line => line.textContent)
                .join('\n');
                
            if (!logLines) {
                showToast('No commands to copy', 'fa-circle-xmark');
                return;
            }
            
            navigator.clipboard.writeText(logLines).then(() => {
                showToast('Log copied to clipboard!', 'fa-copy');
            }).catch(err => {
                console.error('Failed to copy log:', err);
                showToast('Failed to copy log', 'fa-circle-xmark');
            });
        });
    }

    // Copy Canvas Plot button
    const btnCopyCanvas = document.getElementById('btn-copy-canvas');
    if (btnCopyCanvas) {
        btnCopyCanvas.addEventListener('click', () => {
            playClick();
            try {
                // Create a temporary canvas matching the plotter canvas dimensions
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 1. Draw Paper Color Background Fill (skip for transparent film to preserve alpha transparency)
                if (activePaperColor !== 'transparent') {
                    let paperColorHex = '#faf9f6'; // cream default
                    if (activePaperColor === 'white') paperColorHex = '#ffffff';
                    else if (activePaperColor === 'blueprint') paperColorHex = '#0f172a';
                    else if (activePaperColor === 'black') paperColorHex = '#1c1917';
                    else if (activePaperColor === 'green') paperColorHex = '#ecfdf5';
                    else if (activePaperColor === 'paleblue') paperColorHex = '#eff6ff';
                    else if (activePaperColor === 'paleyellow') paperColorHex = '#fefce8';
                    else if (activePaperColor === 'palepink') paperColorHex = '#fdf2f8';
                    else if (activePaperColor === 'mattefilm') paperColorHex = 'rgba(228, 228, 231, 0.65)';
                    
                    tempCtx.fillStyle = paperColorHex;
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                }
                
                // 2. Draw Background Template Lines (Grids, borders, etc. from bgCanvas)
                if (bgCanvas) {
                    tempCtx.drawImage(bgCanvas, 0, 0);
                }
                
                // 3. Draw Foreground Plotter Vector Lines (from active canvas)
                tempCtx.drawImage(canvas, 0, 0);
                
                tempCanvas.toBlob(blob => {
                    if (!blob) {
                        showToast('Canvas is empty!', 'fa-circle-xmark');
                        return;
                    }
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard.write([item]).then(() => {
                        showToast('Plot image copied (with paper background)!', 'fa-copy');
                    }).catch(err => {
                        console.error('Failed to copy canvas image:', err);
                        showToast('Clipboard write failed!', 'fa-circle-xmark');
                    });
                });
            } catch (e) {
                console.error('Canvas export error:', e);
                showToast('Failed to export canvas image', 'fa-circle-xmark');
            }
        });
    }

    // Graticule checkbox toggle
    if (chkGridEnable) {
        chkGridEnable.addEventListener('change', (e) => {
            isGridEnabled = e.target.checked;
            drawGraticuleGrid();
        });
    }
    
    // Graticule color selector
    if (pickerGridColor) {
        pickerGridColor.addEventListener('input', (e) => {
            gridColor = e.target.value;
            drawGraticuleGrid();
        });
    }

    // HPGL language level selector
    if (selectHpglLevel) {
        hpglLevel = selectHpglLevel.value;
        selectHpglLevel.addEventListener('change', (e) => {
            hpglLevel = e.target.value;
            showToast(`Language set to ${hpglLevel === 'hpgl2' ? 'HP-GL/2' : 'HP-GL'}`, 'fa-sliders');
        });
    }
    
    // Paper orientation selector
    if (selectPaperOrientation) {
        selectPaperOrientation.addEventListener('change', (e) => {
            activePaperOrientation = e.target.value;
            resetSoftLimits();
            
            // Move carriage to top-right of new layout by default to keep plotter axis synchronized
            const targetLimitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
            const targetLimitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
            currentX = targetLimitX;
            currentY = targetLimitY;
            targetX = targetLimitX;
            targetY = targetLimitY;
            actionQueue = [];
            isChartOnHold = false;
            
            // Defer calculations until DOM reflow is complete
            setTimeout(() => {
                cacheLayoutDimensions();
                initCanvas();
                updateCarriageDOM(currentX, currentY);
            }, 60);
        });
    }

    // Paper size selector
    if (selectPaperSize) {
        selectPaperSize.addEventListener('change', (e) => {
            activePaperSize = e.target.value;
            
            // Move carriage to top-right of new layout by default to keep plotter axis synchronized
            const targetLimitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
            const targetLimitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
            currentX = targetLimitX;
            currentY = targetLimitY;
            targetX = targetLimitX;
            targetY = targetLimitY;
            actionQueue = [];
            isChartOnHold = false;
            
            // Defer calculations until DOM reflow is complete
            setTimeout(() => {
                cacheLayoutDimensions();
                initCanvas();
                updateCarriageDOM(currentX, currentY);
            }, 60);
        });
    }
    
    // Paper color selector
    if (selectPaperColor) {
        selectPaperColor.addEventListener('change', (e) => {
            activePaperColor = e.target.value;
            updatePaperColorDOM();
            drawBackgroundTemplate();
        });
    }
    
    // Paper template selector
    if (selectPaperTemplate) {
        selectPaperTemplate.addEventListener('change', (e) => {
            activePaperTemplate = e.target.value;
            drawBackgroundTemplate();
        });
    }

    // Keyboard bindings for Arrow keys (Jog) and PgUp/PgDn (Step size adjustment)
    const activeArrowKeys = new Set();
    
    window.addEventListener('keydown', (e) => {
        // Skip bindings if user is typing in a text field
        if (document.activeElement && 
            ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            return;
        }
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            if (!activeArrowKeys.has(e.key)) {
                activeArrowKeys.add(e.key);
                let dir = '';
                if (e.key === 'ArrowUp') dir = 'up';
                if (e.key === 'ArrowDown') dir = 'down';
                if (e.key === 'ArrowLeft') dir = 'left';
                if (e.key === 'ArrowRight') dir = 'right';
                startJog(dir);
            }
        }
        
        if (e.key === 'PageUp') {
            e.preventDefault();
            jogStepSize = Math.min(1000, jogStepSize + 10);
            showToast(`Jog Step: ${jogStepSize} PLU (~${(jogStepSize / 40).toFixed(2)} mm)`, 'fa-ruler');
        }
        
        if (e.key === 'PageDown') {
            e.preventDefault();
            jogStepSize = Math.max(1, jogStepSize - 10);
            showToast(`Jog Step: ${jogStepSize} PLU (~${(jogStepSize / 40).toFixed(2)} mm)`, 'fa-ruler');
        }
        
        if (e.key === 'Home') {
            e.preventDefault();
            executeHPGLCommand('PU', [], 'PU');
            executeHPGLCommand('PA', [0, 0], 'PA0,0');
            showToast('Home: Moving to (0,0)', 'fa-house');
        }
        
        if (e.key === 'End') {
            e.preventDefault();
            const targetLimitX = activePaperOrientation === 'portrait' ? 11400 : 16000;
            const targetLimitY = activePaperOrientation === 'portrait' ? 16000 : 11400;
            executeHPGLCommand('PU', [], 'PU');
            executeHPGLCommand('PA', [targetLimitX, targetLimitY], `PA${targetLimitX},${targetLimitY}`);
            showToast('End: Moving to Max Position', 'fa-arrow-up-right-from-square');
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            btnEnter.click();
        }
        
        // Delete — Clear Paper Bed (works regardless of power state, matching button behaviour)
        if (e.key === 'Delete') {
            e.preventDefault();
            btnClearBed.click();
        }
        
        // O — Toggle Power ON / OFF
        if (e.key === 'o' || e.key === 'O') {
            e.preventDefault();
            powerSwitch.click();
        }
        
        // L — Chart Load
        if (e.key === 'l' || e.key === 'L') {
            e.preventDefault();
            btnChartLoad.click();
        }
        
        // H — Chart Hold
        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            btnChartHold.click();
        }
        
        // 1–8 — Select / Deselect Pen (pressing the same pen number again deselects it)
        if (e.key >= '1' && e.key <= '8') {
            e.preventDefault();
            const penBtn = document.querySelector(`.btn-pen-select[data-pen="${e.key}"]`);
            if (penBtn) penBtn.click();
        }
        
        // U — Pen Up
        if (e.key === 'u' || e.key === 'U') {
            e.preventDefault();
            btnPenUp.click();
        }
        
        // D — Pen Down
        if (e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            btnPenDown.click();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (activeArrowKeys.has(e.key)) {
                activeArrowKeys.delete(e.key);
                if (activeArrowKeys.size === 0) {
                    stopJog();
                } else {
                    // Fall back to the next oldest held direction key
                    const nextKey = Array.from(activeArrowKeys)[activeArrowKeys.size - 1];
                    let dir = '';
                    if (nextKey === 'ArrowUp') dir = 'up';
                    if (nextKey === 'ArrowDown') dir = 'down';
                    if (nextKey === 'ArrowLeft') dir = 'left';
                    if (nextKey === 'ArrowRight') dir = 'right';
                    startJog(dir);
                }
            }
        }
    });

    // 15. Initial State boot
    if (sliderSpeed) {
        velocityMultiplier = parseInt(sliderSpeed.value) || 36;
        if (speedDisplay) {
            speedDisplay.textContent = `${velocityMultiplier} cm/s`;
        }
    }
    if (chkInstantDraw) {
        isInstantDraw = chkInstantDraw.checked;
    }
    if (chkAutoScale) {
        autoScaleActive = chkAutoScale.checked;
    }
    if (chkSoundFx) {
        soundFxEnabled = chkSoundFx.checked;
    }
    if (chkFlowControl) {
        flowControlEnabled = chkFlowControl.checked;
    }
    if (chkGridEnable) {
        isGridEnabled = chkGridEnable.checked;
    }
    if (selectPaperSize) {
        activePaperSize = selectPaperSize.value;
    }
    if (selectPaperOrientation) {
        activePaperOrientation = selectPaperOrientation.value;
    }
    if (selectPaperColor) {
        activePaperColor = selectPaperColor.value;
        updatePaperColorDOM();
    }
    if (selectPaperTemplate) {
        activePaperTemplate = selectPaperTemplate.value;
    }
    if (selectHpglLevel) {
        hpglLevel = selectHpglLevel.value;
    }
    if (pickerGridColor) {
        gridColor = pickerGridColor.value;
    }
    
    // Synchronize Pen Carousel configuration from customizer HTML inputs
    for (let i = 1; i <= 8; i++) {
        const picker = document.getElementById(`picker-color-${i}`);
        const preview = document.getElementById(`preview-color-${i}`);
        const penBody = document.getElementById(`pen-body-${i}`);
        const widthInput = document.getElementById(`width-pen-${i}`);
        
        if (picker) {
            penColors[i] = picker.value;
            if (preview) preview.style.backgroundColor = picker.value;
            if (penBody) penBody.style.backgroundColor = picker.value;
        }
        if (widthInput) {
            penWidths[i] = parseFloat(widthInput.value) || 0.3;
        }
    }
    
    resetSoftLimits();
    cacheLayoutDimensions();
    initCanvas();
    
    // Boot sequence beep & lights
    setTimeout(() => {
        playChime();
        ledPower.classList.add('active');
        // Re-cache once page rendering has settled down
        cacheLayoutDimensions();
        // Refresh alignment once fully loaded
        updateCarriageDOM(currentX, currentY);
    }, 400);
});
