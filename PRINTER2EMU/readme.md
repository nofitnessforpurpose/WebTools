# PRINTER2EMU  

A modern, web-based thermal printer eumulator.  
<BR>
This web application emulates the Epson M1221 thermal printer mechanism used in many devices and for the **Psion Organiser II Printer II**. It connects to a physical device (such as a Psion Organiser device) via a serial cable using the browser's Web Serial API. Printing ASCII text or graphics onto an emulated scrolling paper roll in real-time.

 
This repository is intended to be accessed at https://nofitnessforpurpose.github.io/WebTools/PRINTER2EMU/  

<BR>
<div align="center">
  <div style="display: flex; align-items: flex-start;">
  <img src="https://github.com/nofitnessforpurpose/WebTools/blob/main/PRINTER2TOOL/images/PGRLEC-01.png" width="200px" alt="PSION Organiser II Printer II With NFfP Logo. Image copyright (c) 18 June 2026 nofitnessforpurpose All Rights Reserved">
  </div>
</div>
<BR>


[![Organiser](https://img.shields.io/badge/gadget-RS232-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/RS232)
[![Organiser](https://img.shields.io/badge/gadget-Printer-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Printer_(computing))
[![Organiser](https://img.shields.io/badge/gadget-Organiser_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Organiser](https://img.shields.io/badge/gadget-Organiser_II_Printer_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Static Badge](https://img.shields.io/badge/license-CC_BY_NC_SA_4.0-brightgreen/nofitnessforpurpose/WebTools/OPKEDITOR3?style=flat-square)](https://github.com/vitorsr/cc/blob/master/CC-BY-NC-4.0.md)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg?style=flat-square)](https://github.com/nofitnessforpurpose/WebTools/OPKEDITOR3/graphs/commit-activity)
[![Static Badge](https://img.shields.io/badge/format-CODE-blue?style=flat-square)](https://en.wikipedia.org/)

## Features
- **Web Serial Interface**: Receives data directly at 9600 baud.
- **Full Control Code Support**: Supports formatting control codes for text sizes (Normal 40, Double Width 20, Narrow 60, Very Narrow 80), underlines, and double-height characters.
- **Graphics Printing**: Supports raw 8-dot column printing using a custom, high-performance OPL stub.
- **Hardware Simulation**: Retro style status LEDs (Rx active, Buffer status, Connection state) and simulated thermal paper scroll.
- **Export Capabilities**: Clear the roll, feed paper, or download the entire print history as a single high-quality PNG image.
- **Self-Test Mode**: Simulated test print to verify the rendering engine locally.


<BR>

## Physical Setup  

1. Connect your device to the serial port of your PC. If your PC does not have an inbuilt COMM port you will need a USB-to-Serial converter.

2. In the browser, click the **Connect** button, choose the serial port of your USB-to-Serial converter, and select Allow connection.
   
3. Configure your device settings to 9600 Baud, No Parity, 8 Data Bits, 1 Stop Bit

PSION Organiser II devices will ouput Standard OPL `LPRINT` statements automatically routed through the Comms Link interface.

<BR>

### Hints   
  
 - Ensure your COMMS link settings are correct  
    
 - Ensure your web browser supports WEB Serial (Firefox 151 does now!!!!)  
   
 - A little patience is required for graphics as the Stub code has to send serial data   
 
 - PSION Organiser II user should take care with any RAM Packs !  
. . . . COMMS links don't play nicely with RAM Packs !  
 
<BR>

## Organiser II Support - OPL Stub  

If you wish to prepare graphics for printing, see the companion tool <a href="https://nofitnessforpurpose.github.io/WebTools/PRINTER2TOOL/">PRINTER2TOOL</a>  

If graphics print support is needed, use the helper stub routine below to allow the emulator to handle graphics printing (since the physical Printer II hardware's internal `GPRINT` routine is not available). The `GPRINT` routine is small and can be located on your internal **A:** storage location:  

### `GPRINT` Stub
```opl
GPRINT:(w%, addr%)
  REM GPRINT stub code
  REM By NFfP Rev 1.2
  LOCAL i%
  LPRINT CHR$(27);CHR$(71);
  LPRINT CHR$(w%/256);CHR$(w% AND 255);
  i%=0
  WHILE i%<w%
    LPRINT CHR$(PEEKB(addr%+i%));
    i%=i%+1
  ENDWH
```
<BR>
## Background  

The Psion Printer II employed the EPSON M221 thermal printhead moving carriage to print over the pages width. Using 8 of the 9 thermal head pixels in graphics mode, it prints in slices of vertical pixels per byte 9 for character mode and 8 for graphics mode. In graphics mode the layout maps the top-most pixel of the 8-pixel strip to the Most Significant Bit (MSB = 128) and the bottom-most pixel to the Least Significant Bit (LSB = 1). The width of a line is 256 pixels over the printable area which gives a resolution of approximately 65 DPI. ASCII text characters received by the unit use the inbuilt character ROM, in common with most printers of its day, to convert a printable ASCII character code into a bit pattern that corresponds to the ASCII received character value.

### Additional Print Specifications  
Print Mechanism:  
 - Epson 1221.  
 - Print Method: Thermal 5 x 9 dot matrix.   
 - Vertical Step (Line Spacing): 4.2 mm per 12 dot feed (giving a vertical resolution of roughly 2.86 dots per mm).
 - Graphics print speed: ~0.75 lines per second.
 - Printing Paper: Kanzaki Paper MFG KF-200
 - Paper Feed: 8 and 12 dot feed
 - Reliability: Printed head ~300,000, Mechanisim ~500,000 lines  

Graphics Mode:  
 - Horizontal resolution: 256 columns  
 - Pitch: 0.35 mm  
 - Line pitch: 2.8 mm ±10% (8 dot feed mode i.e. Graphics)
 - Printable width: 89.6 mm
 - Borders: L 12.5, R 9.9 mm

<div align="center">
  <div style="display: flex; align-items: flex-start;">
  <img src="https://github.com/nofitnessforpurpose/WebTools/blob/main/PRINTER2TOOL/images/2026-06-19-1221-Graphics-Mode-Printable-Area.png" width="400px" alt="PSION Organiser II Printer II With NFfP Logo. Image copyright (c) 18 June 2026 nofitnessforpurpose All Rights Reserved">
  </div>
</div>

<BR>


## Technical Details

*   **Architecture**: Client-side JavaScript application (no server required).  
*   **Hosting**: May be hosted locally by downloading the repository or run from the link above.  

<BR>

## NOTE - BETA Software 

*   Implemented by **Antigravity**
*   Imagined by NFfP

<BR>

## Questions / Discussion
See <a target="_blank" rel="noopener noreferrer" href="https://www.organiser2.com/"> Organiser 2 </a> forum, though see note below first.

<BR>

## Please note:  
All information is For Indication only.
No association, affiliation, recommendation, suitability, fitness for purpose should be assumed or is implied.
Registered trademarks are owned by their respective registrants.
