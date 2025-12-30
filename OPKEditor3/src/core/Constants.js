'use strict';

/**
 * Architecture: Event System
 * --------------------------
 * Defines the message types used for communication between the Editor components
 * and the Main Controller (opkedit.js).
 * 
 * - CHANGEMADE: Fired when content is modified.
 * - GETFILEIDS: Request for available file IDs.
 * - CHANGEFILEID: Request to rename/renumber a file.
 * - DELETERECORDS: Request to delete specific records.
 */
var EditorMessage = {
    CHANGEMADE: 1,
    GETFILEIDS: 2,
    CHANGEFILEID: 3,
    DELETERECORDS: 4,
};

const APP_VERSION = "03.00.10";
