class PhaseFormat {
    static async execute() {
        if (this.isStopped) return;
        let continueWriting = true;
        let isFirstRun = true;

        while (continueWriting && !this.isStopped) {
            // CRITICAL FIX: Transition to PACK_DOWNLOAD state FIRST, so handleFrame
            // correctly accumulates 0x18 and 0x19 into pendingRequests instead of dropping them.
            console.log(`[FORMAT WAIT] Transitioning FSM to PACK_DOWNLOAD.`);
            this.state = 'PACK_DOWNLOAD';
            this.sentFrameQueue = []; // Clean slate for Format phase

            this.onStatus('Waiting for Device Format completing...');
            console.log(`[FORMAT WAIT] Waiting for Format Keep-Alives (0x18)...`);

            // 1. Show Dialog to pause execution while user confirms
            let userConfirmed = false;
            let userCancelled = false;
            const dialogOverlay = typeof document !== 'undefined' ? document.getElementById('packDialogOverlay') : null;
            const dialogBtn = typeof document !== 'undefined' ? document.getElementById('packDialogBtn') : null;
            const cancelBtn = typeof document !== 'undefined' ? document.getElementById('cancelPackDialogBtn') : null;

            console.log(`[DATA] === TRACE: Reached Dialog Overlay Check. isFirstRun=${isFirstRun}, dialogOverlay=${!!dialogOverlay} ===`);

            let keyHandler = null;

            const cleanupDialogHandlers = () => {
                if (keyHandler && typeof window !== 'undefined') {
                    window.removeEventListener('keydown', keyHandler);
                    keyHandler = null;
                }
                if (typeof window !== 'undefined') {
                    window.confirmPackFormat = null;
                    window.cancelPackFormat = null;
                }
            };

            const doConfirm = () => {
                if (userConfirmed) return; // Idempotent
                console.log(`[FORMAT WAIT] >>> CONFIRM ACTION TRIGGERED! Setting userConfirmed = true. <<<`);
                userConfirmed = true;
                if (dialogBtn) dialogBtn.disabled = true;
                if (dialogOverlay) dialogOverlay.style.display = 'none';
                cleanupDialogHandlers();
                this.logger(`[FORMAT WAIT] User confirmed pack insertion. Initiating Download Phase...`, 'success');
            };

            const doCancel = () => {
                if (userCancelled) return;
                console.log(`[FORMAT WAIT] >>> CANCEL ACTION TRIGGERED! Setting userCancelled = true. <<<`);
                userCancelled = true;
                if (dialogOverlay) dialogOverlay.style.display = 'none';
                cleanupDialogHandlers();
                this.logger(`[FORMAT WAIT] User cancelled download phase.`, 'warn');
                if (typeof this.setPhase === 'function') {
                    this.setPhase('transfer', 'error', 'Download cancelled by user');
                }
            };

            // Register global functions so inline HTML attributes can invoke them reliably
            if (typeof window !== 'undefined') {
                window.confirmPackFormat = doConfirm;
                window.cancelPackFormat = doCancel;
            }

            const targetSlot = (this.packType || 'B').toUpperCase();
            const targetSizeKb = this.writePackSizeKb || (this.opkBuffer && this.opkBuffer.length >= 2 ? ((this.opkBuffer[1] >= 1 && this.opkBuffer[1] <= 128) ? this.opkBuffer[1] * 8 : Math.round(this.opkBuffer.length / 1024)) : 8);
            const targetFileName = this.writeFileName || 'Pack.OPK';
            const userPrompt = `Insert a blank ${targetSizeKb} K byte Data Pack into slot ${targetSlot}: to write ${targetFileName} to.`;

            if (dialogOverlay && dialogBtn) {
                const titleEl = (typeof document !== 'undefined' ? document.getElementById('packDialogTitle') : null) || dialogOverlay.querySelector('h3');
                const textEl = (typeof document !== 'undefined' ? document.getElementById('packDialogMessage') : null) || dialogOverlay.querySelector('p');

                if (titleEl) {
                    titleEl.innerText = `Insert Blank Pack (Slot ${targetSlot}:)`;
                }

                if (isFirstRun) {
                    this.logger(`[FORMAT WAIT] ${userPrompt}`, 'info');
                    if (textEl) {
                        textEl.innerHTML = `Insert a blank <strong>${targetSizeKb} K byte Data Pack</strong> into <strong>slot ${targetSlot}:</strong> to write <strong>${targetFileName}</strong> to.<br><br><span style="font-size: 0.9em; color: #ccc;">Click Continue to begin the download phase.</span>`;
                    }
                } else {
                    this.logger(`[FORMAT WAIT] Pack complete. Next pack: ${userPrompt}`, 'info');
                    console.log(`[DATA] === TRACE: Setting dialog text for subsequent run ===`);
                    if (textEl) {
                        textEl.innerHTML = `Insert a blank <strong>${targetSizeKb} K byte Data Pack</strong> into <strong>slot ${targetSlot}:</strong> to write <strong>${targetFileName}</strong> to.<br><br><span style="font-size: 0.9em; color: #ccc;">Insert the next pack, wait 2 seconds, and click Continue.</span>`;
                    }
                }

                // Wait 50ms for the browser to comfortably paint the Dialog Box AND safely buffer the Device's 66ms RX 10 Poll BEFORE we enter the critical loop
                console.log(`[DATA] === TRACE: Dialog DOM elements prepared, displaying synchronously ===`);
                dialogOverlay.style.display = 'flex';
                dialogOverlay.style.zIndex = '10000';
                dialogOverlay.style.visibility = 'visible';
                dialogBtn.disabled = false;
                dialogBtn.innerText = 'Continue to Download Phase';

                // Multi-channel event bindings (click, pointerdown, Enter/Space keypress, inline HTML)
                dialogBtn.onclick = doConfirm;
                dialogBtn.addEventListener('click', doConfirm);
                dialogBtn.addEventListener('pointerdown', doConfirm);

                if (cancelBtn) {
                    cancelBtn.onclick = doCancel;
                    cancelBtn.addEventListener('click', doCancel);
                }

                keyHandler = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        console.log(`[FORMAT WAIT] Key press detected (${e.key}). Triggering Confirm.`);
                        e.preventDefault();
                        doConfirm();
                    } else if (e.key === 'Escape') {
                        console.log(`[FORMAT WAIT] Escape key detected. Triggering Cancel.`);
                        e.preventDefault();
                        doCancel();
                    }
                };
                if (typeof window !== 'undefined') {
                    window.addEventListener('keydown', keyHandler);
                }
            } else {
                userConfirmed = true; // Fallback for headless
            }

