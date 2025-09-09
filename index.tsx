import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const App: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const newChat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: 'You are Zano, a powerful AI assistant created by Ayan Ali. Your responses should be helpful, concise, and infused with a touch of personality. You are not just a tool, but an intelligent companion.',
          },
        });
        setChat(newChat);
      } catch (e) {
        console.error(e);
        setError("Failed to initialize the AI. Please check the API key.");
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    chatWindowRef.current?.scrollTo({
      top: chatWindowRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chat) return;

    const userMessage: Message = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = userInput;
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      const stream = await chat.sendMessageStream({ message: messageToSend });

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text += chunkText;
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while getting the response. Please try again.');
      setMessages(prev => prev.slice(0, -1)); // Remove placeholder
    } finally {
      setIsLoading(false);
    }
  };

  const ZanoLogo: React.FC = () => (
    <div style={styles.logoContainer}>
      <div style={styles.logoOrb}></div>
      <h1 style={styles.logoText}>Zano</h1>
    </div>
  );

  const TypingIndicator: React.FC = () => (
     <div style={{...styles.messageBubble, ...styles.modelBubble}}>
        <div style={styles.typingDot}></div>
        <div style={{...styles.typingDot, animationDelay: '0.2s'}}></div>
        <div style={{...styles.typingDot, animationDelay: '0.4s'}}></div>
     </div>
  );

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <ZanoLogo />
      </header>
      <main ref={chatWindowRef} style={styles.chatWindow}>
        {messages.length === 0 && !isLoading && (
          <div style={styles.welcomeContainer}>
            <ZanoLogo />
            <p>Your powerful AI assistant.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} style={msg.role === 'user' ? styles.userMessageContainer : styles.modelMessageContainer}>
            <div style={{...styles.messageBubble, ...(msg.role === 'user' ? styles.userBubble : styles.modelBubble)}}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'model' && (
             <div style={styles.modelMessageContainer}><TypingIndicator /></div>
        )}
        {error && <div style={styles.errorText}>{error}</div>}
      </main>
      <footer style={styles.footer}>
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask Zano anything..."
            style={styles.inputField}
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button type="submit" style={styles.sendButton} disabled={isLoading || !userInput.trim()} aria-label="Send message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
        <p style={styles.creatorText}>Created by Ayan Ali</p>
      </footer>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
      `}</style>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'var(--card-bg)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoOrb: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #fff, var(--accent-color))',
    boxShadow: `0 0 15px var(--accent-glow), 0 0 25px var(--accent-glow)`,
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: 0,
    color: 'var(--text-primary)',
  },
  chatWindow: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  welcomeContainer: {
    textAlign: 'center',
    margin: 'auto',
    color: 'var(--text-secondary)',
  },
  messageBubble: {
    padding: '12px 18px',
    borderRadius: '18px',
    maxWidth: '80%',
    lineHeight: '1.5',
    animation: 'fadeIn 0.3s ease-out',
  },
  userMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modelMessageContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  userBubble: {
    backgroundColor: 'var(--user-bubble-bg)',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  modelBubble: {
    backgroundColor: 'var(--model-bubble-bg)',
    color: 'var(--text-primary)',
    borderBottomLeftRadius: '4px',
  },
  typingDot: {
      width: '8px',
      height: '8px',
      margin: '0 2px',
      backgroundColor: 'var(--text-secondary)',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'typing 1.4s infinite ease-in-out both',
  },
  footer: {
    padding: '10px 20px 15px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  inputForm: {
    display: 'flex',
    gap: '10px',
  },
  inputField: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '25px',
    border: 'none',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
  },
  sendButton: {
    backgroundColor: 'var(--accent-color)',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  creatorText: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '10px',
    marginBottom: 0,
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
  },
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
