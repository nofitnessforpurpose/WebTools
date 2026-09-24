# LinkTool

A web-based tool for transferring data packs to and from the Psion Organiser II over a COMMS Link interface. This tool implements the Psion Link Protocol to perform boot code injection and data pack transfer operations directly in your browser using the Web Serial API.

This repository is intended to be accessed at <a href="https://nofitnessforpurpose.github.io/WebTools/LinkTool/">https://nofitnessforpurpose.github.io/WebTools/LinkTool/</a>

<BR>
<div align="center">
  <div style="display: flex; align-items: flex-start;">
  <img src="https://github.com/nofitnessforpurpose/WebTools/blob/main/LinkTool/images/serial_adapter_diagram.png" width="400px" alt="PSION Organiser II COMMS Link with Adapters. Image copyright (c) 18 June 2026 nofitnessforpurpose All Rights Reserved">
  </div>
</div>
<BR>

[![Organiser](https://img.shields.io/badge/gadget-Organiser_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Static Badge](https://img.shields.io/badge/license-CC_BY_NC_SA_4.0-brightgreen/nofitnessforpurpose/WebTools/OPKEDITOR3?style=flat-square)](https://github.com/vitorsr/cc/blob/master/CC-BY-NC-4.0.md)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg?style=flat-square)](https://github.com/nofitnessforpurpose/WebTools/OPKEDITOR3/graphs/commit-activity)
[![Static Badge](https://img.shields.io/badge/format-CODE-blue?style=flat-square)](https://en.wikipedia.org/)


## Features

*   **Web Serial API**: Direct serial communication with Psion Organiser II hardware via browser
*   **Boot Injection**: Automated bootstrap code download to device RAM
*   **Pack Reading**: Upload data packs from Slot B: and Slot C: (Read Mode) to .OPK files
*   **Pack Writing**: Download .OPK files to Data Packs (Write Mode) - *New!*
*   **Protocol Implementation**: Full implementation of the Psion Link Protocol with:
    *   CRC checksums for data integrity
    *   Phase-based state machine (HEADER/BODY phases)
    *   Handshake and flow control mechanisms
*   **Real-time Monitoring**: Live communication log and progress tracking
*   **OPK Export**: Save downloaded packs as .OPK files for use with OPK Editor tools
*   **Debug Mode**: Detailed logging for protocol analysis (append `?debug=true` to URL)

## Usage

See the Help file bundled with the App for full details.  
<BR>
Summary
### Reading a Pack (Upload A Data Pack to PC)
1. **Connect Hardware**: Plug the COMMS Link into the Top Slot, and insert your source Data pack into Slot B: or Slot C:
2. **Link**: Connect the RS-232 cable / USB-to-serial adapter to your computer and the COMMS Link.
3. **Select Mode & Slot**: Ensure the mode toggle is set to **Read**. Select **Slot B:** or **Slot C:** (default: Slot B:).
4. **Prepare the Psion**: On the Organiser II, navigate to **COMMS -> BOOT -> NAME:** (leave the name blank). Do not press EXE yet.
5. **Connect**: In the browser, click **Connect**, choose your serial port, and wait for "Searching for Device...".
6. **Start Transfer**: Press **EXE** on the Organiser II. The tool automatically injects the secondary bootloader, reads the pack and displays real-time progress.
7. **Save Pack**: Once complete, click **Save Pack** to download the resulting `.OPK` file.

### Writing a Pack (Pack Download / from PC to Data pack)
1. **Connect Hardware**: Plug the COMMS Link into the Top Slot, and insert your source Data pack into Slot B: or Slot C:
2. **Switch to Write Mode**: Click the mode toggle to switch from **Read** to **Write**.
3. **Select OPK File**: Click **Select File** and choose the `.OPK` image you wish to flash.
4. **Select Target Slot**: Choose **Slot B:** or **Slot C:** depending on which external slot contains your writeable Data pack (EPROMS must be Formatted).
5. **Prepare the Psion**: On the Organiser II, navigate to **COMMS -> BOOT -> NAME:** (leave the name blank!).
6. **Connect**: Click **Connect**, select the COM port in your browser prompt, and wait for "Searching for Device...".
7. **Initiate Transfer**: Press **EXE** on the Organiser II. The tool injects the write bootloader via 19 synchronised packet pairs across 3 stages, with execution branching directly into the format and burn routine upon Pair 19.
8. **Insert Pack & Confirm**:
   - When the **"Insert Blank Pack"** dialog appears, ensure your blank Data pack is firmly seated in the chosen slot.
   - Click **"Continue to Download Phase"** (or press **Enter** / **Space**).
   - *Note*: While the dialog is open, the host automatically maintains bidirectional keep-alive pings with the Organiser to prevent timeout.
9. **Formatting Phase**: The host fires dual format triggers (`[01, 4F]` and `[FF, 01]`). The Psion begins its Sizing cycle (~1.7s to 60s depending on pack type).
10. **Data Pumping**: Upon completion of Sizing (`00 04` signal), the tool executes pre-flight handshaking and streams OPK data in verified 128-byte chunks with real-time percentage progress.
11. **Pack Finalization (EOF Drain)**: After the final chunk, the host and Organiser execute a 10-step EOF drain sequence to finalise directory structures and headers. The host transmits 3x link release polls and cleanly releases the serial port.

## Technical Details

*   **Architecture**: Client-side JavaScript application using the Web Serial API, no external dependencies
*   **Protocol Modes**:
    *   **Pack Reading (Dump)**: Boot injection + 6303 machine-code driver execution + page-by-page streaming to PC
    *   **Pack Writing (Download)**: Boot injection + keep-alive dialog maintenance + dual format triggers (`[01, 4F]`, `[FF, 01]`) + Data Pack Sizing + pre-flight handshake + 128-byte chunk streaming + 10-step EOF sector drain
*   **Serial Parameters**: 9600 baud, 8 data bits, no parity, 1 stop bit (8N1), XON
*   **Timing Invariants**: 15ms turnaround delay between serial operations to respect HD6303 CPU interrupt handling
*   **Echo Safety**: Hardware UART loopback suppression with explicit exemption for legitimate device Short Packet ACKs (`0x00..0x07`) in `PACK_DOWNLOAD` state
*   **CRC Algorithm**: CRC-16/ARC checksum verification across all link packets
*   **File Format**: `.OPK` (Organiser Pack) format with magic signature (`OPK`), 3-byte big-endian length header, and `0xFF 0xFF` terminator


## Browser Support

This tool requires a browser with Web Serial API support:
*   **Google Chrome** (version 89+)
*   **Microsoft Edge** (version 89+)
*   **Mozilla Firefox** (version 151+)
*   **Opera** (version 75+)

**Note**: Safari does not currently natively support the Web Serial API needed for Serial RS232 hardware communication.


## Credits

*   Protocol documentation by **Jaap Scherphuis** ([www.jaapsch.net/psion/](https://www.jaapsch.net/psion/))
*   Implemented by **Antigravity**
*   Re-imagined by **NFfP** ([https://nofitnessforpurpose.github.io/](https://nofitnessforpurpose.github.io/))

## License

MIT

Check Attribution [source www](https://www.jaapsch.net/psion/) for elements covered under a Non Commercial basis use.

## Questions / Discussion

See [Organiser 2](https://www.organiser2.com/) forum.

## Please note:

All information is For Indication only. No association, affiliation, recommendation, suitability, fitness for purpose should be assumed or is implied. Registered trademarks are owned by their respective registrants.
