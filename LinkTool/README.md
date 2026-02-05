# LinkTool

A web-based tool for downloading data packs from the Psion Organiser II via the Comms Link interface. This tool implements the Psion Link Protocol to perform boot injection and data pack transfer operations directly in your browser using the Web Serial API.

## Features

*   **Web Serial API**: Direct serial communication with Psion Organiser II hardware via browser
*   **Boot Injection**: Automated bootstrap code download to device RAM
*   **Data Pack Transfer**: Download data packs from Packs B and C (Make to follow)
*   **Protocol Implementation**: Full implementation of the Psion Link Protocol with:
    *   CRC checksums for data integrity
    *   Phase-based state machine (HEADER/BODY phases)
    *   Handshake and flow control mechanisms
*   **Real-time Monitoring**: Live communication log and progress tracking
*   **OPK Export**: Save downloaded packs as .OPK files for use with OPK Editor tools
*   **Debug Mode**: Detailed logging for protocol analysis (append `?debug=true` to URL)

## Usage

1.  **Connect Hardware**: Connect your Psion Organiser II to your computer via a serial adapter
2.  **Select Pack**: Choose Pack B or Pack C using the "Pack select" button (default: Pack B)
3.  **Connect**: Click "Connect" to select the serial port and begin the transfer
4.  **Select COMMS | BOOT | NAME** on the Psion Organiser II (No Name is required)
4.  **Monitor Progress**: Watch the real-time log and progress bar as data is transferred
5.  **Save Pack**: Once complete, click "Save Pack" to download the .OPK file
6.  **Disconnect**: Click "Disconnect" to release the serial port

## Technical Details

*   **Architecture**: Client-side JavaScript application
*   **Protocol**: Psion Link Protocol (Boot Injection + Data Dump phases)
*   **Serial Parameters**: 9600 baud, 8N1, no flow control (Default)
*   **CRC Algorithm**: Check sum verification to ensure data integrity
*   **Output Format**: OPK files with magic header, length field, and terminator


## Browser Support

This tool requires a browser with Web Serial API support:
*   **Google Chrome** (version 89+)
*   **Microsoft Edge** (version 89+)
*   **Opera** (version 75+)

**Note**: Firefox and Safari do not currently natively support the Web Serial API.


## Credits

*   Protocol documentation by **Jaap Scherphuis** ([www.jaapsch.net/psion/](https://www.jaapsch.net/psion/))
*   Implemented by **Antigravity**
*   Re-imagined by **NFfP**

## License

MIT

Check Attribution [source www](https://www.jaapsch.net/psion/) for elements covered under a Non Commercial basis use.

## Questions / Discussion

See [Organiser 2](https://www.organiser2.com/) forum.

## Please note:

All information is For Indication only. No association, affiliation, recommendation, suitability, fitness for purpose should be assumed or is implied. Registered trademarks are owned by their respective registrants.
