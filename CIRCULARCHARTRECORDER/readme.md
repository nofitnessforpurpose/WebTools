# CIRCULAR CHART RECORDER

A modern, web-based circular chart recorder emulator.  
<BR>
This web application emulates a classic circular chart recorder with support for serial RS232. It connects to a physical device via a serial cable using the browser's Web Serial API. Plotting up to 4 channels from ASCII messages onto an emulated rotating paper disc sheet in real-time. Serial devices such as the PSION Organiser II can transmit ASCII messages to drive the recorder.

 
This repository is intended to be accessed at https://nofitnessforpurpose.github.io/WebTools/CIRCULARCHARTRECORDER/  

<BR>
<div align="center">
  <div style="display: flex; align-items: flex-start;">
  
  </div>
</div>
<BR>


[![Organiser](https://img.shields.io/badge/gadget-RS232-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/RS232)
[![Organiser](https://img.shields.io/badge/gadget-Chart_Recorder-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Chart_recorder)
[![Organiser](https://img.shields.io/badge/gadget-Organiser_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Static Badge](https://img.shields.io/badge/license-CC_BY_NC_SA_4.0-brightgreen/nofitnessforpurpose/WebTools/OPKEDITOR3?style=flat-square)](https://github.com/vitorsr/cc/blob/master/CC-BY-NC-4.0.md)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg?style=flat-square)](https://github.com/nofitnessforpurpose/WebTools/OPKEDITOR3/graphs/commit-activity)
[![Static Badge](https://img.shields.io/badge/format-CODE-blue?style=flat-square)](https://en.wikipedia.org/)

## Features
- **Web Serial Interface**: Receives data directly over a serial RS232 data link.
- **Multi Channel**: Supports up to 4 pens.
- **Hardware Simulation**: Retro style status LEDs (Rx active, Buffer status, Connection state) and simulated paper styles and rotation.
- **Export Capabilities**: Clear the paper or download the entire plot history as a single high-quality PNG image.
- **Self-Test Mode**: Simulated test plot to verify the rendering engine locally.


<BR>

## Physical Setup  

1. Connect your device to the serial port of your PC. If your PC does not have an inbuilt COMM port you will need a USB-to-Serial converter.

2. In the browser, click the **Connect** button, choose the serial port of your USB-to-Serial converter, and select Allow connection.
   
3. Configure your device settings to 9600 Baud, No Parity, 8 Data Bits, 1 Stop Bit.

4. Send data over the serial link to print.

PSION Organiser II devices will output Standard OPL `LPRINT` statements automatically routed through the Comms Link interface.

<BR>

### Hints   
  
 - Ensure your COMMS link settings are correct  
    
 - Ensure your web browser supports WEB Serial (Firefox 151 does now!!!!)  
   
 - PSION Organiser II users should take care with any RAM Packs !  
. . . . COMMS links don't play nicely with RAM Packs !  
 
<BR>


## Background  

T.B.C


As the emulation supports Web Serial (RS232), you can connect a huge range of devices including Raspberry Pi's, ESP32's Arduino's, STM32 Discovery / Nucleo Boards, Teensy Boards or bit bang RS232 from any hardware.

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