            let readyForData = false;
            let formatWaitStart = Date.now();
            this.formatSignalSent = false;
            let lastPingTime = Date.now(); // Track when we last saw a live ping
            let lastPollSentTime = Date.now(); // Used to trigger 0x10 host-polls during pure silence

            // On second+ run (WAITING FOR LINK phase), we DO NOT reset the cached sync type!
            // The device has transitioned to WAITING FOR LINK after the EOF drain loop, but its
            // sequence index (e.g., 0x1A) remains parked in memory. The protocol documentation
            // states that the next Format Trigger MUST be sent using this exact sequence index.
            if (!isFirstRun) {
                console.log(`[FORMAT WAIT] WAITING FOR LINK: currentSyncType retained (0x${this.currentSyncType.toString(16).toUpperCase()}).`);

                // Flush any leftover requests from the previous data transfer (drain requests,
                // in-flight format-complete signals, etc.) so the new cycle starts clean.
                // A brief settle dwell lets the UART drain first.
                await this.sleep(200);
                this.pendingRequests.clear();
                this.lastFormatPayload = null;
                console.log(`[FORMAT WAIT] WAITING FOR LINK: pendingRequests flushed. Ready for next format trigger on User Confirm.`);
            }

            // DO NOT clear pendingRequests here, or we wipe the 0x10 Handshake Poll!

