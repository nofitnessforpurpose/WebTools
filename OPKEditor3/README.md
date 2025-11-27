# OPK Editor 3 (Redesigned)

A modern, web-based editor for Psion Organiser II Data Packs (OPK files). This tool allows you to create, view, and edit OPK files, including OPL procedures, data files, and notepad entries.

## Features

*   **Modern UI**: A completely redesigned interface with a dark/light theme system.
*   **Custom Code Editor**: A built-in code editor for OPL procedures with:
    *   Syntax Highlighting (OPL keywords, strings, comments)
    *   Code Folding (collapse PROC, IF, DO, WHILE blocks)
    *   Line Numbers
*   **Theme Support**: Switch between Dark and Light themes via the Options menu.
*   **Pack Management**: Create new packs, open existing ones (.opk, .hex, .bin), and save changes.
*   **Item Management**: Add, delete, and import items (procedures, data files, notepad entries).
*   **Intel HEX Export**: Export packs to Intel HEX format for burning to EPROMs.

## Usage

1.  **Open a Pack**: Click "Open" to load an existing .opk or .hex file.
2.  **Create a Pack**: Click "New" to start with a fresh pack.
3.  **Edit Items**: Select an item from the sidebar to edit it.
    *   **Procedures**: Edit OPL source code in the code editor.
    *   **Notepad**: Edit text notes.
    *   **Data Files**: Edit database records.
4.  **Add Items**: Click "Add Item" to create a new procedure, notepad, or data file.
5.  **Import Items**: Click "Import Item" to load .opl, .odb, or binary files.
6.  **Save**: Click "Save" to download the modified .opk file.
7.  **Options**: Click "Options" to configure the editor (Theme, Line Numbers, Folding).

## Technical Details

*   **Architecture**: Client-side JavaScript application (no server required).
*   **Editor**: Custom-built `CodeEditor` component for lightweight, specific OPL support.
*   **Theming**: CSS Variable-based theming system managed by `ThemeManager`.
*   **Storage**: `OptionsManager` persists user preferences to `localStorage`.

## Credits

*   Original OPK Editor by **Jaap Scherphuis**.
*   Re-imagined by NFfP Implemented by **Antigravity**.


