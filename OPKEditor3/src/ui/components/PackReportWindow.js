class PackReportWindow {
    constructor() {
        this.element = null;
        this.content = null;
        this.init();
    }

    init() {
        // Create main container
        this.element = document.createElement('div');
        this.element.id = 'pack-report-window';
        this.element.style.cssText = `
            position: fixed;
            top: 100px;
            right: 100px;
            width: 800px;
            height: 600px;
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            display: none;
            flex-direction: column;
            resize: both;
            overflow: hidden;
            border-radius: 4px;
        `;

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            background-color: var(--status-bar-bg);
            color: white;
            padding: 5px 10px;
            cursor: move;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            flex-shrink: 0;
        `;
        titleBar.innerHTML = '<span>Pack Summary Report</span><div class="controls" style="display:flex; align-items:center;">' +
            '<i class="fas fa-copy copy-btn" title="Copy to Clipboard" style="cursor:pointer; font-size:14px; margin-right:15px;"></i>' +
            '<span class="close-btn" style="cursor:pointer; font-size:16px;">&times;</span>' +
            '</div>';

        // Add copy listener
        titleBar.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyToClipboard();
        });

        // Content area
        this.content = document.createElement('div');
        this.content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.4;
        `;

        this.element.appendChild(titleBar);
        this.element.appendChild(this.content);
        document.body.appendChild(this.element);

        // Events for window drag/close
        titleBar.querySelector('.close-btn').addEventListener('click', () => {
            this.element.style.display = 'none';
        });

        // Window dragging logic
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('close-btn') || e.target.classList.contains('copy-btn')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                this.element.style.left = `${initialLeft + dx}px`;
                this.element.style.top = `${initialTop + dy}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    open(pack) {
        if (!pack) return;
        this.element.style.display = 'flex';
        try {
            this.generateReport(pack);
        } catch (e) {
            console.error(e);
            this.content.innerHTML = `<div style="color:red; padding:20px;"><h3>Error generating report</h3><pre>${e.stack}</pre></div>`;
        }
    }

    generateReport(pack) {
        if (typeof OPLDecompiler === 'undefined') {
            this.content.innerHTML = "Error: OPLDecompiler not loaded.";
            return;
        }

        const decompiler = new OPLDecompiler();
        let html = "";

        // Function helpers (styles)
        const h2 = (t) => `<br><h2 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; font-size: 1.2em; color: var(--syntax-keyword);">${t}</h2>`;
        const h3 = (t) => `<br><h3 style="margin-top: 15px; font-size: 1.1em; color: var(--syntax-string);">${t}</h3>`;
        const p = (t) => `<div style="margin-bottom: 5px;">${t}</div>`;
        const tableStyle = "width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;";
        const thStyle = "border: 1px solid #666; padding: 4px; background: #333; color: white; text-align: left;";
        const tdStyle = "border: 1px solid #666; padding: 4px;";

        const timestamp = new Date().toLocaleString();
        html += `<h1 style="font-size: 1.4em; text-align: center; margin-bottom: 2rem;">Pack Summary Report</h1>`;
        html += `<div style="text-align: center; color: #888; margin-bottom: 5px;">Generated: ${timestamp}</div>`;
        html += `<div style="text-align: center; color: #888; margin-bottom: 20px;">Generated by : ${typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Unknown'}</div>`;

        // ----------------------------------------------------
        // 1. Pack Summary
        // ----------------------------------------------------
        html += h2("Pack Summary");

        let usedSpace = 0;
        let deletedSpace = 0;
        let procCount = 0;
        let dataCount = 0;

        // Collect Items
        const allItems = pack.items.filter(it => it.type !== 255); // Exclude Terminator
        const procItems = [];
        const headerItem = pack.items.find(it => it.type === -1);

        // Header Details
        let packDate = "-";
        let packSizeCode = "-";
        let packBootable = "No";
        let packEprom = "No";
        let packPaged = "No";
        let packWriteProt = "No";
        let packCopyProt = "No";
        let packFlashpack = "No";

        let packChecksum = "-";
        let capacity = 0; // Declare outside for scope access
        let extraHeaderRow = "";

        if (headerItem && headerItem.data && headerItem.data.length >= 10) {
            const h = headerItem.data;
            const code = h[1];
            capacity = code * 8192;
            const sizeInKb = code * 8;
            const paged = (h[0] & 0x04) ? " (Paged)" : " (Linear)";
            packSizeCode = `${sizeInKb} k bytes, Code ${code}${paged}`;

            // Date
            const year = 1900 + h[2];
            const month = h[3];
            const day = h[4] + 1;
            const hour = h[5];
            packDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:??`;

            const valMsb = h[6];
            const valLsb = h[7];
            const valHex = `0x${valMsb.toString(16).toUpperCase().padStart(2, '0')}${valLsb.toString(16).toUpperCase().padStart(2, '0')}`;

            // Check bit 4 (0x10) for Bootable (Active High)
            if (h[0] & 0x10) {
                packBootable = "Yes";
                extraHeaderRow = `<tr><td style="${tdStyle}">Boot Address</td><td style="${tdStyle}">${valHex}</td></tr>`;
            } else {
                packBootable = "No";
                extraHeaderRow = `<tr><td style="${tdStyle}">Frame Counter</td><td style="${tdStyle}">${valHex}</td></tr>`;
            }

            // Other Flags
            if (h[0] & 0x02) packEprom = "Yes";
            if (h[0] & 0x04) packPaged = "Yes";
            if ((h[0] & 0x08) === 0) packWriteProt = "Yes"; // Active Low
            if ((h[0] & 0x20) === 0) packCopyProt = "Yes";  // Active Low
            if ((h[0] & 0x40) === 0) packFlashpack = "Yes"; // Active Low

            packChecksum = `${h[8].toString(16).toUpperCase().padStart(2, '0')}${h[9].toString(16).toUpperCase().padStart(2, '0')}`;
        }

        // Calculate Checksums if missing
        if (!pack.checksums && typeof Checksums !== 'undefined') {
            pack.checksums = Checksums.calculate(pack.getRawData());
        }

        let sumStr = "-";
        let crcStr = "-";
        let md5Str = "-";

        if (pack.checksums) {
            sumStr = "0x" + pack.checksums.sum.toString(16).toUpperCase().padStart(8, '0');
            crcStr = "0x" + pack.checksums.crc32.toString(16).toUpperCase();
            md5Str = pack.checksums.md5.toUpperCase();
        }

        allItems.forEach(item => {
            const len = item.getLength();
            if (item.deleted) {
                deletedSpace += len;
            } else {
                usedSpace += len;
                if (item.type === 3) {
                    procCount++;
                    procItems.push(item);
                } else if (item.type === 1) {
                    dataCount++;
                }
            }
        });

        const currentSize = pack.getLength();
        let availableSpace = "Unknown";
        if (capacity > 0) {
            availableSpace = `${capacity - currentSize} bytes`;
        }

        // Determine Pack Type (Heuristic based on first item or general content)
        // Usually Device name is not stored, but Size is.
        // SizeCode is at byte 7 of inputData, but PackImage doesn't expose raw header easily.
        // We can infer from total length or PackImage properties if available.
        // PackImage doesn't store SizeCode explicitly as property, but getLength gives current size.
        // Let's assume standard Packs.

        html += `<table style="${tableStyle}">
            <tr><th style="${thStyle}">Statistic</th><th style="${thStyle}">Value</th></tr>
            <tr><td style="${tdStyle}">Pack Name</td><td style="${tdStyle}">${pack.filename || "Untitled"}</td></tr>
            <tr><td style="${tdStyle}">Pack Size (Header)</td><td style="${tdStyle}">${packSizeCode}</td></tr>
            <tr><td style="${tdStyle}">Pack Date</td><td style="${tdStyle}">${packDate}</td></tr>
            <tr><td style="${tdStyle}">Bootable</td><td style="${tdStyle}">${packBootable}</td></tr>
            ${extraHeaderRow}
            <tr><td style="${tdStyle}">Checksum (Header)</td><td style="${tdStyle}">0x${packChecksum}</td></tr>
            <tr><td style="${tdStyle}">EPROM</td><td style="${tdStyle}">${packEprom}</td></tr>
            <tr><td style="${tdStyle}">Copy Protected</td><td style="${tdStyle}">${packCopyProt}</td></tr>
            <tr><td style="${tdStyle}">Write Protected</td><td style="${tdStyle}">${packWriteProt}</td></tr>
            <tr><td style="${tdStyle}">Paged</td><td style="${tdStyle}">${packPaged}</td></tr>
            <tr><td style="${tdStyle}">Flashpack</td><td style="${tdStyle}">${packFlashpack}</td></tr>
            <tr><td style="${tdStyle}">Total Procedures</td><td style="${tdStyle}">${procCount}</td></tr>
            <tr><td style="${tdStyle}">Total Data Files</td><td style="${tdStyle}">${dataCount}</td></tr>
            <tr><td style="${tdStyle}">Used Space</td><td style="${tdStyle}">${usedSpace} bytes</td></tr>
            <tr><td style="${tdStyle}">Deleted Space</td><td style="${tdStyle}">${deletedSpace} bytes</td></tr>
            <tr><td style="${tdStyle}">Pack Size (Current)</td><td style="${tdStyle}">${pack.getLength()} bytes</td></tr>
            <tr><td style="${tdStyle}">Available Space</td><td style="${tdStyle}">${availableSpace}</td></tr>
            <tr><td style="${tdStyle}">Checksum (SUM)</td><td style="${tdStyle}">${sumStr}</td></tr>
            <tr><td style="${tdStyle}">Checksum (CRC32)</td><td style="${tdStyle}">${crcStr}</td></tr>
            <tr><td style="${tdStyle}">Checksum (MD5)</td><td style="${tdStyle}">${md5Str}</td></tr>
        </table><br>`;

        // ----------------------------------------------------
        // 2. Alphabetic List of Procedures
        // ----------------------------------------------------
        html += h2("Alphabetic List of Procedures");

        // Analyze all procedures first
        const procDetails = procItems.filter(item => !item.deleted).map(item => {
            // PackImage Structure for OPL: 
            // 1. Header Item (Type 3). item.data = [09, 03, Name(8), Term(00)]
            // Concatenate Header, Wrapper, and Body for Decompiler
            // Structure:
            // 1. item.data: Proc Header (09 03 ...)
            // 2. item.child.data: Long Record Header (02 80 Hi Lo) - The "Wrapper"
            // 3. item.child.child.data: The Body Payload

            let parts = [item.data];
            let totalLen = item.data.length;

            if (item.child) {
                // Add Wrapper Header (02 80 ...)
                if (item.child.data) {
                    parts.push(item.child.data);
                    totalLen += item.child.data.length;
                }
                // Add Body Payload
                if (item.child.child && item.child.child.data) {
                    parts.push(item.child.child.data);
                    totalLen += item.child.child.data.length;
                }
            }

            let fullData = new Uint8Array(totalLen);
            let offset = 0;
            parts.forEach(p => {
                fullData.set(p, offset);
                offset += p.length;
            });

            // Analyze
            // Pass full data, but verify if it's a Text Record (QCode Length == 0)
            let analysis = decompiler.getRawAnalysis(fullData, item.name);
            let header = analysis.header;

            // Check QCode Length at offset 15 (Standard OPL Rec Loop)
            // Structure: 11(Head) + 4(Long) = 15.
            if (fullData.length >= 17 && item.type === 3) {
                let qCodeLen = (fullData[15] << 8) | fullData[16];
                if (qCodeLen === 0) {
                    header = null; // Force Text Mode
                }
            }

            let varMap = header ? analysis.varMap : {};

            // ----------------------------------------------------
            // Unified Analysis (Params, Globals, Model, Source)
            // ----------------------------------------------------
            let params = "";
            let paramTypes = [];
            let globalsArr = [];
            let model = "LZ";
            let sourceText = "";
            let sourceSize = 0;
            let firstComment = "";
            let rawReferences = [];

            if (header) {
                // --- COMPILED PROCEDURE ---
                // 1. Params
                paramTypes = header.paramTypes;
                params = header.paramTypes.map((t, idx) => {
                    const s = t === 0 ? "%" : t === 1 ? "" : t === 2 ? "$" : "";
                    return `P${idx + 1}${s}`;
                }).join(",");

                // 2. Globals / Externals (Metadata)
                if (header.globals) globalsArr.push(...header.globals.map(g => g.name));
                if (header.externals) globalsArr.push(...header.externals.map(g => g.name));

                // 3. Model
                if (!header.isLZ) model = "CM/XP";

                // 4. Source text from Decompiler
                try {
                    const decomp = decompiler.getDecompiledData(fullData, item.name);
                    sourceText = decomp.source;
                    rawReferences = decomp.references || [];
                    sourceSize = sourceText.length;

                    const lines = sourceText.split('\n');
                    for (let line of lines) {
                        line = line.trim();
                        if (line.startsWith('REM') && !line.startsWith('REM Decompiled') && !line.startsWith('REM CM,XP') && !line.startsWith('REM LZ Variant') && !line.startsWith('REM Error')) {
                            firstComment = line.substring(3).trim();
                            break;
                        }
                    }
                } catch (e) {
                    sourceText = "Error decompiling";
                }

            } else {
                // --- OPL TEXT RECORD ---
                model = "Not Translated";

                // 1. Extract Source (Structured)
                // Structure: 11 (RecHdr) + 4 (Long) + 2 (QCodeLen) + 2 (SrcLen) = 19
                if (fullData.length > 19) {
                    let srcLen = (fullData[17] << 8) | fullData[18];
                    let startOffset = 19;
                    if (startOffset + srcLen > fullData.length) srcLen = fullData.length - startOffset;

                    let s = "";
                    for (let i = 0; i < srcLen; i++) {
                        let c = fullData[startOffset + i];
                        if (c === 0 || c === 10 || c === 13) s += "\n";
                        else if (c >= 32) s += String.fromCharCode(c);
                        else s += " ";
                    }
                    sourceText = s;
                    sourceSize = s.length;

                    // 2. Parse Params (Regex)
                    // Anchor to start of line
                    const procRegex = /(?:^|[\r\n])\s*PROC\s+([a-zA-Z0-9$%]+)\s*:\s*(?:\(([^)\r\n]+)\))?/i;
                    const match = s.match(procRegex);
                    if (match && match[2]) {
                        const pRaw = match[2];
                        params = pRaw.trim();
                        const pSplit = params.split(',');
                        pSplit.forEach(pSeg => {
                            pSeg = pSeg.trim();
                            if (pSeg.endsWith('%')) paramTypes.push(0);
                            else if (pSeg.endsWith('$')) paramTypes.push(2);
                            else paramTypes.push(1);
                        });
                    }

                    // 3. Parse Externals (Regex)
                    // Syntax: EXTERNAL var, var$ ...
                    const extRegex = /(?:^|[\r\n])\s*EXTERNAL\s+([^:\r\n]+)/gi;
                    let extMatch;
                    while ((extMatch = extRegex.exec(s)) !== null) {
                        const vars = extMatch[1].split(',');
                        vars.forEach(v => globalsArr.push(v.trim()));
                    }

                    // 4. First Comment
                    const lines = s.split(/\r?\n/);
                    for (let line of lines) {
                        let tr = line.trim();
                        if (tr.toUpperCase().startsWith('REM')) {
                            firstComment = tr.substring(3).trim();
                            break;
                        }
                    }
                } else {
                    sourceText = "Error: Invalid Record Size";
                }
            }

            let retType = "Float";
            if (item.name.endsWith('$')) retType = "String";
            else if (item.name.endsWith('%')) retType = "Integer";

            let globals = globalsArr.length > 0 ? globalsArr.join(", ") : "-";

            // Calculate CRC32 for the procedure data
            let procCrc32 = "-";
            if (typeof Checksums !== 'undefined') {
                procCrc32 = "0x" + Checksums.crc32(fullData).toString(16).toUpperCase();
            }

            let includedSource = null;
            // Note: Early return removed to allow source extraction logic below to run

            // Attempt to extract included source (if any)
            // Structure: [LenCodeHi, LenCodeLo, ...CODE..., LenSrcHi, LenSrcLo, ...SOURCE...]
            if (item.child && item.child.child && item.child.child.data) {
                const data = item.child.child.data;
                if (data.length >= 4) {
                    const lncode = (data[0] << 8) | data[1];
                    if (data.length >= lncode + 4) {
                        const lnsrc = (data[lncode + 2] << 8) | data[lncode + 3];
                        if (lnsrc > 0 && data.length >= lncode + 4 + lnsrc) {
                            let src = "";
                            const start = lncode + 4;
                            let limit = lnsrc;
                            if (limit > 0 && data[start + limit - 1] === 0) limit--;

                            for (let i = 0; i < limit; i++) {
                                const c = data[start + i];
                                src += (c === 0 ? '\n' : String.fromCharCode(c));
                            }
                            includedSource = src; // Assign to the local variable
                        }
                    }
                }
            }

            return {
                name: item.name,
                params: params,
                paramTypes: header ? header.paramTypes : [],
                retType: retType,
                globals: globals,
                model: model,
                qcodeSize: header ? header.qcodeSize : 0,
                sourceSize: sourceSize,
                firstComment: firstComment,
                source: sourceText,
                references: rawReferences,
                varMap: varMap,
                item: item,

                includedSource: includedSource,
                procCrc32: procCrc32
            };
        });

        // Sort Alphabetic
        procDetails.sort((a, b) => a.name.localeCompare(b.name));

        // Create Summary Table
        html += `<table style="${tableStyle}">
            <tr>
                <th style="${thStyle}">Signature</th>
                <th style="${thStyle}">Return Type</th>
                <th style="${thStyle}">Globals / Externals</th>
                <th style="${thStyle}">Model</th>
            </tr>`;

        procDetails.forEach(p => {
            // Construct Signature: NAME:(P1, P2%, ...)
            let sig = `${p.name}`;
            if (p.params) sig += `:(${p.params})`;
            else sig += ":";

            html += `<tr>
                <td style="${tdStyle}"><b>${sig}</b></td>
                <td style="${tdStyle}">${p.retType}</td>
                <td style="${tdStyle}">${p.globals}</td>
                <td style="${tdStyle}">${p.model}</td>
            </tr>`;
        });
        html += `</table><br>`;

        // Create Set of all Proc Names for scanning
        const allProcNames = new Set(procDetails.map(p => p.name));

        // Analyze Dependencies
        procDetails.forEach(p => {
            const refs = [];
            if (p.references) {
                p.references.forEach(refName => {
                    // Try to normalize name against existing procedures
                    let canonical = refName;
                    if (allProcNames.has(refName)) canonical = refName;
                    else if (allProcNames.has(refName.toUpperCase())) canonical = refName.toUpperCase();

                    // Add to list (include even if not in allProcNames, e.g. deleted or missing)
                    refs.push(canonical);
                });
            }
            // Dedup
            p.references = [...new Set(refs)];
        });

        // ----------------------------------------------------
        // 3. Detailed Reports
        // ----------------------------------------------------
        html += h2("Procedure Details");

        procDetails.forEach(p => {
            html += `<br><div style="border: 1px solid var(--border-color); padding: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.1);">`;

            // Header: TEST:(a,b%,c$)
            let sig = `${p.name}`;
            if (p.params) sig += `:(${p.params})`;
            else sig += ":";

            html += `<div style="font-size: 1.1em; font-weight: bold; margin-bottom: 5px; color: var(--syntax-function);">${sig}</div>`;

            if (p.firstComment) {
                html += `<div style="font-style: italic; color: #aaa; margin-bottom: 10px;">${p.firstComment}</div>`;
            } else {
                html += `<div style="font-style: italic; color: #666; margin-bottom: 10px;">(No description found)</div>`;
            }

            // Parameter List breakdown
            if (p.paramTypes.length > 0) {
                html += `<div style="margin-left: 10px; margin-bottom: 5px;"><b>Parameters:</b></div>`;
                p.paramTypes.forEach((t, i) => {
                    const pname = `P${i + 1}`;
                    let suffix = t === 0 ? "%" : t === 2 ? "$" : "";
                    let typeName = t === 0 ? "Integer" : t === 1 ? "Float" : t === 2 ? "String" : "Unknown";
                    html += `<div style="margin-left: 20px;">${pname}${suffix} - ${typeName}</div>`;
                });
            }

            html += `<div style="margin-top: 5px;"><b>Returns:</b> ${p.retType}</div>`;

            let globalsText = (p.globals === "-" || p.globals === "") ? "None" : p.globals;
            html += `<div style="margin-top: 5px;"><b>Globals / Externals:</b> ${globalsText}</div>`;

            html += `<div style="margin-top: 5px;"><b>Sizes:</b> QCode: ${p.qcodeSize} bytes, Source: ${p.sourceSize} chars</div>`;
            html += `<div style="margin-top: 5px;"><b>Checksum:</b> ${p.procCrc32} (CRC32)</div>`;

            if (p.references.length > 0) {
                html += `<div style="margin-top: 5px;"><b>List of procedures referenced:</b></div>`;
                p.references.forEach(ref => {
                    html += `<div style="margin-left: 20px;">${ref}</div>`;
                });
            }

            html += `</div>`;
        });

        // ----------------------------------------------------
        // 4. Record Summary (Data Files)
        // ----------------------------------------------------
        html += h2("Record Summary (Data Files)");

        // Find Data Files
        const dataFiles = allItems.filter(it => it.type === 1);
        if (dataFiles.length === 0) {
            html += p("No data files found.");
        } else {
            dataFiles.forEach(df => {
                // Determine File ID associated with this header
                // Header Structure: [Len][Type=1][Name...][ID]
                // ID is usually at offset 10 (PackImage.js logic)
                // Type 1 (0x81) -> data[10] is the ID.
                // Note: PackItem.data INCLUDES the visual header bytes if constructed from raw?
                // PackItem.data[1] is Type. data[10] is ID.
                const fileId = df.data[10] & 0x7f;

                // Count records with this ID (Type == ID)
                // Note: Records are items where item.type === fileId
                let recCount = 0;
                let recSize = 0;

                // Check all items
                pack.items.forEach(it => {
                    if (it.type === fileId && !it.deleted) {
                        recCount++;
                        recSize += it.getLength();
                    }
                });

                html += `<div style="margin-bottom: 10px;">
                    <div><b>Data File: ${df.name}</b> (ID: ${fileId})</div>
                    <div style="margin-left: 20px;">Header Size: ${df.getLength()} bytes</div>
                    <div style="margin-left: 20px;">Records: ${recCount} entries</div>
                    <div style="margin-left: 20px;">Total Record Size: ${recSize} bytes</div>
                 </div><br>`;
            });
        }



        // ----------------------------------------------------
        // 5. Call Tree
        // ----------------------------------------------------
        html += h2("Call Tree");

        // 1. Build Helpers
        const procMap = {};
        const inDegree = {};
        const deletedProcs = new Set();

        // Populate procMap from active details
        procDetails.forEach(p => {
            procMap[p.name] = p;
            inDegree[p.name] = 0;
        });



        pack.items.forEach((item, idx) => {
            if (item.type === 3 && item.deleted && item.name) {
                const n = item.name.trim().toUpperCase();
                deletedProcs.add(n);
            }
        });

        // 2. Calc In-Degree
        procDetails.forEach(p => {
            p.references.forEach(ref => {
                const r = ref.trim().toUpperCase(); // Normalize for map lookup if needed?
                if (inDegree.hasOwnProperty(ref)) {
                    inDegree[ref]++;
                }
            });
        });

        // 3. Recursive Render
        const visited = new Set();
        let treeHtml = `<div style="font-family: monospace; white-space: pre;">`;

        const renderNode = (name, prefix, isLast, parentChain = []) => {
            if (parentChain.includes(name)) {
                return `<div style="color:red;">${prefix}${isLast ? "`-- " : "|-- "}(Cycle: ${name})</div>`;
            }

            const p = procMap[name];
            // Handle Missing or Deleted
            if (!p) {
                const checkName = name.trim().toUpperCase();
                const isDeleted = deletedProcs.has(checkName);

                if (isDeleted) {
                    return `<div>${prefix}${isLast ? "`-- " : "|-- "}<span style="text-decoration: line-through;">${name}</span> (Deleted)</div>`;
                }
                return `<div>${prefix}${isLast ? "`-- " : "|-- "}${name} (?)</div>`;
            }

            visited.add(name);

            // Format: APROC or SUBPROC(A%)
            let disp = name;
            if (p.params) disp += `(${p.params})`;

            const connector = isLast ? "`-- " : "|-- ";
            let result = `<div>${prefix}${connector}${disp}</div>`;

            const childPrefix = prefix + (isLast ? "    " : "|   ");

            // Children
            if (p.references && p.references.length > 0) {
                p.references.forEach((ref, idx) => {
                    const lastChild = idx === p.references.length - 1;
                    result += renderNode(ref, childPrefix, lastChild, [...parentChain, name]);
                });
            }
            return result;
        };

        // 4. Render Roots (inDegree 0)
        let roots = procDetails.filter(p => inDegree[p.name] === 0);

        // If everything is a cycle, pick something
        if (roots.length === 0 && procDetails.length > 0) {
            roots = [procDetails[0]];
        }

        // Sort roots alphabetically
        roots.sort((a, b) => a.name.localeCompare(b.name));

        roots.forEach(r => {
            // Render Root Manually to avoid connector
            let disp = r.name;
            if (r.params) disp += `(${r.params})`;
            treeHtml += `<div>${disp}</div>`;
            visited.add(r.name);

            if (r.references && r.references.length > 0) {
                r.references.forEach((ref, idx) => {
                    const lastChild = idx === r.references.length - 1;
                    treeHtml += renderNode(ref, "", lastChild, [r.name]);
                });
            }

            treeHtml += `<div style="height:10px;">&nbsp;</div>`; // Spacer between trees
        });

        // 5. Render orphans/cycles not reached
        const unvisited = procDetails.filter(p => !visited.has(p.name));
        if (unvisited.length > 0) {
            treeHtml += `<div style="margin-top:10px; font-style:italic; color:#888;">-- Disconnected / Cycles --</div>`;
            // Sort unvisited
            unvisited.sort((a, b) => a.name.localeCompare(b.name));
            unvisited.forEach(u => {
                if (!visited.has(u.name)) {
                    // Render as pseudo-root
                    let disp = u.name;
                    if (u.params) disp += `(${u.params})`;
                    treeHtml += `<div>${disp}</div>`;
                    visited.add(u.name);

                    if (u.references && u.references.length > 0) {
                        u.references.forEach((ref, idx) => {
                            const lastChild = idx === u.references.length - 1;
                            treeHtml += renderNode(ref, "", lastChild, [u.name]);
                        });
                    }
                    treeHtml += `<div style="height:10px;">&nbsp;</div>`;
                }
            });
        }

        treeHtml += `</div>`;
        html += treeHtml;
        html += h2("Appendices");

        // Helper: Create Map of Name -> Params for lookup
        const paramMap = {};
        procDetails.forEach(p => {
            paramMap[p.name] = p.params ? `:(${p.params})` : ":";
        });

        const tableHeader = `<tr>
            <th style="${thStyle}">#</th>
            <th style="${thStyle}">Name</th>
            <th style="${thStyle}">Type</th>
            <th style="${thStyle}">Status</th>
            <th style="${thStyle}">Size (Bytes)</th>
        </tr>`;

        // Helper: Row Generator
        const generateRow = (item, idx) => {
            if (item.type === 255) return "";
            if (item.type === 17) return ""; // Skip records

            let status = item.deleted ? "Deleted" : "Active";
            let typeName = "";
            if (item.type === 3) typeName = "Procedure";
            else if (item.type === 1) typeName = "Data File";
            else typeName = `Type ${item.type}`;

            let dispName = item.name || "-";
            // If procedure, append signature
            if (item.type === 3 && paramMap[item.name]) {
                dispName += paramMap[item.name];
            }

            return `<tr>
                <td style="${tdStyle}">${idx + 1}</td>
                <td style="${tdStyle}"><b>${dispName}</b></td>
                <td style="${tdStyle}">${typeName}</td>
                <td style="${tdStyle}">${status}</td>
                <td style="${tdStyle}">${item.getLength()}</td>
             </tr>`;
        };

        // a) Pack Order
        html += h3("A) Pack List (Pack Order)");
        html += `<table style="${tableStyle}">${tableHeader}`;

        pack.items.forEach((item, idx) => {
            html += generateRow(item, idx);
        });
        html += `</table><br>`;

        // b) Alphabetic Order
        html += h3("B) Pack List (Alphabetic)");

        const sortedItems = [...pack.items].filter(it => it.type !== 255 && it.type !== 17).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        html += `<table style="${tableStyle}">${tableHeader}`;
        sortedItems.forEach((item, idx) => {
            html += generateRow(item, idx);
        });
        html += `</table><br>`;



        // c) Code Complexity Analysis
        html += h3("C) Code Complexity Analysis");
        html += `<table style="${tableStyle}">
            <tr>
                <th style="${thStyle}">Procedure</th>
                <th style="${thStyle}">Rating</th>
                <th style="${thStyle}">Metrics</th>
                <th style="${thStyle}">Notes</th>
            </tr>`;

        procDetails.forEach(p => {
            const complexity = this.analyzeComplexity(p);
            // Format Metrics
            const m = complexity.metrics;
            const metricsText = `IFs:${m.ifCount}, Loops:${m.loopCount}, Dp:${m.depth}, Vars:${m.varCount}, Lines:${m.effLineCount}, Stmts:${m.maxStatements}, Args:${m.callArgCount}`;

            // Determine Color
            let rowColor = "";
            let ratingColor = "color: green;";
            if (complexity.rating === "High") {
                rowColor = "background-color: rgba(255, 0, 0, 0.1);";
                ratingColor = "color: red; font-weight: bold;";
            } else if (complexity.rating === "Medium") {
                rowColor = "background-color: rgba(255, 165, 0, 0.1);";
                ratingColor = "color: darkorange; font-weight: bold;";
            }

            html += `<tr style="${rowColor}">
                <td style="${tdStyle}"><b>${p.name}</b></td>
                <td style="${tdStyle}"><span style="${ratingColor}">${complexity.rating}</span> <span style="font-size:0.8em; color:#666;">(${complexity.score.toFixed(1)})</span></td>
                <td style="${tdStyle}">${metricsText}</td>
                <td style="${tdStyle}">${complexity.notes}</td>
             </tr>`;
        });
        html += `</table><br>`;
        html += `<div style="font-size: 0.9em; color: #666; font-style: italic;">
            <b>Complexity Key:</b> 
            <span style="color:red"><b>High</b></span> (Score > 30), 
            <span style="color:darkorange"><b>Medium</b></span> (Score 10-30),
            <span style="color:green"><b>Low</b></span> (Score < 10).
            <br>
            Score = (IF:1, Loop:2, Goto:2, Depth>3:1, Globals:1, Vars:0.1, Lines:0.05, Stmts:0.1, CallArgs:0.5)
        </div><br>`;

        this.content.innerHTML = html;
    }

    analyzeComplexity(proc) {
        // Prefer original source if attached (e.g. from project file), else decompiled
        // Checks: 1. proc.item.source (Project specific) 2. proc.includedSource (Binary Embedded) 3. proc.source (Decompiled)
        let source = (proc.item && proc.item.source) ? proc.item.source : null;
        let isDecompiled = false;
        if (!source && proc.includedSource) {
            source = proc.includedSource;
        } else if (!source) {
            source = proc.source || "";
            isDecompiled = true;
        }

        const lines = source.split('\n');

        let ifCount = 0;
        let loopCount = 0;
        let gotoCount = 0;
        let condComplexity = 0;
        let maxDepth = 0;
        let commentCount = 0;
        let maxStatements = 0;
        let callArgCount = 0;

        // Scan Source for Control Flow & Complexity
        lines.forEach(line => {
            const trimmed = line.trim().toUpperCase();

            // Check for REM (Comment)
            if (trimmed.startsWith('REM')) {
                // If decompiled, ignore "generated" comments if possible?
                // But generally, users want to exclude ALL REMs from complexity penalties.
                // However, they also DON'T want decompiled REMs to count as "Good Documentation".
                // Decompiled REMs are usually: "REM Procedure compiled..."
                // Logic: If isDecompiled is true, and it looks like a header comment, maybe ignore it for 'commentCount'?
                // Actually, user said: "The REMS I think are being counted from decompiled... especially for the REM count... they should not count really (though leave them for the moment."
                // Wait, "leave them for the moment" suggests NOT changing it yet?
                // BUT "It's still pulling from decompiled... specially for the REM count... they should not count really".
                // Safest bet: Prefer included source (Done).
                // If using decompiled source, try to detect "REM Procedure..." and NOT count it as a "positive" comment?
                if (isDecompiled && trimmed.includes("PROCEDURE")) {
                    // Ignore standard decompiler header from positivity
                } else {
                    commentCount++;
                }
                return; // Don't analyze comments for complexity
            }

            // Indentation Depth (2 spaces per level)
            const leadingSpaces = line.match(/^\s*/)[0].length;
            const depth = Math.floor(leadingSpaces / 2);
            if (depth > maxDepth) maxDepth = depth;

            // Statement Density (Split by " : " for robustness)
            // OPL allows " : " separator.
            const statements = line.split(' : ');
            if (statements.length > maxStatements) maxStatements = statements.length;

            // IF / ELSEIF Count
            if (trimmed.startsWith('IF ') || trimmed.startsWith('ELSEIF ')) {
                ifCount++;
            }

            // Loop Count
            if (trimmed.startsWith('DO') || trimmed.startsWith('WHILE ')) {
                loopCount++;
            }

            // GOTO Count
            if (trimmed.includes('GOTO ')) {
                gotoCount++;
            }

            // Conditional Complexity (AND/OR/NOT in control statements)
            if (/^(IF|ELSEIF|WHILE|UNTIL)\b/.test(trimmed)) {
                const ands = (trimmed.match(/\bAND\b/g) || []).length;
                const ors = (trimmed.match(/\bOR\b/g) || []).length;
                const nots = (trimmed.match(/\bNOT\b/g) || []).length;
                condComplexity += (ands + ors + nots);
            }

            // Procedure Call Arguments (Coupling)
            // Syntax: NAME:(ARGS)
            // Exclude Definition: PROC NAME:(ARGS)
            if (!trimmed.startsWith("PROC") && !trimmed.startsWith("EXTERNAL")) {
                // Remove string literals to avoid counting commas inside strings
                // Simple approach: replace "..." with ""
                const cleanLine = line.replace(/"[^"]*"/g, '');

                // Find pattern: WORD:(...)
                const callRegex = /[A-Z0-9$%]+\s*:\s*\(([^)]+)\)/gi;
                let match;
                while ((match = callRegex.exec(cleanLine)) !== null) {
                    const args = match[1];
                    // Count commas + 1
                    const count = args.split(',').length;
                    callArgCount += count;
                }
            }
        });

        // Variable Count (Params + Locals)
        // proc.varMap is available if we updated the map above
        let varCount = 0;
        if (proc.varMap) {
            // Count locals
            Object.values(proc.varMap).forEach(v => {
                if (v.isLocal || v.isParam) varCount++;
            });
        }
        // Fallback if varMap missing or empty (e.g. analysis failed) check Params+
        if (varCount === 0) varCount = proc.paramTypes.length;

        // Global/External Usage
        // Check formatted string "A, B%" or "-"
        const globalCount = (proc.globals === "-" || proc.globals === "") ? 0 : proc.globals.split(',').length;

        // Distinct Calls
        const callCount = proc.references ? proc.references.length : 0;

        // Effective Line Count (Total - Comments)
        const effLineCount = Math.max(0, lines.length - commentCount);

        // Analyze Rating (Weighted Scoring System)
        // Base Score: 0
        let score = 0;

        score += (ifCount * 1.0);           // Decisions
        score += (loopCount * 2.0);         // Cycles (Harder to trace)
        score += (gotoCount * 2.0);         // Jumps (Spaghetti risk)
        score += (condComplexity * 0.5);    // Complex bools
        score += (Math.max(0, maxDepth - 3) * 1.0); // Deep nesting penalty

        score += (globalCount * 1.0);       // State dependency
        score += (varCount * 0.1);          // Low impact state
        score += (callCount * 0.2);         // Dependencies
        score += (callArgCount * 0.5);      // Loose/Tight Coupling

        score += (effLineCount * 0.05);     // Size penalty (20 lines = 1 pt)
        score += (maxStatements * 0.1);     // Dense code penalty

        let rating = "Low";
        if (score > 30) rating = "High";
        else if (score >= 10) rating = "Medium";

        return {
            rating: rating,
            score: score,
            metrics: {
                ifCount,
                loopCount,
                depth: maxDepth,
                gotoCount,
                globalCount,
                varCount,
                lineCount: lines.length,
                effLineCount,
                callCount,
                condComplexity,
                maxStatements,
                callArgCount
            },
            notes: `REMs: ${commentCount}`
        };
    }

    copyToClipboard() {
        if (!this.content) return;

        // Simple plain text conversion
        // For better results we might want to clean up.
        // Or just let user copy HTML by selecting.
        // But the requirement implies a "Copy" button.
        // We'll use innerText which preserves some formatting (newlines).
        const text = this.content.innerText;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                const btn = this.element.querySelector('.copy-btn');
                const orig = btn.style.color;
                btn.style.color = 'lime';
                setTimeout(() => btn.style.color = orig, 1000);
            }).catch(err => console.error(err));
        }
    }
}
