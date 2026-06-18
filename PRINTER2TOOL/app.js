/* ==========================================================================
   Psion Organiser II Printer RLE Tool - Controller & Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropBox = document.getElementById('dropBox');
    const fileInput = document.getElementById('fileInput');
    const previewCanvas = document.getElementById('previewCanvas');
    const ctx = previewCanvas.getContext('2d');
    const thresholdRange = document.getElementById('thresholdRange');
    const thresholdVal = document.getElementById('thresholdVal');
    const thresholdGroup = document.getElementById('thresholdGroup');
    const modeDither = document.getElementById('modeDither');
    const modeThreshold = document.getElementById('modeThreshold');
    const invertColors = document.getElementById('invertColors');
    const scaleFit = document.getElementById('scaleFit');
    const scaleNative = document.getElementById('scaleNative');
    
    // Print Scale & Justification
    const scaleRange = document.getElementById('scaleRange');
    const scaleVal = document.getElementById('scaleVal');
    const alignLeft = document.getElementById('alignLeft');
    const alignCentre = document.getElementById('alignCentre');
    const alignRight = document.getElementById('alignRight');
    
    // Rotations
    const rotations = document.getElementsByName('rotation');
    
    // Actions & Outputs
    const btnPrintSim = document.getElementById('btnPrintSim');
    const btnCopy = document.getElementById('btnCopy');
    const btnDownload = document.getElementById('btnDownload');
    const oplOutput = document.getElementById('oplOutput');
    const btnCopyDecoder = document.getElementById('btnCopyDecoder');
    const decoderOutput = document.getElementById('decoderOutput');
    const receiptPaper = document.getElementById('receiptPaper');
    const receiptMeta = document.getElementById('receiptMeta');
    
    // Stats
    const statDimensions = document.getElementById('statDimensions');
    const statRawSize = document.getElementById('statRawSize');
    const statCompSize = document.getElementById('statCompSize');
    const statSavings = document.getElementById('statSavings');
    
    // Presets
    const presetLogo = document.getElementById('presetLogo');
    const presetTest = document.getElementById('presetTest');
    const presetRose = document.getElementById('presetRose');
    const presetNffp = document.getElementById('presetNffp');

    // Global States
    let loadedImage = null;       // Original image object
    let processedCanvas = null;   // Offscreen canvas holding the fully rendered B&W image
    let currentRotation = 0;

    // Toast Alert system
    function showToast(message, icon = 'fa-check') {
        const toast = document.createElement('div');
        toast.className = 'toast-feedback';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        document.body.appendChild(toast);
        
        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 50);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Drag & Drop
    dropBox.addEventListener('click', () => fileInput.click());
    dropBox.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        dropBox.classList.add('hover'); 
    });
    dropBox.addEventListener('dragleave', () => dropBox.classList.remove('hover'));
    dropBox.addEventListener('drop', (e) => {
        e.preventDefault(); 
        dropBox.classList.remove('hover');
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Control Listeners
    thresholdRange.addEventListener('input', (e) => {
        thresholdVal.textContent = e.target.value;
        if (loadedImage) processImage();
    });

    modeDither.addEventListener('change', toggleThresholdGroup);
    modeThreshold.addEventListener('change', toggleThresholdGroup);
    invertColors.addEventListener('change', () => {
        if (loadedImage) processImage();
    });
    scaleFit.addEventListener('change', () => {
        if (loadedImage) processImage();
    });
    scaleNative.addEventListener('change', () => {
        if (loadedImage) processImage();
    });

    scaleRange.addEventListener('input', (e) => {
        scaleVal.textContent = e.target.value + '%';
        if (loadedImage) processImage();
    });

    alignLeft.addEventListener('change', () => {
        if (loadedImage) processImage();
    });
    alignCentre.addEventListener('change', () => {
        if (loadedImage) processImage();
    });
    alignRight.addEventListener('change', () => {
        if (loadedImage) processImage();
    });

    // Rotation Changes
    rotations.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentRotation = parseInt(e.target.value, 10);
            if (loadedImage) processImage();
        });
    });

    function toggleThresholdGroup() {
        if (modeThreshold.checked) {
            thresholdGroup.style.display = 'flex';
        } else {
            thresholdGroup.style.display = 'none';
        }
        if (loadedImage) processImage();
    }

    // Load file helper
    function handleFile(fileObject) {
        if (!fileObject) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                loadedImage = img;
                // De-select preset active states
                document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
                processImage();
                showToast('Image loaded successfully!', 'fa-image');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(fileObject);
    }

    // Preset Loaders
    presetLogo.addEventListener('click', () => loadPreset(generateLogoPreset, presetLogo));
    presetTest.addEventListener('click', () => loadPreset(generateTestCardPreset, presetTest));
    presetRose.addEventListener('click', () => loadPreset(generateRosePreset, presetRose));
    presetNffp.addEventListener('click', () => loadNffpPreset(presetNffp));

    function loadPreset(drawFunc, activeBtn) {
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
        
        const presetCanvas = drawFunc();
        const img = new Image();
        img.onload = function() {
            loadedImage = img;
            processImage();
            showToast('Preset loaded!', 'fa-magic');
        };
        img.src = presetCanvas.toDataURL();
    }

    const nffpLogoB64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGIAAABkCAYAAAB9/OUTAAAO1ElEQVR4Aeyc4ZLjuA2Ep+/933lvP/LabkOkRMn2jK9qUvkWQKMBUuZeJT9S+efP778+4hf45+v3Xx/xC/w+xEc8w9fX70P8PsT1X0DSl9TxFqnXkizdorTVbs0PST7inwhp/kNJuv3oUs/zt5OUZcslPcwgSiK8FOl1Oz/iIf7+15b2A0l6+AElNf1Vf0h66X7f+xX3+4iH4EMkES4h/czspctOhn7sISQ9/O2c3K/J/M2bgYEeEchH0JshPd5F0sz6Nv3yQ0jXLyvtz+YPyZdLmj4aXjxEIAdpO0Pf4BlBf6S/W7v8EFcvLGn4Tewzkm4/fNP+/PnKKKntkNR8FFLPpR7T7zx95KlTgyTCbW8r4g+p95Gke079DJcf4syhktqHSdqM+ceQ1DwYrBGppd6TekQ7Qupe6R6ZYaeRes86MZF6X+qRHrNEcC6J8ine/hDS+JJ8BEhqD0AOe19D31Rf6pnbh+bcEc1IajJ1S078cWWmrn/7Q+SBXNhI9w9Hk3qd/lfk7F7Zgw+kfg/yOif1XtVfUb/lISS1v+WSNneU1Hr+UKnXG+NAkI69udcrrLnei3hB0u0/l9Iv9TtISvnp/OUPIfUL8jG+HTlI94+T1B4kPc5nkR0w679S5xyp35Ec6n5JVbpcHz6EdO4wX1jqc9SS2o9O7puSGzRJhG9HUrubpM3Zvp+07W3MTwqHD8FlVs+Q1D7Kfmal+T8F9h1F9hx5Rv2VuVWPdP+O0VnPaocPsXqApGb1hxGlfnkaUu/XnBovUbp7qI9gDo58e31p7UzOkdT+opF7p9Q111fj0w8hPV5E6j++1GNejA8ANEmEZTzHgKT2g0jziG8F9hr7pftea0R8ROnx29ClPkP/CqceQtLDGdJjTdOXIlInUve7J/Uaz0hDl7T50dHx74FHGs/SuwpnMivdH0MSUkO6501Y/OPUQ/gSs930pX5BSe0HnHlnOjvoSfd5tAqePaqfGr9030t9hdzl/MqenDn1EDkoKcv237ml/gg0fEGp+2Y1XpMecnDvapT6+cyzD8glTf+i4DF4K9L9O2vvan35IfJALi1tL4eOTxKhPRaJpM2PIN01z+HNnHoPSZv2aB4NMEva3AV9hqTWku7Ru1rj7x9S7/1Nl/996SGkx4Ok/giS2kdJ9+hLSmqXck3hXOrzruld4ew8fuAsqd+PvCLp9l3uMWekfn/3iFKfIV/h1ENI2+Vcxgdlbk2S0/YxFPhAUtPI0Y+Quv/Id7bP+SDpNiqp3U1S0+gnTfzvD3SpPwb5f/KpcOoh6mYOlfoF3EPLPGvrROn+gdQzJLUfZNZ/lS6prZJ0O4+7m9Zc+EPSgmtreeohpMdH8HouTy6pfRS1sZ412gx89CQRLiGNZ6WuSz2ynPMMdUW6e7PHjDT+PdI3y08/BAeyzJF8BH2gJ90vLz1eVrr38K4gnZvxPdgt9VmpRzT6hjqR1P4yST1mr+bskPQgS4/1QzOK0w8h9R9S6jF2DVMu54a0NmO/o3cQwfpKlHT7IdPPHkjNuTSecf8o1r2SjkbW/ieXktrHHG6bGLiYdH8ESTcnvVuxmBzNSGr3ldQ24gcKR/JE0sNM9mouqUq3mv3Sti9ttdvQ3+Twnwhpu0C6/6h/dxz+W9JXmrhs1rWfPed1xjqR+QQNv6Gu2G8d7yhPDY+xnpGdrvE5X4mHD1GXnD3A83tzez3P18hHG/fYY6zVWGdqnxoPe8gdyY+wl8iOI3/2Tz8EwxxETGYHo4/8zNID8iPwAT5H9ib0KngNPfzEGfTBfWbJHclXyT1HM7sPUQ9ncdWoYXTQTMdLj31APQKPyT4zkJpz+x2tzyI+92Y73X9n3H0ILgZcwJHc5Eeg1RptNLens8PYxw6DVrGfWHvP1Jx5dZ5Z7kP0DmrnNe4+BGYPEyEXkwM+yBwv2hH4EvzsMdRH4J156Bl7qJ2vRPu554p/zzPbsfsQsyEflH1f1j1i1ewnGnyA11BXqr/2a723q3rZXbWs6bMvtVfn04fg8DxsdBFrjvbXWXRrjswkeCp4Te09W3P2yg77uMeKPz3M5hw1pMf59CFsuBJ9GJcw7EE31BV7HWt/r2bvXp+de/3V3pU9vhuzMDrr8kOMFqJBHsQlTOqZMwOpPZuzLznah/fI887+9CH48fJgLpqac3SD3zoR0Ez6rBGrDy2hb1KvOZ6qZc35WW/z88rRzqM7+cTpQ9gwihxu6HOYoR6B3zo5uM54tCe9z+actbKj+rg7MFt7aBV7rdcafekhfBgLgEE0Q72HZ6qn6uyrHurqQ1uFncne3Jlz2Lm366hXz5o+RDVycFIPwp+4j+acyA6icb/q7p+Nr9ozOpfdZtTf05jLfq2nD5FDR7l/TPvqIVV3nwh1Hj868d3Uc0Z34Q7Vh7bKyuzwIWaX4WB6hhpWDsJXqXtqP2u8Wa/mV+dm+9kHs/5IX/EPH2K0DK0uzDofI3XmRqR/1P8uzXflPmZ0Nj4Y9V6hLT8El+Ci9VD0qs3qPe+oNzpvtjv1OjfabT9ecO3IjLFGxAvkIzxDHPVnWnuIOrR30GzRd+j1nq88M3c79+9A7XzvTHzuH/nTy0x7iNHQSGNgpHtp9kYa80n6U382z7M5A/Z22k+E9DIL1uiD64z2EWee9GfeHiKFq/nqwXu+UY+POnsnZqDOsT+hT03ED86J9IA8sS815+45Wq+x9qcPMbhA3bWpr8xslhwIZ8/AD7nWPwK68+yTowM5PnCNBmjEI+pcrZmfPgTNZDRMf6bT80X3PPjMqs/+UfSZRLCHPPdnbo8jXuf4wDWRPpDvgSfZ8y49hJd5UV6MXtb27EVmzMosnqTuZlfVXDPn3BE/uCa6tp86wWPwGGuOsxn3Z3HpIWbDqXOxrGs+63NxvLM+vQozUPWsV/aNPN5LD7zTuaN1IjOGGo9xTTR4nTtOH4JFNhFrjZawfORBt2/UpzfT6VVy39mcXT7LMTXvq72s8QNeQ43HUNMjJvSzznz6EGlynstZCu5lbm0U8VVGPs6CUQ+NHcTqsU7PjLTRHD7wXEb8Cb4kveT0iAnzWWd+6iFykNyLHdHOXoCZhF1gLXNrNc7OrPrKrtyN36Czz1An+LLOvPbYkX3y5YeoyxhOsu+DiCa9mTNn0PE7Oqc21phBc01ujTxBTx85pMc5XoOGz1DTIybWiJA9Zkd19S0/BMtYWhegj8A70pk37tuLbi1zazV6Dt35aM49R/wJMwYdn6E+Aq89mbPTeo3po3fqIRhIWJZkb5TnxZhLT63ppZ/6iNzh3DFn2ZvQw2eoRzBzRh95Z9ruQ9SLzS6Sy/Ek2XPOXuc1Muu+I1r6rKfm/M9///9/rh3ZYdDYkaCtwEz1oZna48yqjerbQ6wOcGD1unbEY6xxOBoRDcjBuftogG6NHG0V/Alz7DLUZ2DXGT9eziKucHuIM0N4uZih5jAikK+y4h95qua7cC45EU+CdoXctzrPDKSfu2Sd+e0hUpzlLPJycjPzo+PxDLVBd07EA+RAH8ghc2rAb6gNXnD9isi+0Vl1tz34s1fr7JFPH4KFGJLUMk/PKOcS9pNXT2qZVx87Evr4E7QZzI56Mx0vPfaTQ+bUlaN+9buePkQuzJxBX45InaCZ1NmBnlrm9CE1cmYMNeAz1KswM/LOdM61P3O0WqMB+so+vMn0IdJEPltOz3AJ56O4soM59hhq5hK074Jz8yzfK3W09JCPtJzBkyw/RA6RcxCLidRADc6JI+xxjx0JOh5D/d1wH873ueTg2hFf5nhSo4dG3OPyQ7C0HogGKwfjYx7IgTlD/VNwJ+5BTLgPOtE6uTVydCKgA/kRpx6CpeCl5JCH15waPEOkBnJgB5CvkvOrM0c+dkLehdx4nrrmdc791dgegiWrA+ljDrgYkR45ETKnNugJs+D+SmR+xbfq8fl1L/qI9NGnJi6et7G1h2DJpnNC4ALsINYxdKg6XkB33zXad8GZwB2AHDifmmhGNV50on1XYnuIs4McXGd8Ecfazzo95MBOIIf0vyPnDGA35xJdO6emZ9BXwL/iS8+lh2ABhwG5qbX1jHwcNV5wTgQ0wGfQgZr4DOwAdnAOkBtqcO3IDFC7T01OTL3m1Edcfoi62BdyrP1a5+XJE7zsMe6hkxNXwZ94JzF170Mjp0/MGg2sk7tvjXiFlz2EL0SsF/TF6JHTJ1bQYaa7x55VmEm8m3lyekTqzNFckyf2Eq3b62h9L+b85YfwktHB9NCJwGUc0akdq+6amDADzJ2BGRjtQgf2EcE5fmqoOZ7U8ID1UY9+Bb+1yw+RS8jBSx2tcTFycC+jdXypk896eA0+yLrm9A293EvtXkbreMnBefrQXJOD69V4+SFGB+QFuDTgQ3dObUaae0TmiEcc7fH83r7skSfsd03ufaN41B/NoL30IVjIhYkJl0Mnpo7m2j0050TAg06sWLev9rOuHs+mp+bM4CMCeXqO6vTu5S9/iNlh+RHk6XNdP8qeVT19s9w7jyJ3AvYQ7c+cnvVRTO+on9pbHoILQh5EzsWAHhGN3FADjDT0hB2Ahp94hH17c/TwAXnuRDO1lz5yfMQV3vIQPpiLAPUs8jGA5yzsNLPZ0W5m8LtHTQ7otUYbgW+k72k+o3re+hB5mC+QkZyPAXJghpp4FfYA897liAbUgA/IgRzwVOhX7Ww92/EtD1EPzw8lBzxAbvhINOIq6c+cedfeT0QDcsCX0DOpvzr/lofg0v4YR7SEHwHQ7KFO6Bk8zmukB+g5T45GD8jRgLxiT9XfUX/bQ9TL730kPwwwg89Qo+9RPZ4l1h71DPtn/VfrP/YQfIg/1hGtUn9095kZQR+dCDlPPYOZZOZ7l/6jD8FH8fEZyVfJH7nmqzs+xffjD5E/hB8FjRzITdb88FnbM4rVR13JOXZn/R35Rz0EH+wfiByoicAPRA2uiWCN3KCBa2Kt0SornjrzbP1xDzH6IH4Y4z41ORFGOZrBA66fj6/d8PEPwT8Fs0+e/bAzfbbnE/SPf4j/44965WE//iGufNT/ceb3IT7k1X4f4vchPuQX+JBr/AsAAP//ny5LvAAAAAZJREFUAwDn9cf1B6nkzgAAAABJRU5ErkJggg==";

    function loadNffpPreset(activeBtn) {
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
        
        const img = new Image();
        img.onload = function() {
            loadedImage = img;
            processImage();
            showToast('Preset loaded!', 'fa-magic');
        };
        img.src = nffpLogoB64;
    }

    // Programmatic Presets Creator
    function generateLogoPreset() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 140;
        const pCtx = canvas.getContext('2d');
        
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        pCtx.strokeStyle = '#000000';
        pCtx.lineWidth = 6;
        pCtx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        pCtx.lineWidth = 2;
        pCtx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
        
        // Text
        pCtx.fillStyle = '#000000';
        pCtx.font = 'bold 52px "Courier New", Courier, monospace';
        pCtx.textAlign = 'center';
        pCtx.textBaseline = 'middle';
        pCtx.fillText('P S I O N', canvas.width / 2, 55);
        
        pCtx.font = '700 16px "Courier New", Courier, monospace';
        pCtx.fillText('ORGANISER II  PRINTER', canvas.width / 2, 100);
        
        return canvas;
    }

    function generateTestCardPreset() {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const pCtx = canvas.getContext('2d');
        
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        pCtx.strokeStyle = '#000000';
        pCtx.lineWidth = 2;
        
        // Circles
        pCtx.beginPath();
        pCtx.arc(150, 150, 120, 0, Math.PI * 2);
        pCtx.arc(150, 150, 80, 0, Math.PI * 2);
        pCtx.arc(150, 150, 40, 0, Math.PI * 2);
        pCtx.arc(150, 150, 10, 0, Math.PI * 2);
        pCtx.stroke();
        
        // Cross
        pCtx.beginPath();
        pCtx.moveTo(10, 150); pCtx.lineTo(290, 150);
        pCtx.moveTo(150, 10); pCtx.lineTo(150, 290);
        pCtx.stroke();
        
        // Diagonal hatch grid
        for (let i = 10; i < 300; i += 20) {
            pCtx.beginPath();
            pCtx.moveTo(i, 10); pCtx.lineTo(i, 40);
            pCtx.moveTo(10, i); pCtx.lineTo(40, i);
            pCtx.stroke();
        }
        
        // Grayscale ramp (helps test dithering vs thresholding)
        for (let x = 50; x < 250; x++) {
            const gray = Math.floor((x - 50) * 255 / 200);
            pCtx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            pCtx.fillRect(x, 230, 1, 20);
        }
        
        pCtx.fillStyle = '#000000';
        pCtx.font = '10px "Courier New", monospace';
        pCtx.textAlign = 'center';
        pCtx.fillText('DITHER TEST RAMP', 150, 220);
        
        return canvas;
    }

    function generateRosePreset() {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const pCtx = canvas.getContext('2d');
        
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        pCtx.strokeStyle = '#000000';
        pCtx.lineWidth = 3;
        
        // Drawing a beautiful rose curve
        pCtx.translate(150, 150);
        pCtx.beginPath();
        const petals = 6; 
        const maxRadius = 130;
        
        for (let a = 0; a <= Math.PI * 2; a += 0.01) {
            const r = maxRadius * Math.sin(petals * a);
            const x = r * Math.cos(a);
            const y = r * Math.sin(a);
            if (a === 0) pCtx.moveTo(x, y);
            else pCtx.lineTo(x, y);
        }
        pCtx.closePath();
        pCtx.stroke();
        
        return canvas;
    }

    function getRuns(bytes) {
        const runs = [];
        if (bytes.length === 0) return runs;
        let currentVal = bytes[0];
        let currentLen = 1;
        for (let i = 1; i < bytes.length; i++) {
            if (bytes[i] === currentVal) {
                currentLen++;
            } else {
                runs.push({ value: currentVal, length: currentLen });
                currentVal = bytes[i];
                currentLen = 1;
            }
        }
        runs.push({ value: currentVal, length: currentLen });
        return runs;
    }

    function simplifyRow(rowBytes, maxRuns) {
        let list = getRuns(rowBytes);
        if (list.length <= maxRuns) {
            return rowBytes;
        }

        // Keep merging the shortest runs until we are under the limit
        while (list.length > maxRuns) {
            // Find the run with the minimum length
            // We exclude index 0 and list.length - 1 to protect the left/right margins from being swallowed
            let minIdx = 1;
            let minLength = list[1].length;
            for (let i = 2; i < list.length - 1; i++) {
                if (list[i].length < minLength) {
                    minLength = list[i].length;
                    minIdx = i;
                }
            }

            // Determine which neighbor to merge with
            // Merge with the shorter neighbor to keep run lengths balanced
            const leftLen = list[minIdx - 1].length;
            const rightLen = list[minIdx + 1].length;
            const targetIdx = (leftLen < rightLen) ? (minIdx - 1) : (minIdx + 1);

            // Merge minIdx into targetIdx
            list[targetIdx].length += list[minIdx].length;
            
            // Remove the merged run
            list.splice(minIdx, 1);

            // Compact adjacent runs of the same value
            let compacted = [];
            let cur = { value: list[0].value, length: list[0].length };
            for (let j = 1; j < list.length; j++) {
                if (list[j].value === cur.value) {
                    cur.length += list[j].length;
                } else {
                    compacted.push(cur);
                    cur = { value: list[j].value, length: list[j].length };
                }
            }
            compacted.push(cur);
            list = compacted;
        }

        // Reconstruct bytes
        let bytes = [];
        for (let i = 0; i < list.length; i++) {
            for (let j = 0; j < list[i].length; j++) {
                bytes.push(list[i].value);
            }
        }

        return bytes;
    }

    // Core Processing Function
    function processImage() {
        if (!loadedImage) return;

        // 1. Create a rotation-oriented canvas
        const rotCanvas = document.createElement('canvas');
        const rotCtx = rotCanvas.getContext('2d');
        const angle = currentRotation;

        if (angle === 90 || angle === 270) {
            rotCanvas.width = loadedImage.height;
            rotCanvas.height = loadedImage.width;
        } else {
            rotCanvas.width = loadedImage.width;
            rotCanvas.height = loadedImage.height;
        }

        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rotCtx.rotate((angle * Math.PI) / 180);
        rotCtx.drawImage(loadedImage, -loadedImage.width / 2, -loadedImage.height / 2);

        // 2. Determine scaling target dimensions
        let baseWidth;
        let baseHeight;

        if (scaleNative.checked) {
            // Keep native size (clamp width to maximum 256px to fit the printhead)
            baseWidth = Math.min(256, rotCanvas.width);
            if (rotCanvas.width > 256) {
                baseHeight = Math.round(rotCanvas.height * (256 / rotCanvas.width));
            } else {
                baseHeight = rotCanvas.height;
            }
        } else {
            // Fit to exactly 256px wide
            baseWidth = 256;
            baseHeight = Math.round(rotCanvas.height * (baseWidth / rotCanvas.width));
        }

        // Apply custom print scale factor from slider
        const scaleFactor = parseInt(scaleRange.value, 10) / 100;
        let targetWidth = Math.max(8, Math.round(baseWidth * scaleFactor));
        let targetHeight = Math.max(8, Math.round(baseHeight * scaleFactor));

        // Round height up to nearest multiple of 8, minimum 8 (since vertical slices are 8px tall)
        targetHeight = Math.max(8, Math.ceil(targetHeight / 8) * 8);

        // Resize the actual visible preview canvas
        previewCanvas.width = targetWidth; 
        previewCanvas.height = targetHeight;
        previewCanvas.style.width = (targetWidth / 256 * 100) + '%';

        // Apply page justification (margin styles)
        if (alignLeft.checked) {
            previewCanvas.style.marginLeft = '0';
            previewCanvas.style.marginRight = 'auto';
        } else if (alignCentre.checked) {
            previewCanvas.style.marginLeft = 'auto';
            previewCanvas.style.marginRight = 'auto';
        } else if (alignRight.checked) {
            previewCanvas.style.marginLeft = 'auto';
            previewCanvas.style.marginRight = '0';
        }
        
        // Render scaled rotated image
        ctx.drawImage(rotCanvas, 0, 0, targetWidth, targetHeight);

        // Extract Pixels
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const pixels = imgData.data;
        
        const threshold = parseInt(thresholdRange.value, 10);
        const isDither = modeDither.checked;
        const isInvert = invertColors.checked;
        const monoGrid = [];

        // Grayscale conversion & monochrome quantization
        if (isDither) {
            // Floyd-Steinberg error diffusion dithering
            const lumaGrid = [];
            for (let y = 0; y < targetHeight; y++) {
                lumaGrid[y] = [];
                for (let x = 0; x < targetWidth; x++) {
                    const idx = (y * targetWidth + x) * 4;
                    // Luma formula
                    lumaGrid[y][x] = 0.2126 * pixels[idx] + 0.7152 * pixels[idx+1] + 0.0722 * pixels[idx+2];
                }
            }

            for (let y = 0; y < targetHeight; y++) {
                monoGrid[y] = [];
                for (let x = 0; x < targetWidth; x++) {
                    const oldVal = lumaGrid[y][x];
                    const newVal = oldVal < threshold ? 0 : 255;
                    
                    // Normal mapping: black (0) = printed (1), white (255) = paper (0)
                    let isPrinted = (newVal === 0) ? 1 : 0;
                    if (isInvert) isPrinted = 1 - isPrinted;
                    monoGrid[y][x] = isPrinted;

                    // Error distribution
                    const error = oldVal - newVal;
                    if (x + 1 < targetWidth) {
                        lumaGrid[y][x+1] += error * (7/16);
                    }
                    if (y + 1 < targetHeight) {
                        if (x - 1 >= 0) {
                            lumaGrid[y+1][x-1] += error * (3/16);
                        }
                        lumaGrid[y+1][x] += error * (5/16);
                        if (x + 1 < targetWidth) {
                            lumaGrid[y+1][x+1] += error * (1/16);
                        }
                    }
                }
            }
        } else {
            // Simple thresholding
            for (let y = 0; y < targetHeight; y++) {
                monoGrid[y] = [];
                for (let x = 0; x < targetWidth; x++) {
                    const idx = (y * targetWidth + x) * 4;
                    const luma = 0.2126 * pixels[idx] + 0.7152 * pixels[idx+1] + 0.0722 * pixels[idx+2];
                    
                    let isPrinted = (luma < threshold) ? 1 : 0;
                    if (isInvert) isPrinted = 1 - isPrinted;
                    monoGrid[y][x] = isPrinted;
                }
            }
        }

        // Draw monochrome image onto preview canvas using matching thermal paper styles
        // Dark charcoal ink on receipt paper background
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const idx = (y * targetWidth + x) * 4;
                const isPrinted = monoGrid[y][x];
                
                // Color mapping: printed = #1c1917 (28, 25, 23), white = #faf9f5 (250, 249, 245)
                const r = isPrinted ? 28 : 250;
                const g = isPrinted ? 25 : 249;
                const b = isPrinted ? 23 : 245;

                pixels[idx] = r;
                pixels[idx+1] = g;
                pixels[idx+2] = b;
                pixels[idx+3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);

        // Cache this finished canvas in offscreen state for printer simulation
        processedCanvas = document.createElement('canvas');
        processedCanvas.width = targetWidth;
        processedCanvas.height = targetHeight;
        processedCanvas.getContext('2d').putImageData(imgData, 0, 0);

        // Enable simulation button
        btnPrintSim.disabled = false;

        // 3. Compile bit blocks row-by-row for Psion Printer II (8 vertical pixels mapped to 1 byte per column)
        const rowBase64Strings = [];
        let totalRawBytes = 0;
        let totalCompBytes = 0;

        // Compute horizontal alignment padding (left margins)
        let paddingLeft = 0;
        if (alignCentre.checked) {
            paddingLeft = Math.floor((256 - targetWidth) / 2);
        } else if (alignRight.checked) {
            paddingLeft = 256 - targetWidth;
        }

        for (let blockY = 0; blockY < targetHeight; blockY += 8) {
            const rowBytes = [];
            
            // Add left margin padding bytes (blank spaces)
            for (let p = 0; p < paddingLeft; p++) {
                rowBytes.push(0);
            }

            for (let x = 0; x < targetWidth; x++) {
                let byteVal = 0;
                // Top pixel (blockY+0) = MSB (128) -> Bottom pixel (blockY+7) = LSB (1)
                if (monoGrid[blockY + 0] && monoGrid[blockY + 0][x]) byteVal |= 128;
                if (monoGrid[blockY + 1] && monoGrid[blockY + 1][x]) byteVal |= 64;
                if (monoGrid[blockY + 2] && monoGrid[blockY + 2][x]) byteVal |= 32;
                if (monoGrid[blockY + 3] && monoGrid[blockY + 3][x]) byteVal |= 16;
                if (monoGrid[blockY + 4] && monoGrid[blockY + 4][x]) byteVal |= 8;
                if (monoGrid[blockY + 5] && monoGrid[blockY + 5][x]) byteVal |= 4;
                if (monoGrid[blockY + 6] && monoGrid[blockY + 6][x]) byteVal |= 2;
                if (monoGrid[blockY + 7] && monoGrid[blockY + 7][x]) byteVal |= 1;
                rowBytes.push(byteVal);
            }
            
            totalRawBytes += rowBytes.length;

            // Simplify row RLE if runs > 85 to ensure Base64 string is <= 255 chars
            const optimizedRowBytes = simplifyRow(rowBytes, 85);

            // Compress to RLE
            const rowRleBytes = [];
            let i = 0;
            while (i < optimizedRowBytes.length) {
                let runLength = 1;
                while (i + runLength < optimizedRowBytes.length && optimizedRowBytes[i + runLength] === optimizedRowBytes[i] && runLength < 255) {
                    runLength++;
                }
                rowRleBytes.push(runLength);
                rowRleBytes.push(optimizedRowBytes[i]);
                i += runLength;
            }

            totalCompBytes += rowRleBytes.length;

            // Convert row RLE bytes to Base64
            let rowBinaryString = "";
            for (let k = 0; k < rowRleBytes.length; k++) {
                rowBinaryString += String.fromCharCode(rowRleBytes[k]);
            }
            rowBase64Strings.push(btoa(rowBinaryString));
        }

        // Generate compiled OPL procedure block using the row-by-row array
        generateCleanOpl(rowBase64Strings);

        // Update stats
        const savings = ((1 - (totalCompBytes / totalRawBytes)) * 100).toFixed(1);

        statDimensions.textContent = `${targetWidth} x ${targetHeight} px`;
        statRawSize.textContent = `${totalRawBytes} bytes`;
        statCompSize.textContent = `${totalCompBytes} bytes`;
        statSavings.textContent = `${savings}%`;
        
        receiptMeta.textContent = `W:${targetWidth} H:${targetHeight} Raw:${totalRawBytes}B RLE:${totalCompBytes}B`;
    }

    // Build the OPL Procedure
    function generateCleanOpl(rowBase64Strings) {
        let opl = "COMPRUN:\n";
        opl += "  ONERR errLab::\n";
        opl += "  PRINT \"Printing RLE...\"\n\n";

        for (let r = 0; r < rowBase64Strings.length; r++) {
            opl += "  PRRLE:(\"" + rowBase64Strings[r] + "\")\n";
        }
        
        opl += "\n  PRINT \"Done.\"\n";
        opl += "  GET\n";
        opl += "  RETURN\n\n";
        opl += "errLab::\n";
        opl += "  ONERR OFF\n";
        opl += "  CLS\n";
        opl += "  PRINT \"ERROR:\",ERR\n";
        opl += "  PRINT \"Press key...\"\n";
        opl += "  GET\n\n";

        oplOutput.value = opl;
    }

    // Print Simulation
    btnPrintSim.addEventListener('click', simulatePrinting);

    function simulatePrinting() {
        if (!processedCanvas) return;
        
        // Disable button during sim
        btnPrintSim.disabled = true;
        
        // Reset and trigger receipt feed animation
        receiptPaper.classList.remove('printing-anim');
        void receiptPaper.offsetWidth; // Force CSS reflow
        receiptPaper.classList.add('printing-anim');
        
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        
        // Fill canvas with plain paper color
        ctx.fillStyle = '#faf9f5';
        ctx.fillRect(0, 0, width, height);
        
        let currentY = 0;
        const sliceHeight = 8; // 8-pixel tall columns/slices (native print buffer height)
        
        function printNextSlice() {
            if (currentY >= height) {
                // Done printing
                btnPrintSim.disabled = false;
                showToast('Print simulation complete!', 'fa-circle-check');
                return;
            }
            
            // Draw horizontal slice from the processed buffer
            ctx.drawImage(
                processedCanvas,
                0, currentY, width, sliceHeight, // Source slice
                0, currentY, width, sliceHeight  // Destination slice
            );
            
            currentY += sliceHeight;
            
            // Auto scroll thermal receipt container to bottom
            const wrapper = receiptPaper.parentElement;
            wrapper.scrollTop = wrapper.scrollHeight;
            
            // Queue next line (simulates real printhead scan speed)
            setTimeout(printNextSlice, 50);
        }
        
        printNextSlice();
    }

    // Static OPL Decoder Engine (PRRLE) - accepts single RLE string, fully self-contained
    const prrleCode = `PRRLE:(b64$)
  REM By NFfP Rev 0.3
  LOCAL s$(255)
  LOCAL bLen%,i%,c1%,c2%,c3%,c4%,a%,addr%
  LOCAL b1%,b2%,b3%,vB%,p%,limit%,k%,b%,temp%
  LOCAL gSt%,gCnt%,oIdx%,out%(128),outAddr%
  s$=b64$
  addr%=ADDR(s$)
  bLen%=PEEKB(addr%)
  outAddr%=ADDR(out%())
  oIdx%=0
  gSt%=0
  gCnt%=0
  i%=1

  WHILE i%<=bLen%
    a%=PEEKB(addr%+i%)
    IF a%>=65 AND a%<=90
      c1%=a%-65
    ELSEIF a%>=97 AND a%<=122
      c1%=a%-71
    ELSEIF a%>=48 AND a%<=57
      c1%=a%+4
    ELSEIF a%=43
      c1%=62
    ELSE
      c1%=63
    ENDIF

    a%=PEEKB(addr%+i%+1)
    IF a%>=65 AND a%<=90
      c2%=a%-65
    ELSEIF a%>=97 AND a%<=122
      c2%=a%-71
    ELSEIF a%>=48 AND a%<=57
      c2%=a%+4
    ELSEIF a%=43
      c2%=62
    ELSE
      c2%=63
    ENDIF

    b1%=c1%*4+INT(c2%/16)

    limit%=3
    IF PEEKB(addr%+i%+2)=61
      limit%=1
    ELSEIF PEEKB(addr%+i%+3)=61
      limit%=2
      a%=PEEKB(addr%+i%+2)
      IF a%>=65 AND a%<=90
        c3%=a%-65
      ELSEIF a%>=97 AND a%<=122
        c3%=a%-71
      ELSEIF a%>=48 AND a%<=57
        c3%=a%+4
      ELSEIF a%=43
        c3%=62
      ELSE
        c3%=63
      ENDIF
      temp%=c2%*16+INT(c3%/4)
      b2%=temp%-INT(temp%/256)*256
    ELSE
      a%=PEEKB(addr%+i%+2)
      IF a%>=65 AND a%<=90
        c3%=a%-65
      ELSEIF a%>=97 AND a%<=122
        c3%=a%-71
      ELSEIF a%>=48 AND a%<=57
        c3%=a%+4
      ELSEIF a%=43
        c3%=62
      ELSE
        c3%=63
      ENDIF

      a%=PEEKB(addr%+i%+3)
      IF a%>=65 AND a%<=90
        c4%=a%-65
      ELSEIF a%>=97 AND a%<=122
        c4%=a%-71
      ELSEIF a%>=48 AND a%<=57
        c4%=a%+4
      ELSEIF a%=43
        c4%=62
      ELSE
        c4%=63
      ENDIF

      temp%=c2%*16+INT(c3%/4)
      b2%=temp%-INT(temp%/256)*256
      temp%=c3%*64+c4%
      b3%=temp%-INT(temp%/256)*256
    ENDIF

    k%=1
    WHILE k%<=limit%
      IF k%=1
        b%=b1%
      ELSEIF k%=2
        b%=b2%
      ELSE
        b%=b3%
      ENDIF

      IF gSt%=0
        gCnt%=b%
        gSt%=1
      ELSE
        vB%=b%
        gSt%=0
        p%=1
        WHILE p%<=gCnt%
          POKEB outAddr%+oIdx%,vB%
          oIdx%=oIdx%+1
          p%=p%+1
        ENDWH
      ENDIF
      k%=k%+1
    ENDWH
    i%=i%+4
  ENDWH

  IF oIdx%>0
    GPRINT:(oIdx%,outAddr%)
    KEY
  ENDIF`;

    // Populate static decoder field on load
    decoderOutput.value = prrleCode;

    // Action: Copy COMPRUN to Clipboard
    btnCopy.addEventListener('click', () => {
        if (!oplOutput.value) {
            showToast('No code generated yet!', 'fa-exclamation-triangle');
            return;
        }
        
        navigator.clipboard.writeText(oplOutput.value)
            .then(() => {
                showToast('COMPRUN Script copied!', 'fa-copy');
            })
            .catch(err => {
                showToast('Failed to copy code.', 'fa-times');
                console.error(err);
            });
    });

    // Action: Copy Static Decoder to Clipboard
    btnCopyDecoder.addEventListener('click', () => {
        navigator.clipboard.writeText(prrleCode)
            .then(() => {
                showToast('PRRLE Decoder copied!', 'fa-copy');
            })
            .catch(err => {
                showToast('Failed to copy decoder.', 'fa-times');
                console.error(err);
            });
    });

    // Action: Download OPL File
    btnDownload.addEventListener('click', () => {
        if (!oplOutput.value) {
            showToast('No code generated yet!', 'fa-exclamation-triangle');
            return;
        }
        
        const blob = new Blob([oplOutput.value], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'COMPRUN.OPL';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast('COMPRUN.OPL downloaded!', 'fa-file-arrow-down');
    });

    // Initialize with first preset
    loadPreset(generateLogoPreset, presetLogo);
});
