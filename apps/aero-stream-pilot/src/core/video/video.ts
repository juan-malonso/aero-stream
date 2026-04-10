import { PipeMessageType } from "../model.js";
import type { AeroStreamPipe } from "../pipe/pipe.js";

import { 
    FaceLandmarker, 
    FilesetResolver, 
    HandLandmarker, 
    ObjectDetector 
} from "@mediapipe/tasks-vision";

type EventListener = (...args: unknown[]) => void;

interface Point { x: number; y: number; z?: number }
interface Category { categoryName: string; score: number }
interface BoundingBox { originX: number; originY: number; width: number; height: number }
interface Detection { boundingBox?: BoundingBox; categories: Category[] }

// Lista maestra de objetos permitidos
const ALLOWED_OBJECTS = [
    "cell phone", 
    "book", 
    "laptop", 
    "mouse", 
    "remote", 
    "keyboard",
    "bottle",
    "cup",
];

export class AeroStreamVideo {
    private readonly events: Record<string, EventListener[] | undefined> = {};
    private readonly mediaStream: MediaStream;
    private mediaRecorder: MediaRecorder | null = null;
    private chunkCounter = 1;

    private hiddenVideoEl: HTMLVideoElement;
    private ghostCanvasEl: HTMLCanvasElement;

    private faceLandmarker: FaceLandmarker;
    private handLandmarker: HandLandmarker;
    private objectDetector: ObjectDetector;
    
    private animationFrameId: number | null = null;
    private lastVideoTime = -1;
    
    private targetFPS = 12; 
    private fpsInterval = 1000 / this.targetFPS; 
    private lastProcessTime = 0;
    
