import { Hono } from 'hono'
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'hono/streaming'
import { env } from 'hono/adapter'

import { streamText as aiStreamText } from 'ai';
const app = new Hono()

const getModel = (c: any) => {
  const { API_KEY } = env<{ API_KEY: string }>(c)
  const anthropic = createAnthropic({
    apiKey: API_KEY,
  });
  return anthropic('claude-3-5-sonnet-20240620');
}

app.get('/', async (c) => {
  const { textStream } = await aiStreamText({
    model: getModel(c),
    prompt: 'who are you?',
  });
  return streamText(c, async (stream) => {
    for await (const textPart of textStream) {
      await stream.write(textPart);
    }
  })
})

app.get('/prompt', async (c) => {
  const prompt = c.req.query('p');
  const { textStream } = await aiStreamText({
    model: getModel(c),
    prompt,
  });
  return streamText(c, async (stream) => {
    for await (const textPart of textStream) {
      await stream.write(textPart);
    }
  })
})

export default app
