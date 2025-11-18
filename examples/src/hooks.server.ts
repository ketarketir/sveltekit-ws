import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { WebSocketHelper } from './lib/websocket';

const initWs: Handle = async ({ event, resolve }) => {
  event.locals.ws = new WebSocketHelper(event);
  return resolve(event);
}

export const handle: Handle = sequence(initWs);
