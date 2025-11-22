/**
 * Copyright (C) 2025 MFitHou
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getApiEndpoint } from '../../config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faRobot, 
  faUser, 
  faSpinner,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/Chatbot.css';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I am your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Using POST method with body
      const apiUrl = getApiEndpoint.chat();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          contents: userMessage.content
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse the response structure
      let botResponseText = 'Sorry, I could not process your request.';
      
      if (Array.isArray(data) && data.length > 0) {
        // Handle array response format
        const firstItem = data[0];
        if (firstItem.content?.parts && Array.isArray(firstItem.content.parts)) {
          // Extract text from parts array
          const textParts = firstItem.content.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('\n');
          if (textParts) {
            botResponseText = textParts;
          }
        }
      } else if (data.response || data.message) {
        // Handle simple response format (fallback)
        botResponseText = data.response || data.message;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponseText,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to chat service');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '⚠️ Sorry, I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chatbot-container">
      {error && (
        <div className="chatbot-error">
          <FontAwesomeIcon icon={faXmark} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-avatar">
              <FontAwesomeIcon 
                icon={message.isUser ? faUser : faRobot} 
              />
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.isUser ? (
                  message.content
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
              <div className="message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot-message">
            <div className="message-avatar">
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className="message-content">
              <div className="message-text typing-indicator">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input-container">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about Vietnam's locations, landmarks, or geography..."
          disabled={isLoading}
          className="chatbot-input"
        />
        <button 
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-btn"
          title="Send message"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
