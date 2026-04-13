import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import '../styles/Copilot.css';



const Copilot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageBase64, setSelectedImageBase64] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { sender: 'bot', type: 'text', text: "Hi! I'm Campus Copilot 🤖. I can help you find library books, study notes, or process your whiteboard images. What's on your mind today?" }
            ]);
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImageBase64(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (val) => {
        const textQuery = typeof val === 'string' ? val : input.trim();
        const imagePayload = selectedImageBase64;

        if (!textQuery && !imagePayload) return;

        const newUserMsg = { sender: 'user', type: 'text', text: textQuery };
        if (imagePayload) newUserMsg.image = imagePayload;

        setMessages(prev => [...prev, newUserMsg]);
        setInput('');
        setSelectedImage(null);
        setSelectedImageBase64(null);
        setIsTyping(true);

        try {
            if (imagePayload) {
                const res = await api.post('/copilot/image', { image: imagePayload, text: textQuery });
                const taskId = res.taskId;
                const placeholderId = Date.now().toString();
                setMessages(prev => [...prev, { id: placeholderId, sender: 'bot', type: 'thinking', text: 'Processing whiteboard image...' }]);
                pollImageTask(taskId, placeholderId);
            } else {
                const res = await api.post('/copilot/ask', { query: textQuery });
                setMessages(prev => [...prev, { sender: 'bot', ...res }]);
                setIsTyping(false);
            }
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'bot', type: 'error', text: 'Sorry, I ran into a connection issue.' }]);
            setIsTyping(false);
        }
    };

    const pollImageTask = (taskId, messageId) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/copilot/image/status/${taskId}`);
                if (res.status === 'complete') {
                    clearInterval(interval);
                    setMessages(prev => prev.map(msg =>
                        msg.id === messageId ? { sender: 'bot', type: 'markdown', text: res.text, isVisionResult: true } : msg
                    ));
                    setIsTyping(false);
                } else if (res.status === 'error') {
                    clearInterval(interval);
                    setMessages(prev => prev.map(msg =>
                        msg.id === messageId ? { sender: 'bot', type: 'error', text: res.error } : msg
                    ));
                    setIsTyping(false);
                }
            } catch (e) {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 2000);
        setTimeout(() => clearInterval(interval), 60000);
    };

    return (
        <div className="fade-in copilot-page">
            <PageHeader title="Campus Copilot" subtitle="AI Assistant for your academic journey" />
            
            <div className="copilot-chat-container">
                <div className="messages-display">
                    {messages.map((msg, i) => (
                        <div key={i} className={`msg-row msg-${msg.sender}`}>
                            <div className="msg-bubble">
                                {msg.image && <img src={msg.image} alt="upload" className="attachment-preview" />}
                                {msg.type === 'thinking' ? (
                                  <div className="flex items-center gap-2 text-sm text-secondary">
                                    <Spinner size="sm" /> {msg.text}
                                  </div>
                                ) : (
                                  <div className="prose">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                  </div>
                                )}
                                {msg.isVisionResult && <Badge text="Indexed" color="green" />}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="msg-row msg-bot">
                            <div className="msg-bubble"><Spinner size="sm" /></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="copilot-footer">
                    {selectedImage && (
                        <div className="selected-image-bar">
                            <img src={selectedImageBase64} alt="preview" />
                            <button onClick={() => setSelectedImage(null)}>&times;</button>
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chat-input-row">
                        <label className="icon-btn">
                            📎
                            <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                        </label>
                        <input 
                          value={input} 
                          onChange={e => setInput(e.target.value)} 
                          placeholder="Ask anything..." 
                          className="chat-input"
                        />
                        <button type="submit" className="send-btn" disabled={!input.trim() && !selectedImage}>
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Copilot;
