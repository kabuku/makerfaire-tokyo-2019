import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

interface SignalingMessage {
  data?: string;
  what: 'offer' | 'answer' | 'message' | 'call' | 'addIceCandidate' | 'iceCandidate' | 'iceCandidates';
  options?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebrtcConnectionService {
  private iceCandidates: RTCIceCandidate[] = [];
  private ws: WebSocketSubject<SignalingMessage>;

  constructor() {
  }

  connect(targetHost: string, signalingServerPath: string): Observable<MediaStream> {
    let pc: RTCPeerConnection;

    const sub = new Subject<MediaStream>();
    const onTrack = (ev: RTCTrackEvent) => {
      console.log('track', ev);
      if (ev.track.kind === 'video') {
        sub.next(ev.streams[0]);
      }
      // sub.complete();
    };

    const onIceCandidate = (event) => {
      if (!event.candidate) {
        console.log('End of candidates.');
        return;
      }

      const candidate = {
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      };
      this.ws.next({
        what: 'addIceCandidate',
        data: JSON.stringify(candidate)
      });
    };

    if (this.ws && !this.ws.closed) {
      this.ws.complete();
    }

    this.ws = webSocket<SignalingMessage>({
      url: signalingServerPath,
      openObserver: {
        next: value => {
          pc = this.createPeerConnection(targetHost, {onTrack, onIceCandidate});
          this.ws.next({
            what: 'call',
            options: {
              force_hw_vcodec: true,
              vformat: 25,
              trickle_ice: true
            }
          });
        }
      },
      closeObserver: {
        next: value => {
          if (pc) {
            pc.close();
            pc = null;
          }

          if (sub) {
            sub.complete();
          }
        }
      }
    });

    let remoteDesc = false;

    this.ws.subscribe(msg => {
      switch (msg.what) {
        case 'offer':
          pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.data)))
            .then(() => pc.createAnswer({offerToReceiveVideo: true, offerToReceiveAudio: false, voiceActivityDetection: false}))
            .then((sessionDescription) => {

              remoteDesc = true;
              this.ws.next({
                what: 'answer',
                data: JSON.stringify(sessionDescription)
              });
              return pc.setLocalDescription(sessionDescription);
            })
            .catch(error => console.error(error));
          break;
        case 'answer':
          break;
        case 'iceCandidate': // when trickle is enabled
          if (!msg.data) {
            console.log('Ice Gathering Complete');
            break;
          }
          const elt = JSON.parse(msg.data);
          const candidate = new RTCIceCandidate({sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate});
          this.iceCandidates.push(candidate);
          if (remoteDesc) {
            this.addIceCandidates(pc);
          }
          break;

        case 'iceCandidates': // when trickle ice is not enabled

          const candidates = JSON.parse(msg.data);
          for (let i = 0; candidates && i < candidates.length; i++) {
            const elt = candidates[i];
            const candidate = new RTCIceCandidate({sdpMLineIndex: elt.sdpMLineIndex, candidate: elt.candidate});
            this.iceCandidates.push(candidate);
          }
          if (remoteDesc) {
            this.addIceCandidates(pc);
          }
          break;
        case 'message':
          if (msg.data.includes('Sorry')) {
            sub.error({ type: 'connectionError', msg: msg.data});
            this.ws.complete();
          }
          console.log(msg);
          break;
        default:
          console.log(msg);
          break;
      }
    });


    return sub;
  }

  private createPeerConnection(
    targetHost,
    options?: {
      onTrack?: (evt: RTCTrackEvent) => any,
      onDataChannel?: (ev: RTCDataChannelEvent) => any,
      onIceCandidate?: (ev: RTCPeerConnectionIceEvent) => any }): RTCPeerConnection {
    options = options || {};
    try {
      const pc = new RTCPeerConnection({iceServers: [{urls: ['stun:stun.l.google.com:19302', `stun:${targetHost.split(':')[0]}:3478`]}]});
      console.log('pc', pc);
      pc.ontrack = options.onTrack;
      pc.ondatachannel = options.onDataChannel;
      pc.onicecandidate = options.onIceCandidate;
      return pc;
    } catch (e) {
      console.error('createPeerConnection() failed', e);
    }
  }

  private addIceCandidates(pc: RTCPeerConnection) {
    this.iceCandidates.forEach((candidate) => {
      pc.addIceCandidate(candidate).then(
        () => {
          console.log('IceCandidate added: ' + JSON.stringify(candidate));
        }
      ).catch(error => {
        console.error('addIceCandidate error: ' + error);
      });
    });
    this.iceCandidates = [];
  }
}

