# PRINTER2TOOL  

A modern, web-based image editor support tool for Psion Organiser II Printer II printers.  

This repository is intended to be accessed at https://nofitnessforpurpose.github.io/WebTools/PRINTER2TOOL/  

<BR>
<div align="center">
  <div style="display: flex; align-items: flex-start;">
  <img src="https://github.com/nofitnessforpurpose/WebTools/blob/main/PRINTER2TOOL/images/PGRLEC-01.png" width="200px" alt="PSION Organiser II Printer II With NFfP Logo. Image copyright (c) 18 June 2026 nofitnessforpurpose All Rights Reserved">
  </div>
</div>
<BR>


[![Organiser](https://img.shields.io/badge/gadget-Organiser_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
[![Organiser](https://img.shields.io/badge/gadget-Organiser_II_Printer_II-blueviolet.svg?%3D&style=flat-square)](https://en.wikipedia.org/wiki/Psion_Organiser)
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

Following up load and any adjustments, download the two OPL routines COMPRUN: and PRRLE:

### Hints   
Rendering - Select the rendering based on the type of image:   
 - Photographs render best using Floyd-Steinberg dithering.  
 - High contrast images, such as B&W Icons / Logos or custom Fonts, render best with Threshold Cutoff rendering.  
 
Fine Tuning - You can copy an image out (right click the image) use third party editor tools and re-import it  
 - Add emphasis  
 - Close borders  

<BR>

## Background  

The Psion Printer II uses an 8 pixel high thermal printhead and moving carriage to print over the pages width. It prints in slices of 8 vertical pixels per byte. The layout maps the top-most pixel of the 8-pixel strip to the Most Significant Bit (MSB = 128) and the bottom-most pixel to the Least Significant Bit (LSB = 1). The width of a line is 256 pixels over the printable area which gives a resolution of approximately 65 DPI.

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

## RLE Optimization  
To reduce transmission overhead and pack storage footprint, bytes are compressed into RLE byte-pairs: [Count, Value]. The main COMPRUN procedure streams chunks of Base64 strings, passing them to the PRRLE: decoder sub procedure.  

The procedure PRRLE: takes the compressed bit stream held in the Base64 encoded strings and expands the compressed data to be passed to the GPRINT: command supported by the PRINTER II's onboard firmware.

<BR>

## Transferring to Organiser
1. Copy or download the PRRLE.OPL routine
2. Copy or download the COMPRUN.OPL routine
3.   or use an OPK Editor and Link tool to create a pack with your COMPRUN: and the PRRLE: routines
4. Translate the procedures on the device. 
5. Make sure the PRRLE: procedure is also translated, as it is called by COMPRUN.

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
