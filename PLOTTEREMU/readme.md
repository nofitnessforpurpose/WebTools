# PLOTTEREMU  

A modern, web-based Plotter emulator tool for RS232 serial devices including the  Psion Organiser II family of devices.  
This web application emulates the **HPGL** plotter command languge. It connects to a physical Psion Organiser II via a serial cable (using the browser's Web Serial API) or accepts files directly. It plots prints text or graphics onto an emulated plotter bed in real-time.


This repository is intended to be accessed at https://nofitnessforpurpose.github.io/WebTools/PLOTTEREMU/  

<BR>
<div align="center">
  <div style="display: flex; align-items: flex-start;">
  <img src="https://github.com/nofitnessforpurpose/WebTools/blob/main/PLOTTEREMU/images/2026-06-26%20-%20Plotter-Screen%2001.png" width="600px" alt="PSION Organiser II Virtual Pen Plotter. Image copyright (c) 26 June 2026 nofitnessforpurpose All Rights Reserved">
  </div>
</div>
<BR>


[![Organiser](https://img.shields.io/badge/gadget-Plotter_HPGL_Compatible-blueviolet.svg?%3D&style=flat-square)]()
[![Organiser](https://img.shields.io/badge/gadget-Organiser_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Static Badge](https://img.shields.io/badge/license-CC_BY_NC_SA_4.0-brightgreen/nofitnessforpurpose/WebTools/OPKEDITOR3?style=flat-square)](https://github.com/vitorsr/cc/blob/master/CC-BY-NC-4.0.md)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg?style=flat-square)](https://github.com/nofitnessforpurpose/WebTools/OPKEDITOR3/graphs/commit-activity)
[![Static Badge](https://img.shields.io/badge/format-CODE-blue?style=flat-square)](https://en.wikipedia.org/)

<BR>

## Features
- **Web Serial Interface**: Receives data directly at standard baud rates from any serial device.
- **HPGL**: Supports HPGL language for clasisc and Rev 2 commands.
- **Graphics Printing**: HPGL-2 supports box, arc and poly lines.
- **Hardware Simulation**: Retro style status LEDs (Rx active, Buffer status, Connection state) and simulated paper.
- **Export Capabilities**: Download the entire plot as a single high-quality PNG image on the background of your choice.
- **Self-Test Mode**: Simulated test plot to verify the rendering engine locally.
- **Demo Pack**: A PSION Organiser II demo pack is available <a href="https://github.com/nofitnessforpurpose/WebTools/tree/main/PLOTTEREMU/PLOTPACK">here</a>.

<BR>

## Physical Setup
1. Connect your device to the PC's Serial Port  
   (Psion Organiser II COMMS Link port to your PC using a COMMS Link cable connected to a Serial Port or USB-to-Serial converter.)  
2. In the browser, click the **Connect** button, choose the Serial Port, Bluetooth or your USB-to-Serial converter, and select connect.  
3. Configure your devices communication settiongs to 9600 Baud, No Parity, 8 Data Bits, 1 Stop Bit  
   (Organiser COMMS | SETUP settings to 9600 Baud, No Parity, 8 Data Bits, 1 Stop Bit)
4. Set the printer device to serial output  
   (Organiser standard OPL `LPRINT` statements will automatically route through the COMMS Link interface).

** NOTE: Any serial RS232 device can be used with the emualtor (Raspberyy PI, Arduino, PC, ESP32 etc.).

<BR>

### Hints 
  - Ensure your COMMS link settings are correct  
  - Ensure your web browser supports WEB Serial (Firefox 151 does now!!!!)
    
  PSION Organiser
  - Take care with any RAM Packs - COMMS links don't play nicely with them

<BR>

## Background  

Obtaining ouptut from legacy devices was typically limited. Perhaps a hardware terminal or line printer. Later, devices such as the PSION Organiser II, were often connected to a range of serial devices. This project emulation supports emulation of one of those device families i.e. a pen plotter. 

As the project uses Web Serial, you can connect a huge range of devices such as RP2040, RP2350's, Raspberyy PI's, Arduino, PC, ESP32 etc. as these all have serial support. Where your hardware does not, it's trivial to implement bit banged support.  

### Additional Plot Specifications  
TBC

Graphics Mode:  
TBC

<BR>


## Technical Details

*   **Architecture**: Client-side JavaScript application (no server required).

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

