import { Container, getContainer } from '@cloudflare/containers'

/** Runs the Express API Docker image on Cloudflare Containers */
export class TwosideServer extends Container {
  defaultPort = 3001
  sleepAfter = '15m'
}

export interface Env {
  TWOSIDE_SERVER: DurableObjectNamespace<TwosideServer>
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.TWOSIDE_SERVER)
    return container.fetch(request)
  },
}
