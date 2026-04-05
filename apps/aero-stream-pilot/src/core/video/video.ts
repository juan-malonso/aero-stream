// apps/aero-stream-pilot/src/core/video/video.ts

import { AeroStreamPipe } from "../pipe/pipe.js";

type EventListener = (...args: any[]) => void;

export class AeroStreamVideo {
    private events: { [key: string]: EventListener[] } = {};
    private mediaStream: MediaStream | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private chunkCounter: number = 1;

    constructor(pipe: AeroStreamPipe) {
        this.on('data', (data: Blob) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Create a new buffer: 4 bytes for the ID + video chunk size
                const chunk = reader.result as ArrayBuffer;
                const totalSize = 4 + chunk.byteLength;
                const packet = new Uint8Array(totalSize);

                // Setup the DataView to write the part number at the start
                const view = new DataView(packet.buffer);
                
                try {
                    // Set part number as little-endian uint32 (Bytes 0-3)
                    view.setUint32(0, this.chunkCounter++, true);
                    packet.set(new Uint8Array(chunk), 4);

                    // Convert binary packet to Base64 to reduce JSON payload size
                    let binaryString = '';
                    const chunkSize = 8192;
                    for (let i = 0; i < packet.length; i += chunkSize) {
                        binaryString += String.fromCharCode.apply(null, packet.subarray(i, i + chunkSize) as unknown as number[]);
                    }

                    // Send the structured object
                    pipe.send({ 
                        type: 'VIDEO',
                        chunk: btoa(binaryString),
                    });
                } catch (error) {
                    console.error("Binary packet construction failed:", error);
                }
            };

            // CRITICAL: Changed from readAsDataURL to readAsArrayBuffer
            reader.readAsArrayBuffer(data);
        });
    }

    on(event: string, listener: EventListener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event: string, listener: EventListener) {
        if (!this.events[event]) {
            return;
        }
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    private emit(event: string, ...args: any[]) {
        if (!this.events[event]) {
            return;
        }
        this.events[event].forEach(listener => listener(...args));
    }

    async start(mediaStream: MediaStream) {
        try {
            this.chunkCounter = 1;
            this.mediaStream = mediaStream;
            this.mediaRecorder = new MediaRecorder(this.mediaStream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.emit('data', event.data);
                }
            };

            this.mediaRecorder.start(500); // Segment into 0.5s chunks
        } catch (error) {
            console.error('Error starting video recording:', error);
            this.emit('error', error);
        }
    }

    stop() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        this.mediaStream = null;
        this.mediaRecorder = null;
    }
}
