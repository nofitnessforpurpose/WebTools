# OPK Analyser

A cross platform web-based tool for verifying OPK files (aka Data Pack files) prior to upload and following downloading data packs. Either created by third party tools such as OPK Editor or en-route to & from the Psion Organiser II via the COMMS Link interface. This tool implements full spectrum verification of data pack and record structure with Pass or Fail status indication and issue explanation.

This repository is intended to be accessed at <a href="https://nofitnessforpurpose.github.io/WebTools/OPKAnalyser/">https://nofitnessforpurpose.github.io/WebTools/OPKAnalyser/</a>

<BR>
<div align="center">
  <div style="display: flex; align-items: flex-start;">
  <img src="https://github.com/nofitnessforpurpose/WebTools/blob/main/LinkTool/images/serial_adapter_diagram_organiser.png" width="400px" alt="LinkTool - Image copyright (c) 09 October 2026 nofitnessforpurpose All Rights Reserved">
  </div>
</div>
<BR>
<BR>

[![Organiser](https://img.shields.io/badge/gadget-Organiser_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Static Badge](https://img.shields.io/badge/license-CC_BY_NC_SA_4.0-brightgreen/nofitnessforpurpose/WebTools/LinkTool?style=flat-square)](https://github.com/vitorsr/cc/blob/master/CC-BY-NC-4.0.md)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg?style=flat-square)](https://github.com/nofitnessforpurpose/WebTools/LinkTool/graphs/commit-activity)
[![Static Badge](https://img.shields.io/badge/format-CODE-blue?style=flat-square)](https://en.wikipedia.org/)

## Features

*   **Look Inside Any Pack**: See every program, address book, notepad, diary, and spreadsheet stored on the pack directly on your PC or Mac.
*   **Instant Health Check**: Checks if the pack is healthy, has minor quirks, or has corrupted data that would crash your Organiser.
*   **Identify "Mystery" Packs**: Have an old file named pack1.opk or backup.bin? T
*   **Personal Pack Registry**: Maintain your own Data Pack registry to help manage your library of data packs via unique digital fingerprints
*   **Avoid Duplicates**:The tool checks its unique digital fingerprint against a built-in library of 142 known packs and tells you exactly what it is (e.g. "This is the official Psion Finance Pack").

<BR>

## Ease of Use (Zero Friction)

### Reading a Pack (Pack Dump to PC)
1. **No Installation**: Runs directly in any web browser (Chrome, Edge, Firefox, Safari). There are no installers, no command-line tools, and no software dependencies.
2. **Just Drag & Drop**: Double-click index.html and drop your .OPK or .BIN file onto the window. Your full report appears in less than a second.
3. **100% Private**: Runs entirely on your computer. Your files are never sent over the internet or uploaded to any server.
4. **Traffic-Light Verdict:***
🟢 HEALTHY / VALID: Safe and ready to use.
🟡 WARNINGS DETECTED: Non-critical notices to review.
🔴 CRITICAL ANOMALIES: Corrupted records or file ID collisions that could cause crashes or data loss.
5. **Built-in Dark & Light Modes**: Switch themes anytime with the top-right button.6. **Save Pack**: Once complete, click **Save Pack** to download the resulting `.OPK` file.
 

<BR>

## Technical Details

*   **Architecture**: Client-side JavaScript application using the Web Serial API, 'local only' model
*   **File Format**: `.OPK` (Organiser PacK) format with magic signature (`OPK`), 3-byte big-endian length header, and `0xFF 0xFF` terminator

<BR>

## Browser Support

This tool requires a browser with Web Serial API support:
*   **Google Chrome** (version 89+)
*   **Microsoft Edge** (version 89+)
*   **Opera** (version 75+)
*   **Firefox** (version 151+)

<BR>

## Credits

*   Implemented by **Antigravity**
*   Re-imagined by **NFfP**

<BR>

## License

MIT

<BR>

## Questions / Discussion

See [Organiser 2](https://www.organiser2.com/) forum.

<BR>

## Please note:

All information is For Indication only. No association, affiliation, recommendation, suitability, fitness for purpose should be assumed or is implied. Registered trademarks are owned by their respective registrants.
