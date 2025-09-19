import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

const URL = "http://localhost:3000"

export const Room = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const name = searchParams.get("name");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lobby, setLobby] = useState(true);

    useEffect(() => {
        if (!name) {
            window.location.href = "/"
        }
        
        const socket = io(URL);
        
        socket.on("send-offer", ({roomId}) => {
            setLobby(false);
            socket.emit("offer", {
                sdp: "",
                roomId,
            })
        })

        socket.on("offer", ({ roomId, offer }) => {
            setLobby(false);
            socket.emit("answer", {
                sdp: "",
                roomId,
            })
        })

        socket.on("answer", ({ roomId, answer }) => {
            setLobby(false);
        })

        socket.on("lobby", () => {
            setLobby(true);
        })
        
        setSocket(socket);

        return () => {
            socket.disconnect();
        }
    }, [name])

    if (lobby) {
        return (<>
            In Lobby... Waiting for other user to join
        </>)
    }

    return (
        <>
            Hi {name}
            <video width={400} height={400} />
            <video width={400} height={400} />
        </>
    )
}