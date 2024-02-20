import React, { useState, useEffect } from 'react';
import './Chatbot.css';

function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [userInput, setInput] = useState('');
    const [conversationIndex, setConversationIndex] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [conversation, setConversation] = useState([]);

    useEffect(() => { // This useEffect hook runs once when the component mounts
        const fetchInitialMessage = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/chatbot/initial/'); // Adjust this URL to your GET endpoint
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setStartTime(Date.now());
                setMessages([{ text: data.message, sender: 'combot' }]); // Assuming 'data.message' is your initial message
                addMessageToConversation(data.message,'combot');
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
            }
        };

        fetchInitialMessage();
    }, []);
    const fetchClosingMessage = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/chatbot/closing/');
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
    const addMessageToConversation = (message, sender) => {
        setConversation(prevConversation => [...prevConversation, { text: message, sender }]);
    };
    const sendMessage = async (e) => {
        e.preventDefault();
        setMessages([...messages, { text: userInput, sender: 'user' }]);
        setInput('');
        addMessageToConversation(userInput,'user');
        const endTime = Date.now();
        const timeSpent = Math.round((endTime - startTime)/1000);

        try {
            const response = await fetch('http://localhost:8000/api/chatbot/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userInput, index: conversationIndex, timer: timeSpent, chatLog: conversation }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            // Add the response from the chatbot to the messages
            console.log(data);
            setConversationIndex(data.index)
            setMessages(messages => [...messages, { text: data.reply, sender: 'combot' }]);
            addMessageToConversation(data.reply,'combot');
            if(conversationIndex === 1){
                const delay = Math.random() * (5000 - 3000) + 3000;

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
