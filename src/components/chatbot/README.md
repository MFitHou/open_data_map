# AI Chatbot Component

## Overview
This is an AI-powered chatbot interface that connects to a chat API backend to provide intelligent responses to user queries.

## Features

✨ **Real-time Chat Interface**
- Beautiful gradient-based UI design
- Message history with timestamps
- User and bot avatars with Font Awesome icons
- Smooth animations and transitions
- Auto-scroll to latest messages
- **Markdown rendering for bot responses**

🤖 **AI Integration**
- Connects to API endpoint: `http://localhost:3000/chat/main`
- Sends user messages in JSON format with `contents` field
- Handles API responses and displays bot replies
- **Supports Markdown formatting in responses**
- Error handling with user-friendly messages

💬 **User Experience**
- Type messages and send with Enter key or button
- Loading indicator while waiting for bot response
- Clear chat history functionality
- Disabled input during message processing
- Responsive design for mobile and desktop
- **Rich text formatting** (bold, italic, lists, code blocks, etc.)

🎨 **Visual Features**
- Gradient headers and buttons
- Message bubbles with rounded corners
- Typing indicator animation
- Dark mode support (media query)
- Smooth hover and active states

## API Integration

### Request Format
```typescript
POST http://localhost:3000/chat/main
Content-Type: application/json
Accept: application/json

{
  "contents": "User's message here"
}
```

The user's message is sent in the request body as JSON with the field name `contents`.

### Expected Response Format
```typescript
// Array format (primary)
[
  {
    "content": {
      "parts": [
        {
          "text": "Bot's reply here"
        }
      ],
      "role": "model"
    },
    "finishReason": "STOP",
    "index": 0
  }
]

// Simple format (fallback)
{
  "response": "Bot's reply here"
}
// or
{
  "message": "Bot's reply here"
}
```

The component will first try to parse the array format with nested `content.parts[].text`, then fall back to simple `response` or `message` fields.

**Note:** Bot responses support Markdown formatting including:
- **Bold text** with `**text**`
- *Italic text* with `*text*`
- `Inline code` with backticks
- Code blocks with triple backticks
- Headers with `#`, `##`, `###`
- Lists (ordered and unordered)
- Links, blockquotes, and more

## Usage

### Accessing the Chatbot
Navigate to `/chatbot` route in the application:
- From home page, click "AI Chatbot" quick link
- Or directly visit: `http://localhost:5173/chatbot`

### Starting a Conversation
1. Type your message in the input field at the bottom
2. Press Enter or click the send button (paper plane icon)
3. Wait for the bot to respond (you'll see a "Thinking..." indicator)
4. Continue the conversation naturally

### Clearing Chat History
Click the trash icon in the header to clear all messages and start fresh.

## Component Structure

```
src/components/chatbot/
├── Chatbot.tsx       # Main component with chat logic
└── Chatbot.css       # Styles for the chatbot interface
```

## Customization

### Changing API Endpoint
Edit line 83 in `Chatbot.tsx`:
```typescript
const apiUrl = `http://localhost:3000/chat/main`;
```

### Modifying Request Body
Edit the body in the fetch request (lines 88-90):
```typescript
body: JSON.stringify({
  contents: userMessage.content,
  // Add more fields here if needed
  userId: '123',
  language: 'en'
})
```

### Changing Placeholder Text
Edit line 217 in `Chatbot.tsx`:
```typescript
placeholder="Ask me anything about Vietnam's locations, landmarks, or geography..."
```

### Styling
All styles are in `Chatbot.css`. Key sections:
- `.chatbot-header` - Top header with gradient
- `.chatbot-messages` - Message container
- `.user-message` / `.bot-message` - Message bubbles
- `.chatbot-input-container` - Input field and send button

### Colors
Main gradient colors can be changed in CSS:
```css
/* Primary gradient (header, user messages, buttons) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Bot avatar gradient */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
```

## Error Handling

The chatbot handles several error scenarios:

1. **API Connection Errors**: Shows error banner and error message in chat
2. **Network Issues**: Displays connection error message
3. **Invalid Responses**: Falls back to default error message
4. **Empty Messages**: Prevents sending empty messages

## Responsive Design

The interface automatically adapts to different screen sizes:
- **Desktop**: Full width up to 900px, side margins
- **Tablet**: Full width with adjusted spacing
- **Mobile**: Optimized layout with smaller avatars and buttons

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Requirements

- React 18+
- React Router DOM
- Font Awesome React component
- Backend API running on `http://localhost:3000`

## Development

### Running the Backend API
Make sure your chat API server is running:
```bash
# Start your API server
# It should accept POST requests on http://localhost:3000/chat/main
# with JSON body: { "contents": "message" }
```

### Testing the Chatbot
1. Start the React development server: `npm run dev`
2. Navigate to `http://localhost:5173/chatbot`
3. Type a test message and verify the API connection

### Testing API with curl (PowerShell)
```powershell
curl -X POST "http://localhost:3000/chat/main" `
  -H "Content-Type: application/json" `
  -d '{"contents": "What is Ho Chi Minh City"}'
```

### Testing API with fetch in Browser Console
```javascript
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
.then(data => console.log('Response:', data.response || data.message))
.catch(err => console.error('Error:', err));
```

## Troubleshooting

### "Failed to connect to chat service" Error
- Ensure the backend API is running on `http://localhost:3000`
- Check if CORS is properly configured on the backend
- Verify the API endpoint URL is correct

### Messages Not Sending
- Check browser console for errors
- Verify network connectivity
- Check if the API response format matches expected structure

### Styling Issues
- Clear browser cache
- Check if `Chatbot.css` is properly imported
- Verify Font Awesome icons are loaded

## License

This component is part of the MFitHou Open Data Map project and is licensed under the GNU General Public License v3.0.

---

**Note**: This chatbot requires a backend API server to function. Make sure the API is running and accessible before using the chatbot interface.
