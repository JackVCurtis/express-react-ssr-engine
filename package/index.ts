import path from 'path'
import express, { Application } from 'express'

import { compile } from './compiler'
import { renderFnFactory } from './renderer'


export interface ReactSSROptions {
  externals: object
}

export class ReactSSREngine {
  constructor(private viewDirectory: string, private options?: ReactSSROptions) { }
  registerOn(app: Application) {
    const renderFile = renderFnFactory(this.viewDirectory)

    app.use('/react-ssr', express.static(path.join(this.viewDirectory, '..', 'dist')))
    app.set('views', this.viewDirectory);
    
    if ((process as any)[Symbol.for('ts-node.register.instance')] || process.env.NODE_ENV == "test") {
      app.set('view engine', 'tsx');
      app.engine('tsx', renderFile);
    } else {
      app.set('view engine', 'js');
      app.engine('js', renderFile)
    }
  }

  async compile() {
    await compile(this.viewDirectory, this.options)
  }
}