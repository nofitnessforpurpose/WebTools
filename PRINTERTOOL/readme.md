# PRINTERTOOL  

A modern, web-based image editor support tool for ESC/P printers & the EFX-80s Emulator.  

This repository is intended to be accessed at https://nofitnessforpurpose.github.io/WebTools/PRINTERTOOL/  

<BR>
<div align="center">
  <div style="display: flex; align-items: flex-start;">
  <img src="https://github.com/nofitnessforpurpose/WebTools/blob/main/PRINTEREMU/images/2026-07-16%2016-45-08.gif" width="400px" alt="Dot Matrix Printer Emulator. Image copyright (c) 16 July 2026 nofitnessforpurpose All Rights Reserved">
  </div>
</div>
<BR>


[![Organiser](https://img.shields.io/badge/gadget-RS232-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Organiser](https://img.shields.io/badge/gadget-Printer-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Static Badge](https://img.shields.io/badge/license-CC_BY_NC_SA_4.0-brightgreen/nofitnessforpurpose/WebTools/OPKEDITOR3?style=flat-square)](https://github.com/vitorsr/cc/blob/master/CC-BY-NC-4.0.md)
[![Maintenance](https://img.shields.io/badge/maintained%3F-yes-green.svg?style=flat-square)](https://github.com/nofitnessforpurpose/WebTools/OPKEDITOR3/graphs/commit-activity)
[![Static Badge](https://img.shields.io/badge/format-CODE-blue?style=flat-square)](https://en.wikipedia.org/)


## Image Handling  
Images can be uploaded or drag and dropped into the image manipulation tool which supports:  
- Scaling  
- Rendering method selection  
- Rotation  
- Justification  
- Negative mode

Following up load and any adjustments, copy the encoded ESC/P sequence and use in your system or paste into the EFX-80s Command Console.  

If you don't have a printer or wish to preview; test the image with the EFX-80s eumulation tool <a href="https://github.com/nofitnessforpurpose/WebTools/edit/main/PRINTEREMU/">PRINTEREMU</a>  


### Hints   
Rendering - Select the rendering based on the type of image:   
 - Photographs render best using Floyd-Steinberg dithering.  
 - High contrast images, such as B&W Icons / Logos, QR Codes or custom Fonts, render best with Threshold Cutoff rendering.  
 
Fine Tuning - You can copy an image out (right click the image) use third party editor tools and re-import it  
 - Add emphasis  
 - Close borders  

<BR>

## Background  

Printers using the ESC/P sequence, such as the emulated EFX-80s printer, use an 8 pixel high thermal printhead and moving carriage to print over the pages width. It prints in slices of 8 vertical pixels per byte. The layout maps the top-most pixel of the 8-pixel strip to the Most Significant Bit (MSB = 128) and the bottom-most pixel to the Least Significant Bit (LSB = 1). The width of a line is 256 pixels over the printable area which gives a resolution of approximately 65 DPI. This tool encodes that pattern into a text string which can be readily manipulated for transmission to a printer - you may need byte conversion.

### Additional Print Specifications  
Print Mechanism:  
 - TBC
 - Print Method: Thermal 5 x 9 dot matrix.   
 - Vertical Step (Line Spacing): TBC
 - Graphics print speed: TBC
 - Printing Paper: TBC
 - Paper Feed: Sprocket 0.5" (
 - Reliability: TBC

Graphics Mode:  
 - Horizontal resolution: 480 columns  
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
*   **Hosting**: May be run locally by downloading the repository or from the link above
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

