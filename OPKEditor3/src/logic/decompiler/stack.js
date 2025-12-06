/**
 * stack.js
 * 
 * Decompiler Stack
 * Manages the stack of expressions during decompilation.
 */

class DecompilerStack {
    constructor() {
        this.stack = [];
    }

    push(item) {
        // Ensure item is an object with text and prec
        if (typeof item !== 'object' || item === null) {
            item = { text: String(item), prec: 99 }; // Default to ATOM/FUNC precedence
        }
        this.stack.push(item);
    }

    pop() {
        if (this.stack.length === 0) {
            return { text: "BAD_STACK_UNDERFLOW", prec: 0, isError: true };
        }
        return this.stack.pop();
    }

    peek() {
        if (this.stack.length === 0) return null;
        return this.stack[this.stack.length - 1];
    }

    get length() {
        return this.stack.length;
    }
}

if (typeof window !== 'undefined') {
    window.DecompilerStack = DecompilerStack;
}
