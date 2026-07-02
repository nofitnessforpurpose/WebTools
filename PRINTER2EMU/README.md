# Psion Printer II Web Emulator

This web application emulates the **Psion Organiser II Printer II** (based on the Epson M1221 thermal printer mechanism). It connects to a physical Psion Organiser II via a serial cable (using the browser's Web Serial API) and prints text or graphics onto an emulated scrolling paper roll in real-time.

## Features
- **Web Serial Interface**: Receives data directly at 9600 baud.
- **Full Control Code Support**: Supports formatting control codes for text sizes (Normal 40, Double Width 20, Narrow 60, Very Narrow 80), underlines, and double-height characters.
- **Graphics Printing**: Supports raw 8-dot column printing using a custom, high-performance OPL stub.
- **Hardware Simulation**: Retro style status LEDs (Rx active, Buffer status, Connection state) and simulated thermal paper scroll.
- **Export Capabilities**: Clear the roll, feed paper, or download the entire print history as a single high-quality PNG image.
- **Self-Test Mode**: Simulated test print to verify the rendering engine locally.

## OPL Stub

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

## Physical Setup
1. Connect your Psion Organiser II Comms Link port to your PC using a Comms Link cable connected to a USB-to-Serial converter.
2. In the browser, click the **Connect** button, choose the serial port of your USB-to-Serial converter, and select connect.
3. Configure your Organiser Comms Link settings to 9600 Baud, No Parity, 8 Data Bits, 1 Stop Bit, and set the printer device to serial output (Standard OPL `LPRINT` statements will then automatically route through the Comms Link interface).
