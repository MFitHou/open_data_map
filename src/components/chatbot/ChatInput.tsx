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

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface ChatInputProps {
  onMessageSent?: (message: string, response: string) => void;
  placeholder?: string;
  apiUrl?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onMessageSent,
  placeholder = "Ask me anything about Vietnam's locations, landmarks, or geography...",
  apiUrl = 'http://localhost:3000/chat/main'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setIsLoading(true);
    setResponse('');

    try {
      // Using POST method with body
      const url = `${apiUrl}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          contents: userMessage
        })
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      
      // Parse the response structure
      let botResponse = 'No response received';
      
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
            botResponse = textParts;
          }
        }
      } else if (data.response || data.message) {
        // Handle simple response format (fallback)
        botResponse = data.response || data.message;
      }
      
      setResponse(botResponse);
      
      if (onMessageSent) {
        onMessageSent(userMessage, botResponse);
      }
      
      setInputValue('');
    } catch (err) {
      console.error('Chat API Error:', err);
      setResponse('⚠️ Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          className="chat-input"
        />
        <button 
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
        </button>
      </div>
      {response && (
        <div className="chat-response">
          <strong>Response:</strong>
          <div className="markdown-content">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
