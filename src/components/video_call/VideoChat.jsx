import React, {useState, useEffect, useRef} from 'react';
import VideoCall from './VideoCall';
import io from "socket.io-client";

import "../../sass/chat/chat.scss";

import Video from './Video';
import { Caller, Available, OnlineUsers } from './PeerConnections';
import SessionNotes from './SessionNotes';

const Chat = () => {
    const [chatSession, setChatSession] = useState({
        partnerStream: null,
        partnerData: null,
        userStream: null,
        userId: null
    });

    const [callData, setCallData] = useState({
        receivingCall: false,
        caller: {
            id: '',
            name: '',
            signal: null,
            stream: false
        },
        callAccepted: false,
    });
    const [ coachOnline, updateOnline ] = useState({});
    const [ usersOnline, updateOnlineUsers ] = useState([]);
    const [callController, setCallController] = useState(false);
    
    const socket = useRef();
    const setUserStream = stream => setChatSession({...chatSession, userStream: stream});
    const setPartnerStream = stream => setChatSession({...chatSession, partnerStream: stream});

    useEffect(() => {
        socket.current = io.connect(`${process.env.REACT_APP_BACKEND}`);
        socket.current.on("init", id => {
          setCallController( new VideoCall(id, socket) );
          setChatSession({...chatSession, userId: id });
        });
        socket.current.on("coachOnline", (coach) => {
          updateOnline({...coach});
        });
        socket.current.on("usersOnline", (users) => {
          console.log('Incoming User Data', users)
          updateOnlineUsers([...usersOnline, ...users]);
        });
        socket.current.on("aClient", () => console.log("I'm a Client"));
        socket.current.on("aCoach", () => console.log("I'm a Coach"));
        socket.current.on("callRequest", (data) => {
          setCallData({...callData, caller: { 
              id: data.from, name: data.from, signal: data.signal
            }
           });
        });
      }, []);
    return ( 
        <div className='chat-container'>
            <h1>CoachMe Live Chat</h1>
            <div className='videos'>
                <Video user='self' setUserStream={setUserStream} />
                { chatSession.partnerStream && <Video user={callData.caller} stream={chatSession.partnerStream} callController={callController} /> }
            </div>
            <div className='button-container'>
              { callData.caller.signal && <Caller  caller={ callData.caller } answer={ callController.acceptCall } userStream={ chatSession.userStream } answerCallback={ setPartnerStream } /> }
              { callController && Object.entries(coachOnline).length && <Available available={ coachOnline } userStream={ chatSession.userStream } userId={ chatSession.userId } callPeer={ callController.callPeer } setPartnerStream={ setPartnerStream } /> }
              { usersOnline.length > 0 && <OnlineUsers users={[...usersOnline]} userStream={ chatSession.userStream } userId={ chatSession.userId } callPeer={ callController.callPeer } setPartnerStream={ setPartnerStream } /> }
            </div>
            <div className='session-note-section'>
              <SessionNotes />
            </div>
        </div>
    );
}

export default Chat;