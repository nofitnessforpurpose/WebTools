# LinkTool User Manual

## Contents

1. [Read a Data Pack from the Organiser II](#getting-started-reading-a-data-pack-uploading-your-first-pack)
2. [Write a Data Pack to the Organiser II](#writing-data-to-a-pack-pack-download-to-organiser-ii)
3. [Formatting Data Packs for the LinkTool](#formatting-data-packs)
4. [COMMS Link Settings](#serial-port-settings)
5. [OPK File Format](#what-is-an-opk-file)
6. [Troubleshooting](#troubleshooting)
7. [Links](#additional-resources)

---

## Getting Started: Reading a Data Pack (Uploading Your First Pack)

This section of the manual will guide you through uploading a data pack from your Psion Organiser II to an OPK file using the LinkTool web application.

### What You'll Need

- **Psion Organiser II**: With COMMS Link and free slot (Slot B: or Slot C:)
- **Data Pack**: RAM, Flash, or blank EPROM Data Pack in Slot B: or C:
- **Power Supply**: Recommended (Mains adapter or fresh 9V battery)
- **Serial Connection**: USB-to-serial adapter and cable to connect to your computer
- **Software Requirements**: Compatible web browser (Chrome 89+, Edge 89+, Firefox 151+ or Opera 75+)

> [!NOTE]
> Safari does not currently support the Web Serial API required by this tool.

---

## Step-by-Step Guide

### 1. Prepare Your Hardware

1. Locate a place (e.g. folder) on your PC/laptop that will be used to save the data pack image OPK file.
2. Power off the Organiser II.
3. Remove any RAM Packs!
4. Insert the COMMS Link into the Top Slot.
5. Connect your Psion Organiser II to your computer using the serial adapter and/or COMMS Link cable.
   - **Recommended**: Plug in a mains adaptor to the COMMS Link.
6. Turn the Organiser **ON**, to automatically install the COMMS Link software press the **ON/CLEAR** key twice.
7. If the pack you wish to read is a RAM pack:
   - Switch **OFF** again
   - Insert the Ram pack(s)
   - Turn the Organiser **ON** again
8. Open the LinkTool web application in your browser.

> [!IMPORTANT]
> The steps associated with a RAM Pack use significantly reduce a known issue with RAM pack data loss events!

### 2. Select the Slot/Pack to Read/Upload

Before connecting, choose which Slot/Pack you want to upload:

- Click the **"Slot"** selection button to toggle between **Slot B:** and **Slot C:**
- The default selection is Slot B:
- The button will display your current selection

> [!TIP]
> If you're unsure which Slot contains your data, start with Slot B: as it's the most commonly used.

### 3. Prepare the Psion Organiser II

**Important**: To avoid timeout issues, prepare your Psion Organiser II *before* connecting in the tool.

1. On your Psion Organiser, navigate to the main menu.
2. Select **COMMS**.
3. Select **BOOT**.
4. Navigate to **NAME:** (leave it blank — no name is required).
5. **Stop here** — do not press EXE yet!

> [!IMPORTANT]
> The Organiser II has a limited time window of 10 seconds to establish communication with the LinkTool after you press EXE. By navigating to the **NAME:** prompt first, you'll be ready to press the **EXE** button immediately after the LinkTool starts searching for the Organiser II device.

### 4. Connect and Start the Upload

Now that your Psion Organiser II is ready at the **NAME:** prompt:

1. Click the **"Connect"** button in the web application.
2. Your browser will display a serial port selection dialog.
3. Select the COM port corresponding to your serial port/USB Serial adapter connected to your Organiser.
4. **Wait for the tool to display "Searching for Device..."** in the status area.
5. **Now press EXE** button on your Organiser to start the transfer.

The tool will immediately detect the device and begin the download process.

> [!TIP]
> If you press the EXE button before the LinkTool is searching, you may see a timeout error (`DEVICE READ ERROR`) after ~10 seconds. Simply press the Disconnect button in the LinkTool, return to the `NAME:` prompt on the Organiser II, and try again.

### 5. Monitor the Upload Progress

The LinkTool will automatically:

1. **Place boot code** into the Psion Organiser RAM.
2. **Transfer the pack data** from the selected pack OPK file.
3. Display real-time progress in the communication log.
4. Show a progress indicator as data is received.

You'll see messages in the log window showing:
- Boot injection progress (Pairs 0-6)
- Data transfer phases (HEADER and BODY)
- CRC verification results
- Completion status

> [!NOTE]
> The pack upload process typically takes 1–3 minutes depending on the pack size.  
> Do not disconnect or power off the Psion Organiser II during this process.

### 6. Save Your OPK File

Once the upload completes the OPK created from the pack is now temporarily stored in the browser:

1. The **"Save Pack"** button will become enabled.
2. Click **"Save Pack"** to store the OPK file to your computer.
3. Your browser will prompt you to save the file (default name: `yyyy-mm-dd mm-ss-uu pack_b.opk` or `pack_c.opk`).
4. Choose a location and save the file.

> [!TIP]
> Give your OPK file a descriptive name to help you identify its contents later (e.g., `yyyy-mm-dd mm-ss-uu my_contacts.opk`).

### 7. Disconnect

After saving your OPK file:

1. Click the **"Disconnect"** button to release the serial port.
2. You can now safely disconnect the serial cable from your Organiser II.

[Return to Contents](#contents)

---

## Writing Data to a Pack (Pack Download to Organiser II)

This section will guide you through writing an OPK file from your computer onto a physical data pack in your Psion Organiser II using the LinkTool web application.

### What You'll Need

- **Psion Organiser II**: With COMMS Link and free slot (Slot B: or Slot C:)
- **Writeable Data Pack**: RAM, Flash, or blank EPROM Data Pack to be placed in Slot B: or C: when instructed
- **Power Supply**: Recommended (Mains adapter or fresh 9V battery)
- **Serial Connection**: USB-to-serial adapter and cable to connect to your computer
- **Software Requirements**: Compatible web browser (Chrome 89+, Edge 89+, Firefox 151+ or Opera 75+)

> [!TIP]
> **WHICH PACKS CAN BE WRITTEN?**  
> You can write to **RAM**, **Flash**, and blank (Formatted in a UV Eraser) **EPROM** Data packs:
> - **RAM & Flash Data packs**: Can be formatted and rewritten electronically directly by the tool. These types support faster data writing.
> - **EPROM Data packs**: Must already be blank (Formatted/erased under a UV lamp) before writing. They cannot be erased electronically by software. Do not place newly UV formatted packs in the Organiser until instructed by the LinkTool (they must be unsized).

---

## Step-by-Step Guide to Writing a Data Pack

### 1. Prepare Your Hardware

1. Select the [type of pack](#formatting-data-packs) to store the OPK, EPROM, RAM or Flash data pack.
2. Power off the Psion Organiser.
3. Remove any RAM Packs!
4. Insert the COMMS Link into the Top Slot.
5. Connect your Psion Organiser II to your computer using the serial adapter and/or COMMS Link cable.
   - **Recommended**: Plug in a mains adaptor to the COMMS Link.
6. Turn the Organiser **ON**, to automatically install the COMMS Link software press the **ON/CLEAR** key twice.
7. Remove the data pack you wish to write to from the Organiser II (Wait until instructed to insert).
8. Open the LinkTool web application in your browser.

> [!IMPORTANT]
> The steps associated with a RAM Pack use significantly reduce a known issue with RAM pack data loss events!

### 2. Switch to Write Mode and Select Your OPK File

Before connecting, select Write mode and choose the file you want to put on your pack:

1. Click the **"R/W Toggle"** button to switch from Read to **Write** mode. The button will display `Mode: WRITE`.
2. Click the **"Select File"** button.
3. A file window will open on your computer.
4. Select the **.OPK file** you wish to write and click **Open**.
5. The tool will check your file and display the file name and size in the log.
6. Click the **"Slot"** select button to choose **Slot B:** or **Slot C:** to match the slot available for your blank pack.

> [!IMPORTANT]
> DO NOT insert the blank data pack yet, wait until prompted!

> [!TIP]
> Make sure the Slot selected on the button (**Slot B:** or **Slot C:**) matches the physical slot where you intend to insert the blank pack when prompted.

### 3. Prepare the Psion Organiser II

**Important**: Just like when reading a pack, prepare your Psion Organiser II *before* **Connecting** in the web tool:

1. On your Psion Organiser II, navigate to the main menu.
2. Select **COMMS**.
3. Select **BOOT**.
   - `NAME:` will be displayed (leave it blank — no name is required).
4. **Stop here** — do not press EXE yet!

> [!IMPORTANT]
> The Organiser has a limited time window to connect after you press EXE. By navigating to the `NAME:` prompt first, you will be ready to press EXE immediately after the web application starts searching for the device. Reducing potential timeout of the Organiser II before the link is completed.

### 4. Connect and Start the Transfer

Now that your Psion Organiser II is waiting at the **NAME:** prompt:

1. Click the **"Connect"** button in the web application.
2. Your browser will display a serial port selection dialog.
3. Select the COM port corresponding to your serial adapter and click **"Allow"** or other browser dialog window button to confirm the selected serial port.
4. **Wait for the web application to display "Searching for Device..."** in the status area.
5. **Now press EXE** on your Psion Organiser II to start communication.

The tool will immediately connect to your Organiser II and prepare it for writing.

> [!TIP]
> If you press the EXE button before the LinkTool is searching, you may see a timeout error (`DEVICE READ ERROR`) after ~10 seconds. Simply press the Disconnect button in the LinkTool, return to the `NAME:` prompt on the Organiser II, and try again.

### 5. Insert Blank Pack and Confirm

Once the initial connection is made, a confirmation window dialog will appear on your screen:

> **Example Dialog Prompt:**  
> *"Insert a blank 16 K byte Data Pack into slot B: to write MyFile.OPK to.  
> Click Continue to begin the download phase."*

1. Make sure your blank data pack is firmly inserted into the chosen slot.
2. Take your time: the tool automatically keeps the connection alive while this window is open, so there is no rush!
3. Click the **"Continue"** button.

> [!IMPORTANT]
> The data pack inserted to receive an OPK file must match the size detailed!  
> *The data pack size is specified in the OPK file.*

> [!TIP]
> If you changed your mind or need to cancel, click the **"Cancel"** button to abort without modifying your pack.

### 6. Sizing and Writing Progress

The web application will now handle the entire write process automatically:

1. **Sizing:** The tool will first Size the pack to confirm it's blank and determine its memory size. This takes only 2 to 3 seconds for small RAM & Flash packs, or up to 60 to 120 seconds for larger EPROM packs and multi-segment packs up to 2 MB (128 segments of 16 KB). Active keep-alive handshaking ensures the serial connection remains held throughout the traversal.
2. **Writing:** The tool will then stream your OPK file data onto the pack. Each block is automatically checked and verified as it is written.
3. **Progress Tracking:** You can watch the live progress bar and percentage display as data is written.

> [!NOTE]
> The writing process typically takes 1 to 3 minutes depending on the file size. Do not unplug cables, remove the pack, or turn off the Organiser while writing is taking place!

### 7. Finalization and Disconnect

When the writing is finished:

1. The web application will finalize the pack data so your Organiser II can immediately recognize all records.
2. The status will display **"Download Complete! Pack written successfully!"**.
3. The web application will automatically release the connection, and your Psion Organiser II will return to `WAITING FOR LINK` or its main menu.
4. Click the **"Disconnect"** button if it is still enabled.

### 8. Writing Bootable Packs (Deferred Activation & Crash Prevention)

If you are programming a **bootable pack** (an image containing auto-executing utilities or operating system extensions):

- **Automatic Crash Protection**: In previous systems, programming a bootable pack could cause the Psion Organiser II to trigger a fatal hardware `TRAP` error while erasing the pack. This happened because the Organiser's background timer would see the bootable flag on empty silicon and attempt to execute unwritten memory.
- **LinkTool Safe Deferred Programming**: LinkTool automatically suppresses bootable flags during formatting and sector erasing (`NOBOOT = 1`). Your Organiser II remains completely stable and cannot crash during the write cycle.
- **Header Commit & Silicon Adaptation**: The true bootable status is safely committed at the very end of writing once all data chunks are 100% written and verified. 
- **Silicon Adaptation for Flashpacks**: Images with bootable flags (such as `0x2C`) are automatically adapted to the canonical hardware flag (`0x26`) required by Flash silicon, ensuring the Organiser II OS boots the pack without requiring manual editing of the OPK file.

[Return to Contents](#contents)

---

## What is an OPK File?

An **OPK file** is a binary image of an Organiser II data pack. It contains:

- **Magic header**: (`OPK`) identifying the file format
- **Length field**: Indicating the size of the pack data
- **Pack data**: The actual contents of your data pack
- **Terminator**: Marking the end of the file

OPK files can be viewed and edited using the **[OPK Editor](#additional-resources)** tool, which allows you to:
- Inspect the raw contents of the pack
- View and modify individual records
- Analyse the pack structure
- Export data in various formats

[Return to Contents](#contents)

---

## Troubleshooting

### Connection Issues

**Problem: Browser doesn't show any serial ports**
- **Solution:**
  - Ensure your serial adapter is properly connected and drivers are installed
  - Check Device Manager (Windows) to verify the adapter is recognized
  - Ensure you're using a compatible browser (Chrome 89+, Edge 89+, Firefox 151+ or Opera 75+)
  - Try unplugging and replugging the serial adapter

**Problem: "Failed to open serial port" error**
- **Solution:**
  - The port may be in use by another application. Close any terminal programs (PuTTY, Tera Term, etc.) or other applications that might be using the serial port
  - Check that you have permission to access the serial port
  - Try unplugging and replugging the serial adapter

### Transfer Issues

**Problem: Download stalls or times out**
- **Solution:**
  - Check the serial cable connections
  - Ensure the Psion Organiser II is in the COMMS | BOOT menu
  - Try disconnecting and reconnecting
  - Verify the correct pack is selected
  - Ensure EPROM data packs have been fully formatted by the UV eraser

**Problem: CRC errors in the log**

This may indicate communication errors, the tool will automatically retry failed message transfer, slowing down the transfer process.
- **Solution:**
  - Ensure the serial cable is in good condition i.e. not damaged
    - Undamaged connection contacts
    - High quality twisted pair & screened cables are used
  - Try reducing electrical interference near the cables, by:
    - Relocating cables
    - Reducing cable lengths
    - Turning off other devices
    - Turning off RF interference sources (e.g. Electrical devices, Mobiles, Walkie talkies / PMR etc.)

### Psion Organiser II Issues

**Problem: Psion shows "TRAP" error**
- **Solution:**
  - This may indicate a timing issue or buffer misalignment
  - Reset the Psion Organiser II and try again
  - Ensure you're using the correct boot sequence (COMMS → BOOT → NAME)
  - Remove any memory resident software such as Flash pack drivers or utilities
  - Ensure EPROM Data Packs have been fully formatted by the UV eraser

**Problem: Psion displays "ABORT: CODE 241", "ABORT: CODE 246", or "ABORT: CODE 193"**
- **Solution:**
  - **CODE 241 / 246 (NO PACK)**: The Organiser cannot detect a data pack in the chosen slot. Check that your pack is pushed firmly and all the way into Slot B: or Slot C:. Make sure the slot selected in the LinkTool (Slot B: or C:) matches where your data pack is physically inserted. If needed, gently clean the pack's gold connector pins with a dry, soft cloth (Protect against Static electric discharge).
  - **CODE 193**: Communication error or low battery power. Make sure your serial cable is firmly plugged in and your Organiser has a fresh 9V battery or is connected to a mains power adapter.
  - Ensure EPROM Data Packs have been fully formatted by the UV eraser.

**Problem: Pack Writing pauses at the "Insert Blank Pack" window**
- **Solution:**
  - This window is designed to wait for you so that you have plenty of time to insert your pack. Once your pack is firmly seated in the slot, click the **"Continue"** button, or press **Enter** or **Space** on your keyboard.

**Problem: Organiser screen shows "WAITING FOR LINK" after writing**
- **Solution:**
  - This is completely normal! When writing is finished, the Organiser displays WAITING FOR LINK to show the session has concluded safely. Your pack is ready to use. You can safely disconnect the serial cable or press **ON/CLEAR** on the Organiser to return to your main menu.

[Return to Contents](#contents)

---

## Advanced Features

### Debug Mode

For troubleshooting or protocol analysis, you can enable debug mode:

1. Add `?debug=true` to the end of the LinkTool URL
2. Reload the page
3. The communication log will show detailed protocol information including:
   - Raw packet data
   - Timing information
   - Detailed state transitions

[Return to Contents](#contents)

### Serial Port Settings

The LinkTool uses the following default serial communication parameters:  
See the **COMMS | SETUP** menu item:

- **BAUD rate**: 9600
- **Data bits**: 8
- **Stop BITS**: 1
- **Parity**: None
- **Flow control**: XON
- **Protocol**: NONE

These settings match the default Organiser II Comms Link specifications and only need adjustment if they have been changed.

> [!TIP]
> Users who have previously used CL.EXE, Psi2Win or Org-Link may have the protocol set to PSION.

### COMMS Link Compatibility

Some very early COMMS Links do not support the BOOT protocol used by the tool. You can verify the COMMS Link version when it is in the Organiser using the `PEEKB(8441)` command entered into the Calculator Feature:

- **CALC:** `PEEKB(8441)`

Values of 17 (decimal) and above are compatible.

[Return to Contents](#contents)

---

## Next Steps

After downloading your pack to an OPK file, you can:

1. **Back up your data**: By storing the OPK file in safe locations, distanced from where used.
2. **View the pack contents**: Using the **[OPK Editor](#additional-resources)** tool.
3. **Transfer the pack to another Psion Organiser II**: By reversing the process.
4. **Archive multiple versions**: Create copies over time, don't create single points of failure.
5. **Verify the integrity**: Use the checksums and the CHECKSUM2 utility against your packs and data over time.
6. **Use methodical archival naming**: Standardized ISO file naming together with a dedicated change-log text file.

> [!TIP]
> **Implement the 3-2-3 Backup Rule**: Do not rely on just one "safe location." Keep at least three copies of your .OPK files. Store them on two different media types (e.g., your local PC hard drive and an external flash drive), and keep one copy off site or in a secure cloud storage environment to protect against physical hardware disasters.  
> You may want to keep a backup of your favourite tool(s) as well!

[Return to Contents](#contents)

---

## Formatting Data Packs

- **Formatter**: EPROM Data Pack Formatter / Software Format Engine
- **Data Pack**: RAM, Flash, or blank EPROM Data Pack

### Types Of Data Packs (Classic)

There are 3 types of classic solid-state data packs used with the Psion Organiser II:
- **EPROM** - Ultraviolet-erasable OTP Data Packs (8KB to 128KB).
- **RAM** - Battery-backed static RAM Data Packs (16KB to 256KB).
- **FLASH (EEPROM)** - Electrically Erasable Programmable Read-Only Memory Data Packs (64KB to 512KB).

#### Formatting & Programming Sequences

Each type requires specific preparation and programming procedures:

- **EPROM Data Packs**:
  - Must be exposed to short-wave ultraviolet light (UV-C 253.7nm) inside the classic Psion Data Pack Formatter (typically 30–45 minutes).
  - Cannot be erased electrically by the Psion Organiser II or LinkTool.
  - Requires 21V $V_{pp}$ programming voltage pulses generated by the Organiser's internal DC-DC converter.

- **RAM Packs**:
  - **Zero High Voltage**: Programmed using standard 5V $V_{cc}$; the 21V $V_{pp}$ line is never asserted.
  - **Instant Electronic Formatting**: Instantly cleared by rewriting the directory structure and zeroing obsolete records; no UV light or lengthy sector wipe is required.
  - **Data Loss Prevention Invariant**: Always turn off the Psion before inserting or removing RAM packs. After switching on, press **ON/CLEAR** twice to ensure OS pack vectors and power rails are cleanly initialized.
  - **Sizing Sequence**: When writing with the LinkTool, keep the RAM pack removed until prompted by the screen dialog. The tool electronically prepares and initializes the pack directly.

- **FLASH (Flashpak) Data Packs**:
  - **In-Circuit Sector Erasing**: Erased electronically in-circuit inside the Organiser II using command sequences (`$40` program, `$20`/`$D0` erase).
  - **12V Programming Rail**: Flashpaks step down the Organiser's 21V slot rail to 12.0V using internal zener diodes.
  - **Driver Requirement**: The Psion must have the Flashpak driver (`FLASH.OPK`) installed.
  - **Multi-Sector Pre-Program & Erase Loop**: Displays `BLOCK <n>/<total>` on the LCD. Each 16KB sector block is pre-programmed to `$00` under interrupts disabled (`SEI`) before pulse erasing.

---

### Solid-State Programming Architecture Flowchart

```
                             [ Solid-State Pack Detection ]
                                            |
                                            v
                             +-----------------------------+
                             |   JSR $3BA0: JEDEC Probe    |
                             |  Commands: $90 -> Read IDs  |
                             +-----------------------------+
                                       /          \
                        JEDEC Matched /            \ JEDEC Fails / No Response
                                     v              v
               +---------------------------+   +-------------------------------+
               | PATH B: Flashpak Engine   |   | PATH A: RAM / EPROM Engine    |
               | ($3841..$39FE)            |   | ($36E4..$37C7)                |
               +---------------------------+   +-------------------------------+
                             |                                 |
              +--------------+--------------+                  |
              |                             |                  v
              v                             v        +-------------------+
     [ Sector Pre-Prog ]           [ Sector Erase ]  | Inspect Header:   |
     - Writes $00 per cell         - Command $20/$D0 | BITA #$02 at $36E9|
     - 6000ms TX Silence           - Pulse 10ms      +-------------------+
     - LCD: "BLOCK <n>/256"        - Verify ($A0)              /       \
              |                             |                 /         \
              +--------------+--------------+      Bit 1 = 0 /           \ Bit 1 = 1
                             |                              v             v
                             v                     +---------------+ +---------------+
                   +-------------------+           |   RAM PACK    | |   UV EPROM    |
                   | Flash Data Pump   |           | - 5V Vcc only | | - 21V Vpp     |
                   | - Command $40     |           | - Direct RAM  | | - Pulsed      |
                   | - Verify $C0      |           | - Imm Req 0   | | - Imm Req 0   |
                   +-------------------+           +---------------+ +---------------+
                             |                              |                 |
                             v                              v                 v
                   +-----------------------------------------------------------------+
                   |           128-Byte Chunk Data Streaming Engine                  |
                   +-----------------------------------------------------------------+
                                                     |
                                                     v
                                   +-----------------------------------+
                                   | Directory Checksum Commit ($0008) |
                                   | Pointers committed when Bit 3 == 0|
                                   +-----------------------------------+
```

---

### Step-by-Step RAM Pack Programming Example

1. **Prepare Hardware**:
   - Disconnect any RAM packs currently in the device.
   - Insert the RS-232 Comms Link into the top slot.
   - Power on the Organiser and press **ON/CLEAR** twice.
2. **Setup LinkTool**:
   - In LinkTool, toggle **Mode: WRITE**.
   - Select your target `.OPK` file (e.g., `MYDATA.OPK`, 32KB).
   - Select the target slot (**Slot B:** or **Slot C:**).
   - On the Organiser, navigate to `COMMS -> BOOT -> NAME:`.
   - Click **Connect** in LinkTool, select the COM port, and press **EXE** on the Organiser.
3. **Insert RAM Pack**:
   - The LinkTool will display:  
     `"Insert a blank 32 K byte Data Pack into slot B: to write MYDATA.OPK to. Click Continue to begin the download phase."`
   - Insert your RAM pack into Slot B: and click **Continue**.
4. **Execution & Automatic Flag Conversion**:
   - The tool sends Trigger 1 (`[01 4F]`) and Trigger 2 (`[FF 01]`).
   - The bootloader inspects the RAM pack: detects `Bit 1 = 0`. Even if your `.OPK` file originated from an EPROM (`Target_Flags = 0x6A`), the bootloader automatically converts the header to `0x60` (RAM Pack).
   - The Organiser displays `MAKING A PACK` and immediately issues Data Request 0.
   - Chunks (128 bytes each) stream continuously with active progress tracking.
5. **Finalization**:
   - The directory header is written and verified.
   - The 16-bit directory checksum is stored at offset `$0008`.
   - The Organiser screen returns to `WAITING FOR LINK` or its main menu. Turn off the Organiser before removing your programmed RAM pack!

---

**"Sizing" Sequence:** Once formatted (erased) the data pack is ready for use either directly in the Organiser or when downloading a pack using the LinkTool. Data packs to be used with the LinkTool must be formatted and **only inserted when instructed** — Otherwise the Organisers built-in file system will Size the pack, writing markers onto the data pack ready for general record storage.

> [!IMPORTANT]
> The data pack inserted to receive an OPK file must match the size detailed in the OPK file!

> [!TIP]
> For the classic Formatter, ensure the EPROM data pack is oriented so that the EPROM window is near or in the centre of the drawer to place it away from the ends of the U.V. lamp.

> [!TIP]
> Ensure the EPROM quartz window is clean before formatting, removing any adhesive residue or grease that might reduce the effectiveness of the U.V. lamp.

> [!TIP]
> **TIP - Pack Not Blank / Data Pack Error**  
> The classic unit's 30 minute automatic timer may occasionally be insufficient to completely erase a data pack. If you experience this error — Reformat the EPROM data pack. (If taking multiples of cycles for 32k EPROMS — check the timer period or the U.V. bulb might require attention).

[Return to Contents](#contents)


---

## Additional Resources

- **Community Forum**: Visit [Organiser2 Forum](https://www.organiser2.com/) for discussions and support
- **Original Protocol Documentation**: [Jaap Scherphuis's Psion Page](https://www.jaapsch.net/psion/)
- **Organiser II WebTools**: [NFfP Tools Page](https://github.com/nofitnessforpurpose/WebTools)
- **NFfP Github**: [Curated View](https://nofitnessforpurpose.github.io/)

[Return to Contents](#contents)

---

## Legal Notice

All information is for indication only. No association, affiliation, recommendation, suitability, or fitness for purpose should be assumed or is implied. Registered trademarks are owned by their respective registrants.

- **License**: Creative Commons (with non-commercial restrictions on certain elements — see [source documentation](https://www.jaapsch.net/psion/))
- **Icons**: Lucide — [License](https://lucide.dev/license)
- **Copyright**: © Copyright 2026 NFfP — All Rights Reserved
