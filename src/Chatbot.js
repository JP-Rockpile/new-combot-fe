import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [userInput, setInput] = useState('');
    const [conversationIndex, setConversationIndex] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [conversation, setConversation] = useState([]);
    const [messageTypeLog, setMessageTypeLog] = useState([]);
    const [classType, setClassType] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => { // This useEffect hook runs once when the component mounts
        const fetchInitialMessage = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/chatbot/initial/'); // Adjust this URL to your GET endpoint
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setStartTime(Date.now());
                setMessages([{ text: data.message, sender: 'combot' }]); // Assuming 'data.message' is your initial message
                addMessageToConversation(data.message,'combot');
                addMessageTypeToLog(data.messageType);
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
            }
        };

        fetchInitialMessage();
    }, []);
    const fetchClosingMessage = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/chatbot/closing/');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            // Update the chat with the response from the closing endpoint
            setMessages(messages => [...messages, { text: data.message, sender: 'combot', isHtml: true }]);
            // Increment the conversation index
            setConversationIndex(conversationIndex + 1);
            addMessageToConversation(data.message,'combot');
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };
    useEffect(() => {
        // Scroll to the bottom every time messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessageToConversation = (message, sender) => {
        setConversation(prevConversation => [...prevConversation, { text: message, sender }]);
    };
    const addMessageTypeToLog = (messageType) => {
        setMessageTypeLog(prevConversation => [...prevConversation, { text: messageType }]);
    };
    const sendMessage = async (e) => {
        e.preventDefault();
        setMessages([...messages, { text: userInput, sender: 'user' }]);
        setInput('');
        addMessageToConversation(userInput,'user');
        const endTime = Date.now();
        const timeSpent = Math.round((endTime - startTime)/1000);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/chatbot/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userInput, index: conversationIndex, timer: timeSpent,
                    classType: classType, chatLog: conversation, messageTypeLog: messageTypeLog }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            // Add the response from the chatbot to the messages
            setConversationIndex(data.index);
            setClassType(data.classType);
            if(conversationIndex === 6){
                setMessages(messages => [...messages, { text: data.reply, sender: 'combot', isHtml: true}]);
            } else {
                setMessages(messages => [...messages, { text: data.reply, sender: 'combot' }]);
            }

            addMessageToConversation(data.reply,'combot');
            addMessageTypeToLog(data.messageType);
            if(conversationIndex === 5){
                const delay = Math.random() * (4000 - 2000) + 3000;

                setTimeout(async () => {
                    await fetchClosingMessage();
                }, delay);
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };

    return (
        <div className="chatbot">
            <div className="messages">
                {messages.map((message, index) => (
                    message.text && ( // Only proceed if message.text is not an empty string
                        <div key={index} className={`message ${message.sender}`}>
                            {message.isHtml ? (
                                <div dangerouslySetInnerHTML={{ __html: message.text }} />
                            ) : (
                                message.text
                            )}
                        </div>
                    )
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form className="message-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default Chatbot;
