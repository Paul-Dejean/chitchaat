export class LocalMedia {
  private audioStream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  public async getAudioStream(): Promise<MediaStream> {
    if (!this.audioStream) {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }

    return this.audioStream;
  }

  public stopAudioStream() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }

  public async getVideoStream(): Promise<MediaStream> {
    if (!this.videoStream) {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      });
    }
    return this.videoStream;
  }

  public stopVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
    }
  }
  public async getScreenStream(): Promise<MediaStream> {
    if (!this.screenStream) {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true,
      });
    }

    return this.screenStream;
  }

  public stopScreenStream() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  public isVideoStreamActive() {
    return this.videoStream !== null;
  }
  public isAudioStreamActive() {
    return this.audioStream !== null;
  }
}
