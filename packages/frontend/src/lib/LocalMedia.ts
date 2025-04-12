export class LocalMedia {
  private audioStream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private isVideoEnabled = false;
  private isAudioEnabled = false;
  private isScreenEnabled = false;

  public async getAudioStream(): Promise<MediaStream> {
    if (!this.audioStream) {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }
    this.isAudioEnabled = true;
    return this.audioStream;
  }

  public stopAudioStream() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    this.isAudioEnabled = false;
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
    this.isVideoEnabled = true;
    return this.videoStream;
  }

  public stopVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
    }
    this.isVideoEnabled = false;
  }
  public async getScreenStream(): Promise<MediaStream> {
    if (!this.screenStream) {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true,
      });
    }
    this.isScreenEnabled = true;
    return this.screenStream;
  }

  public stopScreenStream() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
    this.isAudioEnabled = true;
  }

  public isVideoStreamActive() {
    return this.isVideoEnabled;
  }
}
