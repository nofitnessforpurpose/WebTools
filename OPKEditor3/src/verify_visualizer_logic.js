const fs = require('fs');

// Mock System Nodes
const system = {
    nodes: {
        'MAIN': { type: 'PROC', name: 'MAIN', degree: 0 },
        'SUB': { type: 'PROC', name: 'SUB', degree: 0 },
        'CONV$': { type: 'PROC', name: 'CONV$', degree: 0 },
        'PRINT': { type: 'UNKNOWN' } // Should not link
    },
    links: []
};

// Mock Instruction List simulating Decompiler output
const instructions = [
    { text: 'PROC MAIN:' },
    { text: 'SUB:' },         // Standard Call
    { text: 'CONV$:' },       // Function Call
    { text: 'PRINT "HI"' },   // Keyword (no link)
    { text: 'LABEL::' },      // Label (no link)
    { text: 'dherror' }       // Identifier without colon (if regex works)
];
// Note: 'dherror' needs a node to link
system.nodes['DHERROR'] = { type: 'PROC', name: 'dherror', degree: 0 };


console.log("Running Visualizer Logic Simulation...");

instructions.forEach(function (inst) {
    // Regex from CodeVisualizer.js
    var callRegex = /([A-Z0-9_$]+)/gi;
    var match;
    while ((match = callRegex.exec(inst.text)) !== null) {
        var target = match[1].toUpperCase();

        // Check following characters for Labels (::)
        var idxAfter = match.index + match[0].length;
        if (inst.text[idxAfter] === ':' && inst.text[idxAfter + 1] === ':') {
            console.log(`Skipping Label: ${target}`);
            continue;
        }

        if (system.nodes[target] && system.nodes[target].type === 'PROC') {
            // In real code: Link creation
            console.log(`Linking to: ${target}`);
            system.links.push({ from: 'MAIN', to: target });
            system.nodes[target].degree++;
        }
    }
});

console.log("\n--- Results ---");
console.log(`Total Links: ${system.links.length}`);
system.links.forEach(l => console.log(`Link: MAIN -> ${l.to}`));

if (system.links.find(l => l.to === 'SUB') &&
    system.links.find(l => l.to === 'CONV$') &&
    system.links.find(l => l.to === 'DHERROR')) {
    console.log("SUCCESS: All calls linked.");
} else {
    console.error("FAILURE: Missing links.");
}
