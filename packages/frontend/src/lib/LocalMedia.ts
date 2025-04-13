import { Store } from "@/store";
import { mediaActions } from "@/store/slices/media";

export class LocalMedia {
  private audioStream: MediaStream | null = null;
  private videoStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  constructor(private store: Store) {}

  public async getAudioStream(): Promise<MediaStream> {
    if (!this.audioStream) {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.store.dispatch(mediaActions.setAudioStream(this.audioStream));
    }

    return this.audioStream;
  }

  public stopAudioStream() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
      this.store.dispatch(mediaActions.removeAudioStream());
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
      this.store.dispatch(mediaActions.setVideoStream(this.videoStream));
    }
    return this.videoStream;
  }

  public stopVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
      this.store.dispatch(mediaActions.removeVideoStream());
    }
  }
  public async getScreenStream(): Promise<MediaStream> {
    if (!this.screenStream) {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true,
      });
      this.store.dispatch(mediaActions.setVideoStream(this.screenStream));
    }

    return this.screenStream;
  }

  public stopScreenStream() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
      this.store.dispatch(mediaActions.removeVideoStream());
    }
  }
}
