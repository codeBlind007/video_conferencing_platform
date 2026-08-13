export const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

export function createPeerConnection(
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onTrack: (event: RTCTrackEvent) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection(rtcConfiguration);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    onTrack(event);
  };

  return pc;
}
