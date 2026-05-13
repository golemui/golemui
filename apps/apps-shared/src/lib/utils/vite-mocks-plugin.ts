import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { workspaceRoot } from '@nx/devkit'
import type { Plugin } from 'vite'

export function sharedMocksPlugin(): Plugin {
  const mocksDir = resolve(join(workspaceRoot, 'apps/apps-shared/src/lib/mocks'))
  return {
    name: 'apps-shared-mocks',
    configureServer(server) {
      server.middlewares.use('/assets/mocks', (req: any, res: any, next: any) => {
        const filePath = resolve(join(mocksDir, req.url ?? '/'))
        if (!filePath.startsWith(mocksDir)) { next(); return }
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          res.setHeader('Content-Type', 'application/json')
          createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })
    },
  }
}
