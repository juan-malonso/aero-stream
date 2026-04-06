import type { AeroStreamPipe } from "../pipe/pipe.js";

type EventListener = (...args: unknown[]) => void;

export class AeroStreamVideo {
    private readonly events: Record<string, EventListener[] | undefined> = {};
    private readonly mediaStream: MediaStream;

    private mediaRecorder: MediaRecorder | null = null;
    private chunkCounter = 1;

    constructor(pipe: AeroStreamPipe, stream: MediaStream) {
        this.mediaStream = stream.clone();
        this.on('data', (data: unknown) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (!this.mediaRecorder) return;

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

            reader.readAsArrayBuffer(data as Blob);
        });
    }

    on(event: string, listener: EventListener) {
        this.events[event] ??= [];
        this.events[event].push(listener);
    }

    off(event: string, listener: EventListener) {
        if (this.events[event] === undefined) {
            return;
        }
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    private emit(event: string, ...args: unknown[]) {
        if (this.events[event] === undefined) {
            return;
        }
        this.events[event].forEach(listener => { listener(...args); });
    }

    getLiveStream(): MediaStream {
        return this.mediaStream.clone();
    }

    start() {
        try {
            this.chunkCounter = 1;
            this.mediaRecorder = new MediaRecorder(this.mediaStream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (this.mediaRecorder && event.data.size > 0) {
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

        this.mediaStream.getTracks().forEach(track => { track.stop(); });
        this.mediaRecorder = null;
    }
}
