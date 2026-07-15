# PRINTEREMU  

A modern, web-based dot matrix printer eumulator.  
<BR>
This web application emulates a classic 9 pin dot matrix printer mechanism used in many serial RS232 printer devices connected to a range of classic personal computer and PDA devices including the **Psion Organiser II** series of PDA's. It connects to a physical device via a serial cable using the browser's Web Serial API. Printing ASCII text or graphics onto an emulated scrolling paper sheet and fan fold in real-time.

 
This repository is intended to be accessed at https://nofitnessforpurpose.github.io/WebTools/PRINTEREMU/  

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
[![Organiser](https://img.shields.io/badge/gadget-Dot_Matrix_Printer-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Dot_matrix_printing)
[![Static Badge](https://img.shields.io/badge/license-CC_BY_NC_SA_4.0-brightgreen/nofitnessforpurpose/WebTools/OPKEDITOR3?style=flat-square)](https://github.com/vitorsr/cc/blob/master/CC-BY-NC-4.0.md)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg?style=flat-square)](https://github.com/nofitnessforpurpose/WebTools/OPKEDITOR3/graphs/commit-activity)
[![Static Badge](https://img.shields.io/badge/format-CODE-blue?style=flat-square)](https://en.wikipedia.org/)

## Features
- **Web Serial Interface**: Receives data directly over a serial RS232 data link.
- **Full Control Code Support**: Supports formatting control codes for text sizes (Normal 40, Double Width 20, Narrow 60, Very Narrow 80), underlines, and double-height characters.
- **Graphics Printing**: Supports raw 8-dot column printing using classic ESC control codes.
- **Hardware Simulation**: Retro style status LEDs (Rx active, Buffer status, Connection state) and simulated paper styles and scrolling.
- **Export Capabilities**: Clear the roll, feed paper, or download the entire print history as a single high-quality PNG image.
- **Self-Test Mode**: Simulated test print to verify the rendering engine locally.


<BR>

## Physical Setup  

1. Connect your device to the serial port of your PC. If your PC does not have an inbuilt COMM port you will need a USB-to-Serial converter.

2. In the browser, click the **Connect** button, choose the serial port of your USB-to-Serial converter, and select Allow connection.
   
3. Configure your device settings to 9600 Baud, No Parity, 8 Data Bits, 1 Stop Bit.

4. Send data over the serial link to print.

PSION Organiser II devices will ouput Standard OPL `LPRINT` statements automatically routed through the Comms Link interface.

<BR>

### Hints   
  
 - Ensure your COMMS link settings are correct  
    
 - Ensure your web browser supports WEB Serial (Firefox 151 does now!!!!)  
   
 - PSION Organiser II users should take care with any RAM Packs !  
. . . . COMMS links don't play nicely with RAM Packs !  
 
<BR>


## Background  

Following deployment of printers using fixed type, the 1980's saw introduction of dot matrix printers which employed small solenoids to transfer dots of ink from a moving ribbon to paper. Using typically 9 solenoids, the print in slices of vertical pixels per byte 9 for character mode and 8 for graphics mode. In graphics mode the layout maps the top-most pixel of the 8-pixel strip to the Most Significant Bit (MSB = 128) and the bottom-most pixel to the Least Significant Bit (LSB = 1). ASCII text characters received by the unit use the inbuilt character ROM, in common with most printers of its day, to convert a printable ASCII character code into a bit pattern that corresponds to the ASCII received character value.

### Additional Print Specifications  
Print Mechanism:  
 - Arragement: Moving head single column mechanism, sprocket feed paper.  
 - Print Method: Single column 9 pin Solenoid.   
 - Graphics print speed: TBC  
 - Printing Paper: plain and pre printed.  
 - Paper Feed: Tractor feed.  
 - Reliability: TBC  

Graphics Mode:  
 - Horizontal resolution: TBC  
 - Pitch: TBC  
 - Line pitch: TBC  
 - Printable width: TBC  
 - Borders: TBC 

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

