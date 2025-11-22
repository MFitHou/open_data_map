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

// ============================================
// API ENDPOINT INFORMATION
// ============================================

/**
 * Base URL: http://localhost:3000/chat/main
 * Method: POST
 * Content-Type: application/json
 * 
 * Request Body:
 * {
 *   "contents": "User's message/question"
 * }
 * 
 * Example Request:
 * POST http://localhost:3000/chat/main
 * Content-Type: application/json
 * 
 * {
 *   "contents": "What is Hanoi"
 * }
 * 
 * Response Format (JSON):
 * 
 * Array format (primary):
 * [
 *   {
 *     "content": {
 *       "parts": [
 *         {
 *           "text": "Bot's reply message"
 *         }
 *       ],
 *       "role": "model"
 *     },
 *     "finishReason": "STOP",
 *     "index": 0
 *   }
 * ]
 * 
 * Simple format (fallback):
 * {
 *   "response": "Bot's reply message"
 * }
 * 
 * Alternative Simple Format:
 * {
 *   "message": "Bot's reply message"
 * }
 */

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Test with curl (PowerShell)
/*
curl -X POST "http://localhost:3000/chat/main" `
  -H "Content-Type: application/json" `
  -d '{"contents": "What is Ho Chi Minh City"}'
*/

// Example 2: Test with fetch in Browser Console
/*
fetch('http://localhost:3000/chat/main', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: 'Tell me about Vietnam'
  })
})
.then(res => res.json())
.then(data => {
  // Handle array response format
  if (Array.isArray(data) && data.length > 0) {
    const text = data[0].content?.parts?.[0]?.text;
    console.log('Response:', text);
  } else {
    // Handle simple format
    console.log('Response:', data.response || data.message);
  }
})
.catch(err => console.error('Error:', err));
*/

// Example 3: Advanced Request with Additional Fields
/*
fetch('http://localhost:3000/chat/main', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: 'What is the weather in Hanoi?',
    userId: '12345',
    language: 'en',
    timestamp: new Date().toISOString()
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
*/

// ============================================
// CHATBOT COMPONENT USAGE
// ============================================

/*
The Chatbot component automatically handles:
1. User input with placeholder: "Ask me anything about Vietnam's locations, landmarks, or geography..."
2. POST request to API with JSON body: { "contents": "user message" }
3. Response parsing (checks both 'response' and 'message' fields)
4. Error handling and loading states
5. Message history with timestamps

To use in your app:
import Chatbot from './components/chatbot/Chatbot';

// Add route in App.tsx:
<Route path="/chatbot" element={<Chatbot />} />
*/

export {};