    constructor(pipe: AeroStreamPipe, stream: MediaStream) {
        this.mediaStream = stream.clone();

        this.hiddenVideoEl = document.createElement('video');
        this.hiddenVideoEl.srcObject = this.mediaStream;
        this.hiddenVideoEl.autoplay = true;
        this.hiddenVideoEl.muted = true;
        this.hiddenVideoEl.playsInline = true;

        this.ghostCanvasEl = document.createElement('canvas');

        this.hiddenVideoEl.onloadedmetadata = () => {
            this.ghostCanvasEl.width = this.hiddenVideoEl.videoWidth;
            this.ghostCanvasEl.height = this.hiddenVideoEl.videoHeight;
            this.hiddenVideoEl.play().catch(console.error);
        };

        // Mocked Models
        this.faceLandmarker = {} as FaceLandmarker;
        this.handLandmarker = {} as HandLandmarker;
        this.objectDetector = {} as ObjectDetector;

        void this.initDetectors();

        this.on('data', (data: unknown) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (!this.mediaRecorder) return;
                const chunk = reader.result as ArrayBuffer;
                const totalSize = 4 + chunk.byteLength;
                const packet = new Uint8Array(totalSize);
                const view = new DataView(packet.buffer);
                try {
                    view.setUint32(0, this.chunkCounter++, true);
                    packet.set(new Uint8Array(chunk), 4);
                    let binaryString = '';
                    const chunkSize = 8192;
                    for (let i = 0; i < packet.length; i += chunkSize) {
                        binaryString += String.fromCharCode.apply(null, Array.from(packet.subarray(i, i + chunkSize)));
                    }
                    pipe.send({
                        type: PipeMessageType.videoEmit,
                        chunk: btoa(binaryString),
                    });
                } catch (error) {
                    console.error(error);
                }
            };
            reader.readAsArrayBuffer(data as Blob);
        });
    }

    private async initDetectors() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );

            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numFaces: 1
            });

            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 2
            });

            this.objectDetector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                scoreThreshold: 0.5,
                categoryAllowlist: ALLOWED_OBJECTS
            });

            this.lastProcessTime = performance.now();
            this.trackingLoop();
        } catch (error) {
            console.error("Error al iniciar los modelos de MediaPipe:", error);
        }
    }

    // --- NUEVO LOOP REFATORIZADO (Baja complejidad) ---
    private trackingLoop = () => {
        this.animationFrameId = requestAnimationFrame(this.trackingLoop);
        if (!this.areDetectorsReady()) return;

        const now = performance.now();
        const elapsed = now - this.lastProcessTime;
        if (elapsed <= this.fpsInterval) return;

        this.lastProcessTime = now - (elapsed % this.fpsInterval);
        
        try {
            this.processCurrentFrame(now);
        } catch { /* noop */ }
    };

    private areDetectorsReady(): boolean {
        return this.hiddenVideoEl.readyState >= 2;
    }

    private processCurrentFrame(timestamp: number) {
        const currentTime = this.hiddenVideoEl.currentTime;
        if (currentTime === this.lastVideoTime) return; // Early return
        
        this.lastVideoTime = currentTime;
        
        // Extraer datos
        const faceResults = this.faceLandmarker.detectForVideo(this.hiddenVideoEl, timestamp);
        const handResults = this.handLandmarker.detectForVideo(this.hiddenVideoEl, timestamp);
        const objectResults = this.objectDetector.detectForVideo(this.hiddenVideoEl, timestamp);

        const ctx = this.ghostCanvasEl.getContext('2d');
        if (ctx) {
            const w = this.ghostCanvasEl.width;
            const h = this.ghostCanvasEl.height;
            ctx.clearRect(0, 0, w, h);

            // Dibujar delegando a funciones pequeñas
            this.drawFaces(ctx, faceResults.faceLandmarks, w, h);
            this.drawHands(ctx, handResults.landmarks, w, h);
            this.drawObjects(ctx, objectResults.detections);
            
            // Emitir evento
            this.emit('liveTrackingData', {
                faces: faceResults.faceLandmarks,
                hands: handResults.landmarks,
                objects: objectResults.detections
            });
        }
    }

    private drawFaces(ctx: CanvasRenderingContext2D, faceLandmarks: Point[][] | undefined, w: number, h: number) {
        if (!faceLandmarks || faceLandmarks.length === 0) return;
        
        ctx.fillStyle = '#00FF00';
        for (const landmarks of faceLandmarks) {
            for (const point of landmarks) {
                ctx.fillRect(point.x * w, point.y * h, 1.5, 1.5);
            }
        }
    }

    private drawHands(ctx: CanvasRenderingContext2D, handLandmarks: Point[][] | undefined, w: number, h: number) {
        if (!handLandmarks || handLandmarks.length === 0) return;

        ctx.fillStyle = '#FF5722';
        for (const landmarks of handLandmarks) {
            for (const point of landmarks) {
                ctx.beginPath();
                ctx.arc(point.x * w, point.y * h, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    private drawObjects(ctx: CanvasRenderingContext2D, detections: Detection[] | undefined) {
        if (!detections || detections.length === 0) return;

        ctx.strokeStyle = '#FFEB3B';
        ctx.lineWidth = 2;
        ctx.font = "18px Arial";
        ctx.fillStyle = '#FFEB3B';

        for (const detection of detections) {
            if (!detection.boundingBox || detection.categories.length === 0) continue;

            const { originX, originY, width, height } = detection.boundingBox;
            const categoryName = detection.categories[0].categoryName;
            const score = Math.round(detection.categories[0].score * 100);

            ctx.strokeRect(originX, originY, width, height);
            ctx.fillText(`${categoryName} (${score.toString()}%)`, originX, originY > 20 ? originY - 5 : 20);
        }
    }

    on(event: string, listener: EventListener) {
        const listeners = this.events[event];
        if (listeners !== undefined) {
            listeners.push(listener);
        } else {
            this.events[event] = [listener];
        }
    }

    off(event: string, listener: EventListener) {
        const listeners = this.events[event];
        if (!listeners) return;
        this.events[event] = listeners.filter(l => l !== listener);
    }

    private emit(event: string, ...args: unknown[]) {
        const listeners = this.events[event];
        if (!listeners) return;
        listeners.forEach(listener => { listener(...args); });
    }

    getLiveStream(): MediaStream {
        return this.mediaStream;
    }

    getLiveCanvas(): HTMLCanvasElement {
        return this.ghostCanvasEl;
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
            this.mediaRecorder.start(500);
        } catch (error) {
            this.emit('error', error);
        }
    }

    stop() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.faceLandmarker.close();
        this.handLandmarker.close();
        this.objectDetector.close(); 

        this.mediaStream.getTracks().forEach(track => { track.stop(); });
        this.hiddenVideoEl.pause();
        this.hiddenVideoEl.srcObject = null;
        this.mediaRecorder = null;
    }
}