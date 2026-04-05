import { Logger } from '@/utils'

import type { StoragePort } from '../ports';

export class VideoService {
  private readonly logger = new Logger('VideoService');

  private sessionId!: string;
  private startTimeMs = 0;
  private lastChunkTimeMs = 0;
  private vttContent = "WEBVTT\n\n";
  private segments: string[] = [];
  private _isUploading = false;
  private pendingUploads: Promise<void>[] = [];

  constructor(
    private readonly storagePort: StoragePort
  ) {}

  get isUploading() {
    return this._isUploading;
  }

  async initializeStream(sessionId: string): Promise<void> {
    if (this._isUploading) throw new Error('Stream already in progress');
    
    this.sessionId = sessionId;
    this.startTimeMs = Date.now();
    this.lastChunkTimeMs = this.startTimeMs;
    this.vttContent = "WEBVTT\n\n";
    this._isUploading = true;
    this.segments = [];
    this.pendingUploads = [];
    
    await this.updatePlaylist();
    this.logger.info('HLS stream initialized', { sessionId });
  }

  async uploadPart(clientPartNumber: number, chunkData: Uint8Array): Promise<void> {
    if (!this._isUploading) throw new Error('Stream not initialized or already completed');
    
    // Store the segment directly in its native WebM format
    const segmentName = `segment_${String(clientPartNumber)}.webm`;
    const key = `${this.sessionId}/video/${segmentName}`;

    const nowMs = Date.now();
    const startSec = (this.lastChunkTimeMs - this.startTimeMs) / 1000;
    const endSec = (nowMs - this.startTimeMs) / 1000;
    this.lastChunkTimeMs = nowMs;

    const formatTime = (sec: number) => {
      const h = Math.floor(sec / 3600).toString().padStart(2, '0');
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
      return `${h}:${m}:${s}.${ms}`;
    };

    const now = new Date(nowMs);
    const hour = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const date = now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    this.vttContent += `${formatTime(startSec)} --> ${formatTime(endSec)} line:0 position:100% align:right\n${this.sessionId}\n${hour} ${date}\n\n`;

    this.logger.debug('Uploading segment', { segmentName });
    const uploadPromise = this.storagePort.upload(key, chunkData, 'video/webm');
    const vttPromise = this.storagePort.upload(`${this.sessionId}/video/signature.vtt`, this.vttContent, 'text/vtt');
    
    this.pendingUploads.push(uploadPromise);
    this.pendingUploads.push(vttPromise);
    await uploadPromise;

    this.segments.push(segmentName);
    await this.updatePlaylist();
  }

  private async updatePlaylist(): Promise<void> {
    const playlist = {
      sessionId: this.sessionId,
      isUploading: this._isUploading,
      segments: this.segments
    };

    // Create and replace the manifest with the updated available pieces
    const key = `${this.sessionId}/video/playlist.json`;
    await this.storagePort.upload(key, JSON.stringify(playlist), 'application/json');
  }

  async finishUpload(): Promise<void> {
    if (!this._isUploading) return;
    
    await Promise.all(this.pendingUploads);
    this._isUploading = false;

    await this.updatePlaylist();
    this.logger.info('Finishing HLS stream', { sessionId: this.sessionId, totalSegments: this.segments.length });
  }

  async abortPart(): Promise<void> {
    await this.finishUpload();
  }
}