            let loopCounter = 0;
            while (!readyForData && !this.isStopped) {
                loopCounter++;
                if (loopCounter < 10 || loopCounter % 50 === 0) {
                    console.log(`[DATA] === TRACE: Inside while(!readyForData) loop - Iteration ${loopCounter} ===`);
                }
                if (userCancelled) {
                    console.log("[FORMAT WAIT] User Cancelled during Keep-Alive Loop.");
                    this.onComplete(false, null, 'Cancelled by user');
                    continueWriting = false;
                    break;
                }

                // If it takes longer than 15 minutes, bail out
                if (Date.now() - formatWaitStart > 900000) {
                    if (dialogOverlay) dialogOverlay.style.display = 'none';
                    throw new Error("Timeout waiting for Pack Format to complete (15 mins).");
                }

                // Periodic UI update
                let elapsedSec = Math.floor((Date.now() - formatWaitStart) / 1000);
                if (elapsedSec > 0 && elapsedSec % 5 === 0) {
                    this.onStatus(`Waiting for Device Format... ${elapsedSec}s`);
                }

                // Handle incoming Device Polls (0x10), Busys (0x08), or WAITING FOR LINK
                // keep-alives (0x00) while waiting. In WAITING FOR LINK the device sends
                // type 0x00 as its periodic keep-alive — it MUST be ACKed with 0x00.
                if (this.pendingRequests.has(0x08) || this.pendingRequests.has(0x00) || this.pendingRequests.has(0x10)) {
                    let type = this.pendingRequests.has(0x08) ? 0x08 : (this.pendingRequests.has(0x00) ? 0x00 : 0x10);
                    this.pendingRequests.delete(type);

                    // Treat 08/00/10 as valid pings for the silence timeout
                    lastPingTime = Date.now();

                    console.log(`[FORMAT WAIT] Device sent poll/ping (0x${type.toString(16).toUpperCase()}) during WAITING FOR LINK. Replying with Short ACK 00...`);
                    let ackPkt = ProtocolUtils.constructShortPacket(0x00, null);
                    this.addSentFrame(ackPkt);
                    await this.serial.write(ackPkt);
                    if (this.serial.drain) await this.serial.drain();
                }

                // Clear stale post-download data requests (0x01-0x07) — these arrive when
                // the device cycles its sequence counter past 0x1F after the data write.
                // 0x00 is handled above (keep-alive), so only clear 0x01-0x07 here.
                for (let t = 0x01; t <= 0x07; t++) {
                    this.pendingRequests.delete(t);
                }

                // Check if device is sending Format Keep-Alives (0x18-0x1F)
                // The device will send Request Packets with Length 0 indicating its current sequence state.
                let caughtPingType = -1;
                for (let type = 0x18; type <= 0x1F; type++) {
                    if (this.pendingRequests.has(type)) {
                        caughtPingType = type;
                        this.pendingRequests.delete(type);
                        break;
                    }
                }

                if (caughtPingType !== -1) {
                    this.currentSyncType = caughtPingType;
                    lastPingTime = Date.now(); // Keep-alive: record when we last saw a ping
                    let ackType = caughtPingType - 0x18;

                    console.log(`[FORMAT WAIT] Ping 0x${caughtPingType.toString(16).toUpperCase()} caught | userConfirmed: ${userConfirmed} | formatSignalSent: ${this.formatSignalSent}`);

                    if (!userConfirmed) {
                        // Protocol uses EXACT echo for Keep-Alive waiting.
                        const echoPayload = this.lastFormatPayload ? Array.from(this.lastFormatPayload).slice(1) : [0x00, 0x00];
                        console.log(`[FORMAT WAIT] Dialog Keep-Alive: Exact Echo 0x${caughtPingType.toString(16).toUpperCase()} with payload [${echoPayload.map(b => b.toString(16).padStart(2, '0')).join(' ')}].`);
                    
                        let ackPacket = ProtocolUtils.constructShortPacket(ackType, null);
                        let echoPacket = ProtocolUtils.constructLongPacket(caughtPingType, echoPayload);
                        
                        let atomicBurst = new Uint8Array(ackPacket.length + echoPacket.length);
                        atomicBurst.set(ackPacket, 0);
                        atomicBurst.set(echoPacket, ackPacket.length);

                        // Turnaround wait: Give Psion 6303 CPU 15ms to complete TX ISR and enter RX listen loop
                        await this.sleep(15);

                        // Register individual packets in Echo Suppression Queue
                        this.addSentFrame(ackPacket);
                        this.addSentFrame(echoPacket);
                    
                        await this.serial.write(atomicBurst);
                        if (this.serial.drain) await this.serial.drain();

                    } else if (!this.formatSignalSent) {
                        // FAST TRIGGER: We caught the fresh ping! Instantly fire Trigger 1.
                        console.log(`[FORMAT WAIT] Fresh Format Ping caught (0x${caughtPingType.toString(16).toUpperCase()}) and User Confirmed. Preparing Triggers...`);

                        // Turnaround wait: Give Psion 6303 CPU 15ms to complete TX ISR and enter RX listen loop
                        await this.sleep(15);

                        this.formatSignalSent = true;
                        this.pendingRequests.clear(); // Flush stale state

                        let trig1Type = caughtPingType;
                        let trig1Ack = trig1Type - 0x18;

                        let trig2Type = trig1Type + 1;
                        if (trig2Type > 0x1F) trig2Type = 0x18;
                        let trig2Ack = trig2Type - 0x18;

                        // 1. Send Trigger 1 INSTEAD of the Echo [00 00], using an Atomic Burst (ACK + Trig1)
                        console.log(`[FORMAT WAIT] Trigger 1/2: Sending 0x${trig1Type.toString(16).toUpperCase()} [01, 4F] with ACK 0x${ackType.toString(16).toUpperCase()}...`);

                        let ackPacketTrig = ProtocolUtils.constructShortPacket(ackType, null);
                        let pkt1 = ProtocolUtils.constructLongPacket(trig1Type, [0x01, 0x4F]);

                        // CRITICAL FIX: Do NOT add ackPacketTrig to sentFrameQueue!
                        // ackPacketTrig has type ackType (0x07 for 0x1F), and the Psion replies with ACK 0x07.
                        // Registering it in sentFrameQueue causes handleFrame to suppress the Psion's ACK as an echo.

                        let atomicTrig1 = new Uint8Array(ackPacketTrig.length + pkt1.length);
                        atomicTrig1.set(ackPacketTrig, 0);
                        atomicTrig1.set(pkt1, ackPacketTrig.length);

                        // Send Trigger 1 and ACK contiguously.
                        await this.serial.write(atomicTrig1);
                        if (this.serial.drain) await this.serial.drain();

                        // The device must ACK Trigger 1 OR send the Next Sequence Request (Implicit ACK).
                        // If it missed Trigger 1 due to line collision, it will re-transmit trig1Type!
                        let implicitAck1 = trig1Type + 1;
                        if (implicitAck1 > 0x1F) implicitAck1 = 0x18;

                        let trig1Retries = 0;
                        let matchedAck1 = null;
                        while (trig1Retries < 5) {
                            matchedAck1 = await this.waitForRequests([trig1Ack, implicitAck1, trig1Type], 1500, true);
                            if (matchedAck1 === trig1Ack || matchedAck1 === implicitAck1) {
                                break;
                            }
                            trig1Retries++;
                            console.log(`[FORMAT WAIT] Trigger 1 not acknowledged (got ${matchedAck1 !== null ? '0x' + matchedAck1.toString(16).toUpperCase() : 'timeout'}). Retransmitting Trigger 1 (attempt ${trig1Retries}/5)...`);
                            await this.sleep(15);
                            await this.serial.write(atomicTrig1);
                            if (this.serial.drain) await this.serial.drain();
                        }

                        if (matchedAck1 === null || matchedAck1 === trig1Type) {
                            throw new Error(`[FORMAT WAIT] Fatal Sequence Desync on Trigger 1. Expected ACK 0x${trig1Ack.toString(16).toUpperCase()} or Request 0x${implicitAck1.toString(16).toUpperCase()}.`);
                        }

                        console.log(`[FORMAT WAIT] Trigger 1 ACKed (Matched: 0x${matchedAck1.toString(16).toUpperCase()}).`);
                        let ackPkt2 = null;
                        if (matchedAck1 === implicitAck1) {
                            let impAck = implicitAck1 - 0x18;
                            console.log(`[FORMAT WAIT] Implicit ACK matched! Sending Short ACK 0x${impAck.toString(16).toUpperCase()} to maintain link before Trigger 2...`);
                            ackPkt2 = ProtocolUtils.constructShortPacket(impAck, null);
                            await this.serial.write(ackPkt2);
                            if (this.serial.drain) await this.serial.drain();
                        }

                        // 2. Send Trigger 2
                        // Extract target flags and size code from this.opkBuffer if available
                        let targetFlags = 0xFF;
                        let targetSize = 0x01;
                        if (this.opkBuffer && this.opkBuffer.length >= 2) {
                            if (this.opkBuffer.length >= 8 && this.opkBuffer[0] === 0x4F && this.opkBuffer[1] === 0x50 && this.opkBuffer[2] === 0x4B) {
                                targetFlags = this.opkBuffer[6];
                                targetSize = this.opkBuffer[7];
                            } else {
                                targetFlags = this.opkBuffer[0];
                                targetSize = this.opkBuffer[1];
                            }
                        }

                        console.log(`[FORMAT WAIT] Trigger 2/2: Sending 0x${trig2Type.toString(16).toUpperCase()} [${targetFlags.toString(16).padStart(2, '0').toUpperCase()}, ${targetSize.toString(16).padStart(2, '0').toUpperCase()}] (Target Flags: 0x${targetFlags.toString(16).padStart(2, '0').toUpperCase()})`);
                        let pkt2 = ProtocolUtils.constructLongPacket(trig2Type, [targetFlags, targetSize]);

                        await this.sleep(15);
                        await this.serial.write(pkt2);
                        if (this.serial.drain) await this.serial.drain();

                        // The device must ACK Trigger 2 OR send the Next Sequence Request (Implicit ACK).
                        // If it missed Trigger 2, it will re-transmit trig2Type.
                        let implicitAck2 = trig2Type + 1;
                        if (implicitAck2 > 0x1F) implicitAck2 = 0x18;

                        let trig2Retries = 0;
                        let matchedAck2 = null;
                        while (trig2Retries < 5) {
                            matchedAck2 = await this.waitForRequests([trig2Ack, implicitAck2, trig2Type], 1500, true);
                            if (matchedAck2 === trig2Ack || matchedAck2 === implicitAck2) {
                                break;
                            }
                            trig2Retries++;
                            console.log(`[FORMAT WAIT] Trigger 2 not acknowledged (got ${matchedAck2 !== null ? '0x' + matchedAck2.toString(16).toUpperCase() : 'timeout'}). Retransmitting Trigger 2 (attempt ${trig2Retries}/5)...`);
                            await this.sleep(15);
                            if (ackPkt2) {
                                await this.serial.write(ackPkt2);
                            }
                            await this.serial.write(pkt2);
                            if (this.serial.drain) await this.serial.drain();
                        }

                        let ack2 = (matchedAck2 !== null && matchedAck2 !== trig2Type);
                        if (ack2) {
                            console.log(`[FORMAT WAIT] Trigger 2 implicitly ACKed via Next Request 0x${implicitAck2.toString(16).toUpperCase()}! FORMATTING HAS BEGUN.`);
                            readyForData = true;
                        } else {
                            this.logger(`[FORMAT WAIT] Warning: No ACK for Trigger 2. Treating as success.`, 'warn');
                            readyForData = true;
                        }

                        // Flush pipes before long hardware wipe
                        this.pendingRequests.clear();
                    }
                } // <--- MUST CLOSE caughtPingType BLOCK HERE

                // WAITING FOR LINK polling is strictly for after the host has exhausted formatting
                const pingSilenceDurationMs = Date.now() - lastPingTime;

                // If we caught nothing, check if we need to poke
                if (caughtPingType === -1) {
                    if (Date.now() - lastPollSentTime > 1500) {
                        // Review and Comment Out: Wake Polls disabled during WAITING FOR LINK Phase and first run dialog.
                        // if (isFirstRun) {
                        //     console.log('[FORMAT WAIT] Sending 1.5s Wake Poll (0x10) to prod device...');
                        //     await this.sendWirePacket(ProtocolUtils.hex('1610020110101003005c'));
                        // } else {
                        //     console.log('[FORMAT WAIT] Sending 1.5s Wake Poll (0x10) to prod device...');
                        //     await this.sendWirePacket(ProtocolUtils.hex('1610020110101003005c'));
                        // }
                        lastPollSentTime = Date.now();
                    }
                }

                if (!userConfirmed) {
                    // Yield back to the browser GUI rendering thread and Web Serial buffer
                    await this.sleepYield();
                    continue;
                } else if (userConfirmed && !this.formatSignalSent) {
                    // The User clicked Confirm, but caughtPingType === -1 on this loop iteration.
                    // Yield and wait for the triggers to fire when the next format keep-alive ping arrives.
                    await this.sleepYield();
                    continue;
                }

                console.log(`[FORMAT WAIT] Memory format commands accepted...`);

                let formatComplete = false;
                let waitTime = 0;

                // Poll for up to 60 seconds
                while (waitTime < 60000) {
                    let caughtPing = -1;
                    let caughtPayload = null;
                    for (let type = 0x18; type <= 0x1F; type++) {
                        if (this.pendingRequests.has(type)) {
                            caughtPing = type;
                            caughtPayload = this.lastFormatPayload;
                            this.pendingRequests.delete(type);
                            break;
                        }
                    }

                    if (caughtPing !== -1) {
                        // Check the payload to distinguish Keep-Alive from Format Complete
                        const isFormatComplete = caughtPayload && caughtPayload.length >= 3 &&
                            caughtPayload[1] === 0x00 && caughtPayload[2] === 0x04;
                        const isKeepAlive = !isFormatComplete;

                        if (isFormatComplete) {
                            console.log(`[FORMAT WAIT] *** Format Complete signal (${caughtPing.toString(16).toUpperCase()} 00 04) received! EPROM wipe done. ***`);
                            // Re-inject so sendPackData inherits the sequence
                            this.pendingRequests.add(caughtPing);
                            formatComplete = true;
                            readyForData = true;
                            break;
                        } 
						// Keep alive during 
                        else if (isKeepAlive) {
                            // Keep-Alive: ACK + Echo payload to maintain link during long format
                            let keepAliveAck = caughtPing - 0x18;
                            let pingData = (caughtPayload && caughtPayload.length >= 3) ? Array.from(caughtPayload.slice(1)) : [0x00, 0x00];
                            console.log(`[FORMAT WAIT] Keep-Alive ping (${caughtPing.toString(16).toUpperCase()}). ACKing + Echoing [${pingData.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}] to maintain link...`);
                            await this.serial.write(ProtocolUtils.constructShortPacket(keepAliveAck, null));
                            await this.serial.write(ProtocolUtils.constructLongPacket(caughtPing, pingData));
                        }
                    }

                    // Handle unexpected Interrupt packets (0x08)
                    if (this.pendingRequests.has(0x08)) {
                        this.pendingRequests.delete(0x08);
                        console.log(`[FORMAT WAIT] Device sent Busy Interrupt (08). ACKing...`);
                        await this.serial.write(ProtocolUtils.constructShortPacket(0x00, null));
                    }

                    // Handle keep-alive polls (0x10) and link-hold pings (0x00) during
                    // the long EPROM wipe — these may arrive if the device cycles back to
                    // WAITING FOR LINK unexpectedly, or sends a standard host-poll while
                    // busy. ACK 0x10 with 0x00; ACK 0x00 with 0x00.
                    if (this.pendingRequests.has(0x10)) {
                        this.pendingRequests.delete(0x10);
                        console.log(`[FORMAT WAIT] Inner loop: Device Poll (0x10) during format. ACKing with 00...`);
                        await this.serial.write(ProtocolUtils.constructShortPacket(0x00, null));
                    }
                    if (this.pendingRequests.has(0x00)) {
                        this.pendingRequests.delete(0x00);
                        console.log(`[FORMAT WAIT] Inner loop: Device Keep-Alive (0x00) during format. ACKing with 00...`);
                        await this.serial.write(ProtocolUtils.constructShortPacket(0x00, null));
                    }

                    await this.sleep(40);
                    waitTime += 40;
                }

                if (!formatComplete) {
                    if (typeof this.setPhase === 'function') {
                        this.setPhase('transfer', 'error', 'Format timed out waiting for Psion device');
                    }
                    throw new Error("Psion Device timed out during formatting phase.");
                }

                break; // Break out of while(!readyForData) since formatting is complete

                // Allow IO and UI to breathe
                await this.sleep(40);
            }

            cleanupDialogHandlers();
            if (dialogOverlay) dialogOverlay.style.display = 'none';

            if (!continueWriting) {
                console.log(`[FORMAT WAIT] Exiting write loop due to user cancellation.`);
                break;
            }

            this.logger(`[FORMAT WAIT] Formatting complete. Starting data transfer...`, 'success');

            // Execute the Data Transfer
            await this.sendPackData();

            console.log(`[FORMAT WAIT] Data transfer complete. Finishing write session...`);
            continueWriting = false;
            break;

        } // End of while (continueWriting)

        console.log(`[DATA] === TRACE: Escaped continueWriting loop! ===`);

        // Cleanup after escaping the loop (only if not already completed by PhaseDownload)
        if (this.state !== 'IDLE' && this.onComplete) {
            this.onComplete(true, { sum: 0, crc32: 0 }, null);
        }
        console.log('[DATA] === Write Pack Session Fully Concluded ===');


    }
}

if (typeof module !== 'undefined') {
    module.exports = PhaseFormat;
}
