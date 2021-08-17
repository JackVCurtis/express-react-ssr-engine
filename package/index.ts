import path from 'path'
import express from 'express'

import { compile } from './compiler'
import { renderFnFactory } from './renderer'

export interface ReactSSRCache {
  [key: string]: { contentPath: string, component?: any, hash?: string }
}

export interface ReactSSROptions {
  externals: object
}

const cache: ReactSSRCache = {}

export async function registerReactSSREngine(app: express.Application, viewDirectory: string, react: any, options?: ReactSSROptions): Promise<void> {
  await compile(viewDirectory, cache, options)
  const renderFile = renderFnFactory(cache, viewDirectory, react)

  app.use('/react-ssr', express.static(path.join(viewDirectory, '..', 'dist')))
  app.set('views', viewDirectory);
  
  if ((process as any)[Symbol.for('ts-node.register.instance')] || process.env.NODE_ENV == "test") {
    app.set('view engine', 'tsx');
    app.engine('tsx', renderFile);
  } else {
    app.set('view engine', 'js');
    app.engine('js', renderFile)
  }
}