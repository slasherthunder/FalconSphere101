import { useEffect , useState} from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

export function GetUserID(){
    const [ID, setID] = useState("")

    useEffect(() => {
    socket.emit("GetID");
    
    }, []); 
    
    useEffect(() => {
    socket.on("SendID", (data) => {
        setID(data)
    });
    }, [socket]); 
    return ID;
}
