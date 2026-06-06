declare module 'hpp' {
  import type { RequestHandler } from 'express'
  function hpp(options?: { whitelist?: string[] }): RequestHandler
  export default hpp
}
