import { Hono } from 'hono'
import { createBunWebSocket } from 'hono/bun'

const { upgradeWebSocket, websocket } = createBunWebSocket()

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        <meta charset='UTF-8' />
        <title>Real-time Chat</title>
      </head>
      <body>
        <div id='chat-messages'></div>
        <input type='text' id='message-input' placeholder='Type a message...' />
        <button id='send-button'>Send</button>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        const ws = new WebSocket('ws://vps.sonnylab.com:3000/ws')
        const $chatMessages = document.getElementById('chat-messages')
        const $messageInput = document.getElementById('message-input')
        const $sendButton = document.getElementById('send-button')

        ws.onmessage = (event) => {
          const messageElement = document.createElement('p')
          messageElement.textContent = event.data
          $chatMessages.appendChild(messageElement)
          $chatMessages.scrollTop = $chatMessages.scrollHeight
        }

        function sendMessage() {
          const message = $messageInput.value.trim()
          if (message) {
            ws.send(message)
            $messageInput.value = ''
          }
        }

        $sendButton.onclick = sendMessage
        $messageInput.onkeypress = (event) => {
          if (event.key === 'Enter') {
            sendMessage()
          }
        }
        `,
          }}
        ></script>
      </body>
    </html>
  )
})

const connectedClients = new Set()

const ws = app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onOpen(_event, ws) {
        connectedClients.add(ws)
      },
      onMessage(ws) {
        // Broadcast the message to all connected clients
        for (const client of connectedClients as any) {
          (client as any).send(ws.data)
        }
      },
      onClose(ws) {
        connectedClients.delete(ws)
      },
    }
  })
)

Bun.serve({
  fetch: app.fetch,
  websocket,
})