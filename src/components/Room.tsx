import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

const URL = "http://localhost:3000"

interface RoomProps {
    name: string;
    localVideoTrack: MediaStreamTrack | null;
    localAudioTrack: MediaStreamTrack | null;
}

export const Room = ({ 
    name, 
    localVideoTrack,
    localAudioTrack 
}: RoomProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lobby, setLobby] = useState(true);
    const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
    const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStream | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStream | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!name) {
            window.location.href = "/"
        }
        
        const socket = io(URL);
        
        socket.on("send-offer", async ({ roomId }) => {
            setLobby(false);

            const pc = new RTCPeerConnection();
            setSendingPc(pc);
            if (localVideoTrack) {
                pc.addTrack(localVideoTrack);
            }
            if (localAudioTrack) {
                pc.addTrack(localAudioTrack);
            }

            pc.onicecandidate = async (e) => {
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    })
                }
            }

            pc.onnegotiationneeded = async () => {
                const sdp = await pc.createOffer();
                pc.setLocalDescription(sdp);
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        })

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);

            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp);
            const sdp = await pc.createAnswer();
            pc.setLocalDescription(sdp);
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setReceivingPc(pc);
            setRemoteMediaStream(stream);

            window.pcr = pc;

            pc.onicecandidate = async (e) => {
                if (!e.candidate) return;
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId
                    })
                }
            }

            // pc.ontrack = (e) => {
            //     const { track, type } = e;
            //     if (type == "audio") {
            //         // setRemoteAudioTrack(track);
            //         stream.addTrack(track);
            //     } else {
            //         // setRemoteVideoTrack(track);
            //         stream.addTrack(track);
            //     }
            //     remoteVideoRef.current?.play();
            // }


            socket.emit("answer", {
                sdp,
                roomId
            })

            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-ignore
                remoteVideoRef.current.play();
            }, 5000)
        })

        socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);
            setSendingPc((pc) => {
                pc?.setRemoteDescription(remoteSdp);
                return pc;
            })
        })

        socket.on("lobby", () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            if (type == "sender") {
                setReceivingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc;
                })
            } else {
                setSendingPc(pc => {
                    pc?.addIceCandidate(candidate)
                    return pc;
                })
            }
        })
        
        setSocket(socket);

        return () => {
            socket.disconnect();
        }
    }, [name])

    useEffect(() => {
        if (localVideoRef.current && localVideoTrack) {
            localVideoRef.current.srcObject = new MediaStream([localVideoTrack!]);
            localVideoRef.current.play();
        } 
    }, [localVideoRef])

    return (
        <>
            Hi {name}
            {lobby && <div>Waiting for a partner...</div>}
            <video autoPlay ref={remoteVideoRef} width={400} height={400} />
            <video autoPlay width={400} height={400} ref={localVideoRef} />
        </>
    )
}