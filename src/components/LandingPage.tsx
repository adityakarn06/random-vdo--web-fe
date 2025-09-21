import { useEffect, useRef, useState } from "react"
import { Room } from "./Room";

export const LandingPage = () => {
    const [name, setName] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [joined, setJoined] = useState(false);

    const getCameraAndMic = async () => {
        try {
            const stream = await window.navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];
            if (!videoTrack || !audioTrack) {
                alert("Please allow access to camera and microphone");
                return;
            }
            setLocalVideoTrack(videoTrack);
            setLocalAudioTrack(audioTrack);
            if (!videoRef.current) {
                return;
            }
            videoRef.current.srcObject = new MediaStream([videoTrack]);
            videoRef.current.play();
        } catch (err) {
            console.error(err);
            alert("Please allow access to camera and microphone");
        }
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCameraAndMic();
        }
    }, [videoRef])

    if (!joined){
        return (
            <div>
                <h1>Welcome to Omegle Clone</h1>
                <video autoPlay ref={videoRef} width={400}></video>
                <div>
                    <input type="text" onChange={(e) => {
                        setName(e.target.value)
                    }} />
                    <button onClick={() => {
                        if (!name) {
                            alert("Please enter your name");
                            return;
                        }
                        if (!localVideoTrack) {
                            alert("Please allow access to camera and microphone");
                            return;
                        }
                        setJoined(true);
                    }}>Join</button>
                </div>
                
            </div>
        )
    }

    return <Room name={name} localVideoTrack={localVideoTrack} localAudioTrack={localAudioTrack} />
}