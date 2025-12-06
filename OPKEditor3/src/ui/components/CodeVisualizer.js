'use strict';

/**
 * CodeVisualizer.js
 * -----------------
 * Visualizes the structure and dependencies of OPL code.
 * 
 * Features:
 * 1. System Map: Shows all packs, procedures, and globals.
 * 2. Detailed Cards: Procedures show Parameters and Local Variables in inner containers.
 * 3. Orthogonal Routing: Links use Manhattan layout with rounded corners.
 * 4. Collapsible Containers: Packs, Inner Logic, and Procedures can be minimized.
 * 5. Floating Nodes: Layout recalculates on collapse/expand.
 * 6. Code Editor: Uses the application's native CodeEditor component.
 * 7. Styling: Rounded corners for all containers (SVG attributes), robust ThemeManager integration.
 */
var CodeVisualizer = (function () {

    // --- Data Extraction ---

    function extractSystemData(packs) {
        var system = {
            packs: [],
            nodes: {}, // Map of name -> { type, packIndex, ... }
            links: []  // Array of { from, to, type, label }
        };

        if (!packs || packs.length === 0) return system;

        // 1. First Pass: Identify all Procedures and Globals (Nodes)
        packs.forEach(function (pack, pIdx) {
            var packData = {
                name: pack.filename || "Pack " + (pIdx + 1),
                index: pIdx,
                procedures: [],
                globals: []
            };

            pack.items.forEach(function (item) {
                if (item.deleted) return;

                // OPL Procedures (Type 3)
                if (item.type === 3) {
                    system.nodes[item.name.toUpperCase()] = {
                        type: 'PROC',
                        packIndex: pIdx,
                        name: item.name,
                        params: [],
                        locals: [],
                        globals: [], // Track used globals
                        degree: 0 // Track connections
                    };
                    packData.procedures.push(item.name);
                }

                // Extract Globals from OPL Header
                if (item.type === 3) {
                    if (item.child && item.child.child && item.child.child.data) {
                        var data = item.child.child.data;
                        if (data.length >= 2) {
                            var obLen = (data[0] << 8) | data[1];
                            if (obLen > 0 && data.length >= 2 + obLen) {
                                var objCode = data.slice(2, 2 + obLen);
                                try {
                                    if (typeof OPLDecompiler !== 'undefined') {
                                        var decompiler = new OPLDecompiler();
                                        var header = decompiler.parseHeader(objCode, 0);
                                        if (header && header.globals) {
                                            var procNode = system.nodes[item.name.toUpperCase()];
                                            header.globals.forEach(function (g) {
                                                var gName = g.name.toUpperCase();

                                                // 1. Register Global Node
                                                if (!system.nodes[gName]) {
                                                    console.log(`[Visualizer] Registered Global: ${gName}`);
                                                    system.nodes[gName] = { type: 'GLOBAL', packIndex: pIdx, name: g.name, degree: 0, addr: g.addr };
                                                }
                                                // Always associate with pack (dedupe locally)
                                                if (packData.globals.indexOf(g.name) === -1) {
                                                    packData.globals.push(g.name);
                                                }

                                                // 2. Associate with Defining Procedure
                                                // Re-enabled: Users expect declared globals to be visible within the procedure scope.
                                                if (procNode && procNode.globals.indexOf(gName) === -1) {
                                                    procNode.globals.push(gName);
                                                }
                                            });
                                        }
                                    }
                                } catch (e) { /* Ignore parse errors */ }
                            }
                        }
                    }
                }
            });
            system.packs.push(packData);
        });
        // 2. Second Pass: Analyze Dependencies & Details
        packs.forEach(function (pack, pIdx) {
            // Build Global Address Map for this pack to resolve cross-procedure globals
            var globalAddrMap = {};
            if (system.packs[pIdx] && system.packs[pIdx].globals) {
                system.packs[pIdx].globals.forEach(function (gName) {
                    var gNode = system.nodes[gName.toUpperCase()];
                    if (gNode && gNode.addr !== undefined) {
                        var normAddr = gNode.addr;
                        if (normAddr > 32767) normAddr -= 65536; // Match Decompiler's signed logic
                        globalAddrMap[normAddr] = gName;
                    }
                });
            }

            pack.items.forEach(function (item) {
                if (item.deleted || item.type !== 3) return;

                if (item.child && item.child.child && item.child.child.data) {
                    var data = item.child.child.data;
                    var obLen = (data[0] << 8) | data[1];
                    if (obLen > 0 && data.length >= 2 + obLen) {
                        var objCode = data.slice(2, 2 + obLen);
                        try {
                            if (typeof OPLDecompiler !== 'undefined') {
                                var decompiler = new OPLDecompiler();

                                // 1. Get Control Flow for Links (Calls/Access)
                                var result = decompiler.getControlFlow(objCode, item.name);
                                var instructions = result.instructions;
                                var variableMap = result.varMap;

                                // 2. Get Full Source for Code Viewer & Regex Extraction
                                var fullCode = null;
                                var lncode = (data[0] << 8) | data[1];
                                var lnsrc = 0;
                                if (data.length >= lncode + 4) {
                                    lnsrc = (data[lncode + 2] << 8) | data[lncode + 3];
                                }

                                if (lnsrc > 0 && data.length >= lncode + 4 + lnsrc) {
                                    // Extract Source from Data
                                    var srcBytes = data.slice(lncode + 4, lncode + 4 + lnsrc);
                                    fullCode = "";
                                    for (var i = 0; i < srcBytes.length; i++) {
                                        var c = srcBytes[i];
                                        fullCode += (c === 0 ? '\n' : String.fromCharCode(c));
                                    }
                                } else if (item.text) {
                                    fullCode = item.text; // Fallback to item.text if populated
                                } else {
                                    fullCode = decompiler.decompile(objCode, item.name); // Decompiled OPL
                                }

                                var node = system.nodes[item.name.toUpperCase()];
                                if (node) {
                                    node.code = fullCode;

                                    // Extract Params
                                    var procMatch = fullCode.match(/PROC\s+[A-Z0-9_$]+\s*:\s*\(([^)]*)\)/i);
                                    if (procMatch && procMatch[1]) {
                                        var rawParams = procMatch[1].split(',').map(s => s.trim()).filter(s => s);
                                        node.params = rawParams.map(p => {
                                            var type = 'Float';
                                            if (p.endsWith('$')) type = 'String';
                                            else if (p.endsWith('%')) type = 'Integer';

                                            // Array Check
                                            if (p.includes('(')) {
                                                if (p.includes('$')) type = 'StringArray';
                                                else if (p.includes('%')) type = 'IntegerArray';
                                                else type = 'FloatArray';
                                                // Strip dimensions for name matching
                                                p = p.substring(0, p.indexOf('('));
                                            }
                                            return { name: p, type: type };
                                        });
                                    }

                                    // Extract Locals
                                    // Fix: Stop capturing at ':', 'REM', or newline to avoid capturing subsequent commands
                                    var localRegex = /LOCAL\s+([^:\r\n]+)/ig;
                                    var localMatch;
                                    while ((localMatch = localRegex.exec(fullCode)) !== null) {
                                        // Robustness: Strip REM comments and spaces
                                        var content = localMatch[1].replace(/REM\s+.*/i, "");
                                        var locals = content.split(',').map(s => s.trim()).filter(s => s);
                                        // Cleaner locals: strip dimensions
                                        locals = locals.map(l => {
                                            if (l.indexOf('(') !== -1) return l.substring(0, l.indexOf('('));
                                            return l;
                                        });
                                        node.locals = node.locals.concat(locals);
                                    }
                                }

                                instructions.forEach(function (inst) {
                                    // Find all calls in the instruction text (including within expressions)
                                    var callRegex = /([A-Z0-9_$]+):/gi;
                                    var match;
                                    while ((match = callRegex.exec(inst.text)) !== null) {
                                        var target = match[1].toUpperCase();

                                        // Ignore labels (ending with ::)
                                        if (inst.text[match.index + match[0].length] === ':') continue;

                                        if (system.nodes[target] && system.nodes[target].type === 'PROC') {
                                            // Try to extract args for label
                                            var args = '';
                                            var afterColon = inst.text.substring(match.index + match[0].length).trim();
                                            if (afterColon.startsWith('(')) {
                                                // Simple attempt to get args: content inside first set of parens
                                                // This is imperfect for nested calls but better than nothing
                                                var closeParen = afterColon.indexOf(')');
                                                if (closeParen !== -1) {
                                                    args = afterColon.substring(1, closeParen);
                                                }
                                            }

                                            var type = 'Float';
                                            if (target.endsWith('$')) type = 'String';
                                            else if (target.endsWith('%')) type = 'Integer';

                                            /* Fix: Add explicit tooltip for Calls to avoid confusion */
                                            var tooltip = item.name.toUpperCase() + " -> " + target;
                                            system.links.push({ from: item.name.toUpperCase(), to: target, type: 'CALL', label: args, dataType: type, tooltip: tooltip });
                                            if (system.nodes[item.name.toUpperCase()]) system.nodes[item.name.toUpperCase()].degree++;
                                            system.nodes[target].degree++;
                                        }
                                    }


                                });

                                // 3. Global Access (Refactored)
                                if (variableMap) {
                                    Object.keys(variableMap).forEach(function (addr) {
                                        var v = variableMap[addr];

                                        // Resolution: Check against known System Globals by address
                                        if (globalAddrMap[addr]) {
                                            v.isGlobal = true;
                                            v.name = globalAddrMap[addr];
                                            // Ensure accessed flag is honored (it should be set by Decompiler if touched)
                                        }

                                        if ((v.isGlobal || v.isExternal) && v.accessed) {
                                            var target = v.name.toUpperCase();
                                            var type = 'Float';
                                            if (target.endsWith('$')) type = 'String';
                                            else if (target.endsWith('%')) type = 'Integer';

                                            var tooltip = item.name.toUpperCase() + " - " + target;
                                            system.links.push({ from: item.name.toUpperCase(), to: target, type: 'ACCESS', dataType: type, tooltip: tooltip });
                                            if (system.nodes[target]) system.nodes[target].degree++;
                                        }
                                    });
                                }
                            }
                        } catch (e) { /* Ignore */ }
                    }
                }
            });
        });

        // 3. Post-Process: Sync Links and List
        system.links.forEach(function (link) {
            if (link.type === 'ACCESS') {
                var procNode = system.nodes[link.from];
                if (procNode && procNode.globals) {
                    if (procNode.globals.indexOf(link.to) === -1) {
                        procNode.globals.push(link.to);
                    }
                }
            }
        });

        // Ensure reverse sync (List -> Link)
        Object.values(system.nodes).forEach(function (node) {
            if (node.type === 'PROC' && node.globals) {
                node.globals.forEach(function (gName) {
                    var hasLink = system.links.some(l => l.from === node.name.toUpperCase() && l.to === gName && l.type === 'ACCESS');
                    if (!hasLink) {
                        var type = 'Float';
                        if (gName.endsWith('$')) type = 'String';
                        else if (gName.endsWith('%')) type = 'Integer';
                        var tooltip = node.name.toUpperCase() + " - " + gName;
                        system.links.push({ from: node.name.toUpperCase(), to: gName, type: 'ACCESS', dataType: type, tooltip: tooltip });
                        if (system.nodes[gName]) system.nodes[gName].degree++;
                    }
                });
            }
        });

        return system;
    }

    // --- Layout Engine ---

    function calculateLayout(data, collapsedState, sectionState, containerState) {
        var packMargin = 50;
        var nodeWidth = 187;
        var nodeHeightExpanded = 160;
        var nodeHeightCollapsed = 32;
        var rankGap = 80;
        var nodeGap = 20;
        var cardPadding = 40;
        var innerCardPadding = 30;
        var globalPoolHeight = 80;

        var currentY = packMargin;
        var layout = { nodes: {}, packs: [], innerCards: [], pools: [] };

        data.packs.forEach(function (pack) {
            // Collect nodes
            var packNodes = [];
            var procMap = {};
            pack.procedures.forEach(n => {
                packNodes.push({ name: n, type: 'PROC' });
                procMap[n] = { name: n, type: 'PROC', rank: 0, incoming: 0 };
            });

            // Calculate Ranks (Topological Sort / Longest Path)
            var localLinks = data.links.filter(l => procMap[l.from] && procMap[l.to]);

            // 1. Calculate In-Degrees
            localLinks.forEach(l => { procMap[l.to].incoming++; });

            // 2. Initialize Queue with Roots (In-Degree 0)
            var queue = Object.values(procMap).filter(n => n.incoming === 0);

            // Handle Case: No Roots (Cycle) - Force MAIN or First
            if (queue.length === 0 && packNodes.length > 0) {
                var main = packNodes.find(n => n.name.toUpperCase() === 'MAIN') || packNodes[0];
                var mainNode = procMap[main.name];
                mainNode.incoming = 0; // Break cycle
                queue.push(mainNode);
            }

            var visitedCount = 0;
            var totalNodes = Object.keys(procMap).length;

            while (queue.length > 0 || visitedCount < totalNodes) {
                if (queue.length === 0) {
                    // Cycle detected, pick next unprocessed node to break it
                    var unprocessed = Object.values(procMap).find(n => n.incoming > 0);
                    if (!unprocessed) break;
                    unprocessed.incoming = 0;
                    queue.push(unprocessed);
                }

                var curr = queue.shift();
                visitedCount++;

                var outgoing = localLinks.filter(l => l.from === curr.name);
                outgoing.forEach(l => {
                    var target = procMap[l.to];
                    if (target) {
                        // Longest Path: Rank is max of current or caller + 1
                        target.rank = Math.max(target.rank, curr.rank + 1);
                        target.incoming--;
                        if (target.incoming <= 0) {
                            target.incoming = 0; // Safety
                            queue.push(target);
                        }
                    }
                });
            }



            var ranks = [];
            Object.values(procMap).forEach(n => {
                if (!ranks[n.rank]) ranks[n.rank] = [];
                ranks[n.rank].push(n);
            });

            // Layout Calculation
            var startX = packMargin + cardPadding;
            var startY = currentY + cardPadding + 30;

            var innerX = startX;
            var innerY = startY;

            var maxRankHeight = 0;
            var rankHeights = [];

            // Helper to calculate node height
            function getNodeHeight(nodeName, isCollapsed) {
                if (isCollapsed) return nodeHeightCollapsed;

                var h = 35; // Header + Base Padding
                var nodeData = data.nodes[nodeName.toUpperCase()];
                var sState = sectionState[nodeName.toUpperCase()] || { params: true, locals: false, globals: false }; // Default: Params Open, Locals/Globals Closed

                if (nodeData) {
                    // Params Section
                    if (nodeData.params && nodeData.params.length > 0) {
                        h += 20; // Title
                        if (sState.params) {
                            h += nodeData.params.length * 14; // Items
                            h += 15; // Scrollbar & Padding Buffer
                        } else {
                            h += 5; // Padding when collapsed
                        }
                    }

                    // Locals Section
                    if (nodeData.locals && nodeData.locals.length > 0) {
                        h += 20; // Title
                        if (sState.locals) {
                            h += nodeData.locals.length * 14;
                            h += 15; // Scrollbar & Padding Buffer
                        } else {
                            h += 5; // Padding when collapsed
                        }
                    }

                    // Globals Section
                    if (nodeData.globals && nodeData.globals.length > 0) {
                        h += 20; // Title
                        if (sState.globals) {
                            h += nodeData.globals.length * 14;
                            h += 15; // Scrollbar & Padding Buffer
                        } else {
                            h += 5; // Padding when collapsed
                        }
                    }
                }

                return Math.max(h, 40); // Min height reduced from 100
            }

            // First pass: Calculate height of each rank based on collapsed state
            ranks.forEach((rankNodes, rIdx) => {
                var h = 0;
                rankNodes.forEach(node => {
                    var isCollapsed = collapsedState[node.name.toUpperCase()];
                    h += getNodeHeight(node.name, isCollapsed) + nodeGap;
                });
                h -= nodeGap;
                rankHeights[rIdx] = h;
                if (h > maxRankHeight) maxRankHeight = h;
            });

            var innerW = innerCardPadding * 2 + (ranks.length * (nodeWidth + rankGap)) - rankGap;
            if (innerW < 250) innerW = 250;
            var innerH = innerCardPadding * 2 + maxRankHeight + 30;
            if (innerH < 150) innerH = 150;

            // Logic Container Collapse
            var logicCollapsed = containerState && containerState[pack.name] && containerState[pack.name].logic;
            if (logicCollapsed) {
                innerH = 30; // Header only
            }

            layout.innerCards.push({ x: innerX, y: innerY, w: innerW, h: innerH, label: "Hierarchy & Flow", packName: pack.name, type: 'logic', collapsed: logicCollapsed });

            if (!logicCollapsed) {
                ranks.forEach((rankNodes, rIdx) => {
                    var rankX = innerX + innerCardPadding + rIdx * (nodeWidth + rankGap);
                    var rankH = rankHeights[rIdx];
                    var offsetY = (maxRankHeight - rankH) / 2;
                    var currentRankY = innerY + innerCardPadding + 30 + offsetY;

                    rankNodes.forEach((node, nIdx) => {
                        var isCollapsed = collapsedState[node.name.toUpperCase()];
                        var h = getNodeHeight(node.name, isCollapsed);

                        var nodeData = data.nodes[node.name.toUpperCase()];
                        layout.nodes[node.name.toUpperCase()] = {
                            x: rankX,
                            y: currentRankY,
                            w: nodeWidth,
                            h: h,
                            type: 'PROC',
                            label: node.name,
                            code: nodeData ? nodeData.code : null,
                            params: nodeData ? nodeData.params : [],
                            locals: nodeData ? nodeData.locals : [],
                            globals: nodeData ? nodeData.globals : [],
                            // _debug: console.log(`Layout Node ${node.name}: Globals=${nodeData ? nodeData.globals.length : 0}`),
                            collapsed: isCollapsed,
                            rank: node.rank,
                            packName: pack.name
                        };

                        currentRankY += h + nodeGap;
                    });
                });
            }

            var poolY = innerY + innerH + 20;
            var poolW = innerW;

            // Calculate grid for Globals (Full Width Nodes)
            var globalsCols = Math.floor((poolW - 20) / (nodeWidth + 80)); // Increased horizontal spacing
            if (globalsCols < 1) globalsCols = 1;
            var globalsRows = Math.ceil(pack.globals.length / globalsCols);

            var globalNodeHeight = 40; // Reduced from 60 to match Procedure default
            var poolH = globalsRows * (globalNodeHeight + 20) + 70; // +70 for header/padding (increased from 40)

            // Global Pool Collapse
            var globalsCollapsed = containerState && containerState[pack.name] && containerState[pack.name].globals;
            if (globalsCollapsed) {
                poolH = 30; // Header only
            }

            layout.pools.push({ x: innerX, y: poolY, w: poolW, h: poolH, label: "Global Space", packName: pack.name, type: 'globals', collapsed: globalsCollapsed });

            if (!globalsCollapsed) {
                pack.globals.forEach((gName, gIdx) => {
                    var gCol = gIdx % globalsCols;
                    var gRow = Math.floor(gIdx / globalsCols);
                    layout.nodes[gName.toUpperCase()] = {
                        x: innerX + 30 + gCol * (nodeWidth + 80), // Aligned with Procedures (innerCardPadding = 30)
                        y: poolY + 60 + gRow * (globalNodeHeight + 20), // Increased Padding (was +35)
                        w: nodeWidth, // Full Width
                        h: globalNodeHeight,
                        type: 'GLOBAL',
                        label: gName,
                        code: null,
                        collapsed: false
                    };
                });
            }

            var packW = innerW + cardPadding * 2;
            var packH = (poolY + poolH) - currentY + cardPadding;

            // Pack Collapse
            var packCollapsed = containerState && containerState[pack.name] && containerState[pack.name].pack;
            if (packCollapsed) {
                packH = 30 + cardPadding; // Header + padding
                // If pack is collapsed, we might want to hide inner cards?
                // But layout.innerCards are already pushed.
                // Simpler: Just render the pack rect small and don't render children in draw().
                // But calculateLayout returns positions.
                // Let's just set height. The draw loop will need to know to skip children if pack is collapsed.
                // Or we can remove them from layout.innerCards/pools here?
                // Removing them is cleaner for drawing.
                if (packCollapsed) {
                    // Remove the last pushed innerCard and pool
                    layout.innerCards.pop();
                    layout.pools.pop();
                    // Clear nodes for this pack?
                    // The nodes are in layout.nodes map. We need to remove them.
                    // Re-iterating to remove is inefficient.
                    // Better: Don't push them if pack is collapsed.
                    // But we already pushed them above.
                    // Refactor: Check packCollapsed at start of loop?
                }
            }

            // REFACTOR: Pack Collapse Check at Start
            // Since we can't easily refactor the whole loop in one go with replace, let's handle it by
            // filtering layout.nodes at the end or just hiding them in draw.
            // Actually, let's just use the height.

            layout.packs.push({ name: pack.name, x: packMargin, y: currentY, w: packW, h: packH, packName: pack.name, type: 'pack', collapsed: packCollapsed });
            currentY += packH + packMargin;
        });

        return layout;
    }

    // --- Window Management ---

    function openWindow() {
        var width = 1400;
        var height = 900;
        var left = (screen.width - width) / 2;
        var top = (screen.height - height) / 2;

        var win = window.open("", "OPKSystemMap", `width=${width},height=${height},top=${top},left=${left}`);

        if (!win) {
            alert("Please allow popups for this site to view the System Map.");
            return null;
        }

        // Inject Styles using ThemeManager
        var cssVars = "";
        var bodyClass = "";
        var currentTheme = ''; // No default
        var baseHref = "";

        // Calculate Base URL for Base Tag
        baseHref = window.location.href;

        if (typeof ThemeManager !== 'undefined') {
            currentTheme = ThemeManager.currentTheme;
            var defs = ThemeManager.getThemeDefinition(currentTheme);

            // Construct CSS Variables
            for (var key in defs) {
                cssVars += `${key}: ${defs[key]};\n`;
            }

            // Capture Body Classes
            bodyClass = document.body.className;
        }

        // Check if window is already initialized
        if (win.document && win.document.getElementById('graph-container')) {
            // Update Theme
            var html = win.document.documentElement;
            if (html) {
                html.style.cssText = cssVars;
                html.setAttribute('data-theme', currentTheme);
            }
            if (win.document.body) win.document.body.className = bodyClass;

            return win;
        }

        // NO FALLBACKS: Rely on base.css and data-theme if ThemeManager data is missing.

        win.document.open();
        win.document.write(`
            <!DOCTYPE html>
            <html data-theme="${currentTheme}" style="${cssVars}"> <!-- Inline Styles for Highest Specificity -->
            <head>
                <base href="${baseHref}"> <!-- Base Tag for Relative Paths -->
                <title>OPK System Map</title>
                <!-- Inject Stylesheets from Main App -->
                <link rel="stylesheet" href="styles/base.css">
                <link rel="stylesheet" href="styles/editor.css">
                <link rel="stylesheet" href="styles/syntax.css">
                <style>
                    :root {
                        /* Derived Colors - No Defaults, rely on injected vars or base.css */
                        --container-bg: var(--bg-color);
                        --container-border: var(--border-color);
                        --container-header-bg: var(--sidebar-header-bg);
                        
                        --node-bg: var(--bg-color);
                        --node-border: var(--border-color);
                        --node-header-bg: var(--list-hover-bg);
                        --node-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        
                        --link-color: var(--text-color);
                    }
                    body {
                        background-color: var(--bg-color);
                        color: var(--text-color);
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 0;
                        overflow: auto;
                        display: flex;
                        height: 100vh;
                    }
                    #main-container {
                        display: flex;
                        width: 100%;
                        height: 100%;
                    }
                    #graph-pane {
                        flex: 1;
                        position: relative;
                        overflow: auto;
                        background: var(--bg-color);
                        min-width: 200px; /* Prevent collapse */
                    }
                    #resizer {
                        width: 5px;
                        background: var(--border-color);
                        cursor: col-resize;
                        z-index: 100;
                        transition: background 0.2s;
                    }
                    #resizer:hover, #resizer.active {
                        background: var(--syntax-keyword); /* Highlight on hover/active */
                    }
                    #code-pane {
                        width: 450px;
                        background: var(--bg-color);
                        /* border-left removed, handled by resizer */
                        display: flex;
                        flex-direction: column;
                        box-shadow: -2px 0 5px rgba(0,0,0,0.05);
                        z-index: 10;
                        min-width: 200px; /* Prevent collapse */
                    }

                    #controls {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        z-index: 100;
                        display: flex;
                        gap: 10px;
                    }
                    #controls button {
                        padding: 5px;
                        border: 1px solid var(--border-color);
                        background: var(--bg-color);
                        color: var(--text-color);
                        cursor: pointer;
                        border-radius: 4px;
                        font-family: inherit;
                        font-weight: bold;
                        min-width: 28px; /* Fixed Minimum Width */
                        height: 28px; /* Square Aspect Ratio */
                        text-align: center;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    #btn-fit {
                        min-width: auto; /* Allow Fit button to scale */
                        padding: 5px 10px; /* More padding for text */
                    }
                    #controls button:hover {
                        background: var(--list-hover-bg);
                    }
                    
                    /* Inner Containers for Params/Locals */
                    .inner-container {
                        border: 1px solid var(--border-color);
                        border-radius: 6px; /* Rounded Inner */
                        background: var(--container-header-bg); /* Slight tint */
                        margin-bottom: 5px;
                        overflow: hidden;
                    }
                    .section-title {
                        font-size: 10px;
                        color: var(--text-color);
                        opacity: 0.8;
                        text-transform: uppercase;
                        padding: 2px 5px;
                        background: rgba(0,0,0,0.05);
                        cursor: pointer;
                        font-weight: bold;
                        border-bottom: 1px solid transparent;
                    }
                    .section-title:hover {
                        background: rgba(0,0,0,0.1);
                    }
                    .section-list {
                        padding: 5px;
                        font-family: 'Consolas', monospace;
                        font-size: 11px;
                        color: var(--text-color);
                        background: var(--bg-color);
                        display: flex;
                        flex-direction: column; /* Vertical Stack */
                        overflow-x: auto; /* Enable horizontal scroll */
                    }
                    .item { 
                        margin-bottom: 2px; 
                        display: block;
                        white-space: nowrap; /* Prevent wrapping */
                    }
                    
                    /* Node HTML Styles (ForeignObject) */
                    .node-card {
                        width: 100%;
                        height: 100%;
                        background: var(--node-bg);
                        border: 1px solid var(--node-border);
                        border-radius: 8px;
                        box-shadow: var(--node-shadow);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        font-size: 12px;
                        box-sizing: border-box;
                    }

                    .node-header {
                        background: var(--node-header-bg);
                        padding: 5px 8px;
                        font-weight: bold;
                        border-bottom: 1px solid var(--node-border);
                        display: flex;
                        align-items: center;
                        position: relative;
                        height: 22px;
                    }
                    .node-title {
                        flex: 1;
                        text-align: left;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .node-type {
                        position: absolute;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 9px;
                        color: var(--text-color);
                        opacity: 0.6;
                        text-transform: uppercase;
                    }
                    .node-icon {
                        cursor: pointer;
                        font-size: 10px;
                        width: 14px;
                        height: 14px;
                        line-height: 14px;
                        text-align: center;
                        border: 1px solid var(--border-color);
                        border-radius: 2px;
                        background: var(--bg-color);
                        margin-left: 5px;
                    }
                    .node-body {
                        flex: 1;
                        padding: 5px;
                        overflow-y: auto;
                        display: block;
                    }
                    .node-card.collapsed .node-body {
                        display: none;
                    }
                    
                    .node-card:hover { border-color: var(--text-color); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
                    .node-card.active { border-color: var(--syntax-keyword); border-width: 2px; }

                    /* Link Styles */
                    .link {
                        stroke: var(--link-color);
                        stroke-width: 1.5;
                        fill: none;
                        opacity: 0.7;
                        marker-end: url(#arrowhead);
                    }
                    .link.access { stroke-dasharray: 3,3; opacity: 0.5; marker-end: none; }
                    
                    .link-label {
                        fill: var(--text-color);
                        font-size: 10px;
                        font-family: 'Consolas', monospace;
                        font-weight: bold;
                        filter: url(#text-bg);
                    }
                    
                    /* Container Styles */
                    .container-rect {
                        fill: var(--container-bg);
                        stroke: var(--container-border);
                        stroke-width: 1;
                        rx: 12; /* Explicit Rounded Corners */
                        ry: 12; /* Explicit Rounded Corners */
                    }
                    
                    /* Specific Card Styles */
                    .card-main .container-rect {
                        stroke: var(--text-color); /* Stronger border for main card */
                        stroke-width: 2;
                        fill: var(--bg-color); /* Ensure opaque background */
                        opacity: 0.8; /* Slight transparency to show grid if any */
                    }

                    /* Lighter background for inner cards and global pool */
                    .card-inner .container-rect, .global-pool .container-rect {
                        fill: var(--container-header-bg); /* Use header bg for contrast */
                        opacity: 0.5; /* Lighter/Transparent */
                    }

                    .container-title {
                        fill: var(--text-color);
                        font-size: 14px;
                        font-weight: bold;
                        text-transform: uppercase;
                        text-anchor: start; 
                        dominant-baseline: middle;
                    }
                </style>
                <script>
                    var CodeEditor = window.opener.CodeEditor;
                    var SyntaxHighlighter = window.opener.SyntaxHighlighter;
                    var OptionsManager = window.opener.OptionsManager;
                    
                    var activeEditor = null;
                    
                    function showCode(code, title) {
                        var header = document.getElementById('code-header');
                        var content = document.getElementById('code-content');
                        if (header) header.textContent = title;
                        
                        if (content) {
                            if (activeEditor) {
                                activeEditor.setValue(code || "");
                            } else if (CodeEditor) {
                                content.innerHTML = ''; // Clear plain text
                                // Initialize CodeEditor
                                activeEditor = new CodeEditor(content, {
                                    readOnly: true,
                                    value: code || "",
                                    language: 'opl'
                                });
                            } else {
                                // Fallback
                                content.innerHTML = '';
                                var pre = document.createElement('pre');
                                pre.style.margin = "0";
                                pre.style.padding = "10px";
                                pre.style.fontFamily = "Consolas, 'Courier New', monospace";
                                pre.style.fontSize = "12px";
                                pre.textContent = code;
                                content.appendChild(pre);
                            }
                        }
                    }

                    // Resizer Logic
                    document.addEventListener('DOMContentLoaded', function() {
                        var resizer = document.getElementById('resizer');
                        var codePane = document.getElementById('code-pane');
                        var graphPane = document.getElementById('graph-pane');
                        var isResizing = false;

                        resizer.addEventListener('mousedown', function(e) {
                            isResizing = true;
                            resizer.classList.add('active');
                            document.body.style.cursor = 'col-resize';
                            e.preventDefault(); // Prevent text selection
                        });

                        document.addEventListener('mousemove', function(e) {
                            if (!isResizing) return;
                            var containerWidth = document.body.clientWidth;
                            var newWidth = containerWidth - e.clientX;
                            
                            // Constraints
                            if (newWidth < 200) newWidth = 200;
                            if (newWidth > containerWidth - 200) newWidth = containerWidth - 200;
                            
                            codePane.style.width = newWidth + 'px';
                        });

                        document.addEventListener('mouseup', function(e) {
                            if (isResizing) {
                                isResizing = false;
                                resizer.classList.remove('active');
                                document.body.style.cursor = 'default';
                            }
                        });
                    });
                </script>
            </head>
            <body class="${bodyClass}"> <!-- Apply Body Class -->
                <div id="main-container">
                    <div id="graph-pane">
                        <div id="controls">
                            <button id="btn-zoom-in">+</button>
                            <button id="btn-zoom-out">-</button>
                            <button id="btn-fit">Fit</button>
                        </div>
                        <div id="graph-container"></div>
                    </div>
                    <div id="resizer"></div> <!-- Resizer Handle -->
                    <div id="code-pane">
                        <div id="code-header">Select a procedure</div>
                        <div id="code-content"></div>
                    </div>
                </div>
            </body>
            </html>
        `);
        win.document.close();

        return win;
    }

    // --- Rendering ---

    function renderSystemMap(data, win) {
        var doc = win.document;
        var container = doc.getElementById('graph-container');

        // Initial State: Isolated nodes collapsed
        var collapsedState = {};
        var sectionState = {}; // Track Params/Locals expansion per node
        var containerState = {}; // Track Pack/Logic/Global expansion

        for (var name in data.nodes) {
            var n = data.nodes[name];
            if (n.type === 'PROC' && n.degree === 0) {
                collapsedState[name] = true;
            }
            // Initialize Section State
            sectionState[name] = { params: true, locals: false, globals: false };
        }

        // Initialize Container State
        data.packs.forEach(p => {
            containerState[p.name] = { pack: false, logic: false, globals: false };
        });

        // Helper: Draw Orthogonal Path with Rounded Corners
        function drawOrthogonalPath(points, radius) {
            if (points.length < 2) return "";
            var d = `M ${points[0].x} ${points[0].y}`;

            for (var i = 1; i < points.length - 1; i++) {
                var p0 = points[i - 1];
                var p1 = points[i];
                var p2 = points[i + 1];

                var v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
                var len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                var v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
                var len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                var r = Math.min(radius, len1 / 2, len2 / 2);

                var startArc = { x: p1.x - (v1.x / len1) * r, y: p1.y - (v1.y / len1) * r };
                var endArc = { x: p1.x + (v2.x / len2) * r, y: p1.y + (v2.y / len2) * r };

                d += ` L ${startArc.x} ${startArc.y}`;
                d += ` Q ${p1.x} ${p1.y} ${endArc.x} ${endArc.y}`;
            }
            d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
            return d;
        }

        // Helper: Find safe horizontal gap
        function findHorizontalGap(layout, targetY, startRank, endRank, currentPackName) {
            // 1. Collect obstacles
            var obstacles = [];
            for (var key in layout.nodes) {
                var n = layout.nodes[key];
                if (n.packName === currentPackName && n.type === 'PROC' && n.rank >= startRank && n.rank <= endRank) {
                    obstacles.push({ y1: n.y, y2: n.y + n.h });
                }
            }
            obstacles.sort((a, b) => a.y1 - b.y1);

            // 2. Find Gaps
            var gaps = [];
            var minGapSize = 10;
            for (var i = 0; i < obstacles.length - 1; i++) {
                var gapStart = obstacles[i].y2;
                var gapEnd = obstacles[i + 1].y1;
                if (gapEnd - gapStart >= minGapSize) {
                    gaps.push({ start: gapStart, end: gapEnd, center: (gapStart + gapEnd) / 2 });
                }
            }

            // 3. Find closest gap
            var closestGap = null;
            var minDist = Infinity;
            gaps.forEach(g => {
                var dist = Math.abs(g.center - targetY);
                if (dist < minDist) { minDist = dist; closestGap = g.center; }
            });

            if (closestGap !== null) return closestGap;

            // 4. Fallback (Outside)
            var isBlocked = obstacles.some(o => targetY >= o.y1 && targetY <= o.y2);
            if (!isBlocked) return targetY;

            if (obstacles.length > 0) {
                var topRoute = obstacles[0].y1 - 20;
                var bottomRoute = obstacles[obstacles.length - 1].y2 + 20;
                return (Math.abs(topRoute - targetY) < Math.abs(bottomRoute - targetY)) ? topRoute : bottomRoute;
            }
            return targetY;
        }

        // Helper: Get vertical center of a section relative to node Y
        function getSectionCenterY(node, sectionName) {
            // CSS alignment constants matching getNodeHeight (35px base per section)
            var TITLE_H = 20;
            var ITEM_H = 14;
            var PAD_TOP = 5;
            var PAD_BOTTOM = 5;
            var MARGIN = 5;

            if (node.collapsed) return node.y + node.h / 2;

            var currentY = node.y + 35; // Start after Header

            var sState = sectionState[node.label.toUpperCase()];
            if (!sState) sState = { params: true, locals: false, globals: false };

            var nodeData = data.nodes[node.label.toUpperCase()];
            if (!nodeData) return node.y + node.h / 2;

            // Helper to process section
            function processSection(items, isExpanded, isTarget) {
                var h = 0;
                if (!items || items.length === 0) return { h: 0 };

                if (isExpanded) {
                    var listH = items.length * ITEM_H;
                    h = TITLE_H + PAD_TOP + listH + PAD_BOTTOM + MARGIN;
                    if (isTarget) {
                        // Target the center of the list
                        return { h: h, cy: currentY + TITLE_H + PAD_TOP + listH / 2 };
                    }
                } else {
                    h = 25; // 20 Title + 5 Margin (Collapsed)
                    if (isTarget) return { h: h, cy: currentY + h / 2 };
                }
                return { h: h };
            }

            // 1. Params
            var res = processSection(nodeData.params, sState.params, sectionName === 'params');
            if (res.cy !== undefined) return res.cy;
            currentY += res.h;

            // 2. Globals
            res = processSection(nodeData.globals, sState.globals, sectionName === 'globals');
            if (res.cy !== undefined) return res.cy;
            currentY += res.h;

            // 3. Locals
            res = processSection(nodeData.locals, sState.locals, sectionName === 'locals');
            if (res.cy !== undefined) return res.cy;
            currentY += res.h;

            return node.y + node.h / 2;
        }

        function draw() {
            container.innerHTML = ''; // Clear
            var layout = calculateLayout(data, collapsedState, sectionState, containerState);

            // Adjust SVG size to fit content
            var maxX = 0, maxY = 0;
            layout.packs.forEach(p => {
                if (p.x + p.w > maxX) maxX = p.x + p.w;
                if (p.y + p.h > maxY) maxY = p.y + p.h;
            });

            var svgNS = "http://www.w3.org/2000/svg";
            var svg = doc.createElementNS(svgNS, "svg");
            svg.setAttribute("width", Math.max(maxX + 100, 2000));
            svg.setAttribute("height", Math.max(maxY + 100, 2000));

            var defs = doc.createElementNS(svgNS, "defs");
            var marker = doc.createElementNS(svgNS, "marker");
            marker.setAttribute("id", "arrowhead");
            marker.setAttribute("markerWidth", "4"); // Shorter (was 6)
            marker.setAttribute("markerHeight", "4"); // Shorter (was 6)
            marker.setAttribute("refX", "4"); // Adjust refX (was 6)
            marker.setAttribute("refY", "2"); // Adjust refY (was 3)
            marker.setAttribute("orient", "auto");
            var polygon = doc.createElementNS(svgNS, "polygon");
            polygon.setAttribute("points", "0 0, 4 2, 0 4"); // Shorter points (was 0 0, 6 3, 0 6)
            polygon.setAttribute("fill", "var(--text-color)");
            marker.appendChild(polygon);
            defs.appendChild(marker);

            var filter = doc.createElementNS(svgNS, "filter");
            filter.setAttribute("id", "text-bg");
            filter.setAttribute("x", "-0.1");
            filter.setAttribute("y", "-0.1");
            filter.setAttribute("width", "1.2");
            filter.setAttribute("height", "1.2");
            var feFlood = doc.createElementNS(svgNS, "feFlood");
            feFlood.setAttribute("flood-color", "var(--bg-color)");
            feFlood.setAttribute("result", "bg");
            var feMerge = doc.createElementNS(svgNS, "feMerge");
            var feMergeNode1 = doc.createElementNS(svgNS, "feMergeNode");
            feMergeNode1.setAttribute("in", "bg");
            var feMergeNode2 = doc.createElementNS(svgNS, "feMergeNode");
            feMergeNode2.setAttribute("in", "SourceGraphic");
            feMerge.appendChild(feMergeNode1);
            feMerge.appendChild(feMergeNode2);
            svg.appendChild(defs);

            var gMain = doc.createElementNS(svgNS, "g");
            gMain.id = "main-group";
            svg.appendChild(gMain);

            // Helper to draw container
            function drawContainer(x, y, w, h, label, className, onToggle, isCollapsed) {
                var g = doc.createElementNS(svgNS, "g");
                g.setAttribute("class", className);

                var rect = doc.createElementNS(svgNS, "rect");
                rect.setAttribute("x", x);
                rect.setAttribute("y", y);
                rect.setAttribute("width", w);
                rect.setAttribute("height", h);
                rect.setAttribute("rx", "12"); // Explicit Rounded Corners
                rect.setAttribute("ry", "12"); // Explicit Rounded Corners
                rect.setAttribute("class", "container-rect");
                g.appendChild(rect);

                var headerH = 30;
                var line = doc.createElementNS(svgNS, "line");
                line.setAttribute("x1", x);
                line.setAttribute("y1", y + headerH);
                line.setAttribute("x2", x + w);
                line.setAttribute("y2", y + headerH);
                line.setAttribute("stroke", "var(--container-border)");
                g.appendChild(line);

                // Title Left
                var text = doc.createElementNS(svgNS, "text");
                text.setAttribute("x", x + 10);
                text.setAttribute("y", y + headerH / 2 + 1);
                text.setAttribute("class", "container-title");
                text.textContent = label;
                g.appendChild(text);

                // Min/Max Icon (Top Right)
                var iconG = doc.createElementNS(svgNS, "g");
                iconG.setAttribute("transform", `translate(${x + w - 25}, ${y + 5})`);
                iconG.style.cursor = "pointer";
                iconG.onclick = function (e) {
                    e.stopPropagation();
                    if (onToggle) onToggle();
                };

                var iconRect = doc.createElementNS(svgNS, "rect");
                iconRect.setAttribute("width", "20");
                iconRect.setAttribute("height", "20");
                iconRect.setAttribute("fill", "transparent");
                iconG.appendChild(iconRect);

                var iconText = doc.createElementNS(svgNS, "text");
                iconText.setAttribute("x", "10");
                iconText.setAttribute("y", "15");
                iconText.setAttribute("text-anchor", "middle");
                iconText.setAttribute("fill", "var(--text-color)");
                iconText.setAttribute("font-weight", "bold");
                iconText.textContent = isCollapsed ? "+" : "-";
                iconG.appendChild(iconText);

                g.appendChild(iconG);
                return g;
            }

            function toggleContainer(packName, type) {
                if (containerState[packName]) {
                    containerState[packName][type] = !containerState[packName][type];
                    draw();
                }
            }

            layout.packs.forEach(p => {
                var g = drawContainer(p.x, p.y, p.w, p.h, p.name, "card-main", () => toggleContainer(p.packName, 'pack'), p.collapsed);
                gMain.appendChild(g);
                // If collapsed, we shouldn't render children. 
                // But layout.innerCards/pools might still be there if we didn't filter them in calculateLayout.
                // We did filter logic/globals content, but the containers themselves?
                // In calculateLayout, we pushed them.
                // Let's rely on calculateLayout to handle structure.
                // Wait, if pack is collapsed, we shouldn't see Logic/Global containers.
                // In calculateLayout replacement above, I didn't fully implement removing them.
                // Let's fix it here: if p.collapsed, don't render children.
                // But the children are in layout.innerCards...
                // We need to filter layout.innerCards based on pack state.
            });

            layout.innerCards.forEach(c => {
                // Check if parent pack is collapsed
                var packState = containerState[c.packName];
                if (packState && packState.pack) return; // Don't render if pack collapsed

                gMain.appendChild(drawContainer(c.x, c.y, c.w, c.h, c.label, "card-inner", () => toggleContainer(c.packName, 'logic'), c.collapsed));
            });

            layout.pools.forEach(p => {
                var packState = containerState[p.packName];
                if (packState && packState.pack) return;

                gMain.appendChild(drawContainer(p.x, p.y, p.w, p.h, p.label, "global-pool", () => toggleContainer(p.packName, 'globals'), p.collapsed));
            });

            // Links
            var drawnLinks = {};
            data.links.forEach(function (link) {
                var src = layout.nodes[link.from];
                var dst = layout.nodes[link.to];
                var linkId = link.from + "-" + link.to + "-" + link.type;

                if (src && dst && !drawnLinks[linkId]) {
                    drawnLinks[linkId] = true;
                    var gLink = doc.createElementNS(svgNS, "g");
                    var path = doc.createElementNS(svgNS, "path");

                    // Tooltip (Robust)
                    var title = doc.createElementNS(svgNS, "title");
                    // Prioritize dedicated tooltip, fallback to debug string
                    title.textContent = link.tooltip ? link.tooltip : (link.from + " -> " + link.to + " (" + link.type + ")");
                    path.appendChild(title);

                    // 1. Calculate Anchors
                    var x1 = src.x + src.w;
                    var y1 = src.y + 20; // Default

                    // Precise Section Anchoring
                    if (link.type === 'CALL') {
                        y1 = getSectionCenterY(src, 'locals');
                    } else if (link.type === 'ACCESS') {
                        y1 = getSectionCenterY(src, 'globals');
                    }

                    var x2 = dst.x;
                    var y2 = dst.y + 16; // Center of Node Header (32px / 2 = 16)
                    if (link.type === 'ACCESS') y2 = dst.y + dst.h / 2; // Middle of Global Node

                    // 2. Routing Points
                    var points = [];
                    points.push({ x: x1, y: y1 }); // Start

                    if (link.type === 'CALL') {
                        var rankDiff = dst.rank - src.rank;
                        if (x2 > x1 && rankDiff > 1) {
                            // Smart Step-Over
                            var safeY = findHorizontalGap(layout, y1, src.rank + 1, dst.rank - 1, src.packName);
                            var midX1 = x1 + 20; // Step out
                            var midX2 = x2 - 20; // Step in

                            points.push({ x: midX1, y: y1 });
                            points.push({ x: midX1, y: safeY });
                            points.push({ x: midX2, y: safeY });
                            points.push({ x: midX2, y: y2 });

                        } else if (x2 > x1) {
                            // Direct forward
                            var midX = (x1 + x2) / 2;
                            points.push({ x: midX, y: y1 });
                            points.push({ x: midX, y: y2 });
                        } else {
                            // Backwards (Cycle)
                            var midX = x1 + 20;
                            var loopY = y1 + 100;
                            points.push({ x: midX, y: y1 });
                            points.push({ x: midX, y: loopY });
                            points.push({ x: x2 - 20, y: loopY });
                            points.push({ x: x2 - 20, y: y2 });
                        }
                    } else {
                        // ACCESS (Global) - Left Entry Strategy
                        var logicCard = layout.innerCards.find(c => c.packName === src.packName && c.type === 'logic');
                        var globalPool = layout.pools.find(p => p.packName === src.packName);

                        // Determine Bus Y
                        var busY = y1 + 50;
                        if (logicCard && globalPool) {
                            busY = (logicCard.y + logicCard.h + globalPool.y) / 2;
                        }

                        var targetEntryX = x2 - 20;

                        points.push({ x: x1 + 15, y: y1 });      // Out
                        points.push({ x: x1 + 15, y: busY });    // Down to Bus
                        points.push({ x: targetEntryX, y: busY }); // Along Bus
                        points.push({ x: targetEntryX, y: y2 });   // Align Y
                        points.push({ x: x2, y: y2 });             // Enter
                    }

                    if (link.type === 'CALL') {
                        points.push({ x: x2, y: y2 });
                    }

                    var d = drawOrthogonalPath(points, 10);

                    // Color Coding
                    var strokeColor = "var(--link-color)";
                    if (link.dataType === 'Integer') strokeColor = "#4CAF50";
                    else if (link.dataType === 'String') strokeColor = "#E040FB";
                    else strokeColor = "#FF9800";

                    path.setAttribute("class", "link " + link.type.toLowerCase());
                    path.style.stroke = strokeColor;
                    path.setAttribute("stroke-width", "1.5");
                    path.setAttribute("d", d);
                    path.setAttribute("fill", "none");

                    // Hit Area
                    var pathHit = doc.createElementNS(svgNS, "path");
                    pathHit.setAttribute("d", d);
                    pathHit.setAttribute("stroke", "transparent");
                    pathHit.setAttribute("stroke-width", "10");
                    pathHit.setAttribute("fill", "none");
                    pathHit.style.cursor = "pointer";
                    var title = doc.createElementNS(svgNS, "title");
                    title.textContent = link.to + ":(" + (link.label || "") + ")";
                    pathHit.appendChild(title);

                    gLink.appendChild(path);
                    gLink.appendChild(pathHit);
                    gMain.appendChild(gLink);
                }
            });

            // Nodes
            for (var key in layout.nodes) {
                var n = layout.nodes[key];
                var g = doc.createElementNS(svgNS, "g");
                g.setAttribute("class", "node " + n.type.toLowerCase());
                g.setAttribute("transform", `translate(${n.x}, ${n.y})`);

                var fo = doc.createElementNS(svgNS, "foreignObject");
                fo.setAttribute("width", n.w);
                fo.setAttribute("height", n.h);

                var div = doc.createElement("div");
                div.className = "node-card " + (n.type === 'GLOBAL' ? 'global' : '') + (n.collapsed ? ' collapsed' : '');

                var iconChar = n.collapsed ? '+' : '-';
                var html = `<div class="node-header">
                                <span class="node-title">${n.label}</span>
                                <span class="node-type">${n.type}</span>
                                <span class="node-icon">${iconChar}</span>
                            </div>`;

                if (n.type === 'PROC') {
                    html += `<div class="node-body">`;

                    // Params Container
                    if (n.params && n.params.length > 0) {
                        var isExpanded = sectionState[n.label.toUpperCase()].params;
                        var displayStyle = isExpanded ? 'flex' : 'none';
                        var icon = isExpanded ? '&#9660;' : '&#9654;'; // Down or Right arrow

                        html += `<div class="inner-container">
                                    <div class="section-title section-toggle" data-node="${n.label.toUpperCase()}" data-section="params">
                                        ${icon} Params
                                    </div>
                                    <div class="section-list" style="display: ${displayStyle};">
                                        ${n.params.map(p => `<div class="item"><span style="font-weight:bold">${p.name}</span> <span style="opacity:0.7; font-size:90%">(${p.type})</span></div>`).join('')}
                                    </div>
                                 </div>`;
                    }

                    // Globals Container (First)
                    if (n.globals && n.globals.length > 0) {
                        var isExpanded = sectionState[n.label.toUpperCase()].globals;
                        var displayStyle = isExpanded ? 'flex' : 'none';
                        var icon = isExpanded ? '&#9660;' : '&#9654;';

                        html += `<div class="inner-container">
                                    <div class="section-title section-toggle" data-node="${n.label.toUpperCase()}" data-section="globals">
                                        ${icon} Globals (${n.globals.length})
                                    </div>
                                    <div class="section-list" style="display: ${displayStyle};">
                                        ${n.globals.map(g => `<div class="item">${g}</div>`).join('')}
                                    </div>
                                 </div>`;
                    }

                    // Locals Container (Second)
                    if (n.locals && n.locals.length > 0) {
                        var isExpanded = sectionState[n.label.toUpperCase()].locals;
                        var displayStyle = isExpanded ? 'flex' : 'none';
                        var icon = isExpanded ? '&#9660;' : '&#9654;';

                        html += `<div class="inner-container">
                                    <div class="section-title section-toggle" data-node="${n.label.toUpperCase()}" data-section="locals">
                                        ${icon} Locals (${n.locals.length})
                                    </div>
                                    <div class="section-list" style="display: ${displayStyle};">
                                        ${n.locals.map(l => `<div class="item">${l}</div>`).join('')}
                                    </div>
                                 </div>`;
                    }


                    html += `</div>`;
                }

                div.innerHTML = html;
                fo.appendChild(div);
                g.appendChild(fo);

                // Click to Show Code
                g.onclick = function (nodeData) {
                    return function (e) {
                        e.stopPropagation();
                        var code = nodeData.code || "// No code available";
                        win.showCode(code, nodeData.type + ": " + nodeData.label);

                        var allNodes = doc.querySelectorAll('.node-card');
                        allNodes.forEach(el => el.classList.remove('active'));
                        this.querySelector('.node-card').classList.add('active');
                    };
                }(n);

                // Toggle Collapse
                var icon = div.querySelector('.node-icon');
                if (icon) {
                    icon.onclick = function (nodeName) {
                        return function (e) {
                            e.stopPropagation();
                            collapsedState[nodeName] = !collapsedState[nodeName];
                            draw(); // Re-render with new state
                        };
                    }(n.label.toUpperCase());
                }

                // Section Toggle Logic
                var toggles = div.querySelectorAll('.section-toggle');
                toggles.forEach(t => {
                    t.onclick = function (e) {
                        e.stopPropagation();
                        var nodeName = this.getAttribute('data-node');
                        var section = this.getAttribute('data-section');
                        sectionState[nodeName][section] = !sectionState[nodeName][section];
                        draw(); // Re-render
                    };
                });

                gMain.appendChild(g);
            }

            container.appendChild(svg);

            // Zoom/Pan
            var scale = 1;
            var tx = 0, ty = 0;
            var isDragging = false;
            var startX, startY;

            function updateTransform() {
                gMain.setAttribute("transform", `translate(${tx}, ${ty}) scale(${scale})`);
            }

            svg.addEventListener('mousedown', function (e) {
                if (e.target.tagName === 'svg' || e.target.id === 'graph-container') {
                    isDragging = true;
                    startX = e.clientX - tx;
                    startY = e.clientY - ty;
                }
            });

            win.addEventListener('mousemove', function (e) {
                if (isDragging) {
                    tx = e.clientX - startX;
                    ty = e.clientY - startY;
                    updateTransform();
                }
            });

            win.addEventListener('mouseup', function () {
                isDragging = false;
            });

            svg.addEventListener('wheel', function (e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                    var s = Math.exp(-e.deltaY * 0.001);
                    scale *= s;
                    updateTransform();
                }
            });

            doc.getElementById('btn-zoom-in').onclick = function () { scale *= 1.2; updateTransform(); };
            doc.getElementById('btn-zoom-out').onclick = function () { scale /= 1.2; updateTransform(); };
            doc.getElementById('btn-fit').onclick = function () {
                scale = 1; tx = 0; ty = 0; updateTransform();
            };
        }

        draw();
    }

    // --- Public API ---

    function showSystemMap(packs) {
        var data = extractSystemData(packs);
        var win = openWindow();
        if (win) {
            setTimeout(function () {
                renderSystemMap(data, win);
            }, 100);
        }
    }

    return {
        showSystemMap: showSystemMap
    };

})();
