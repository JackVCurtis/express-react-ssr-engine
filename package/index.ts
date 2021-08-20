import path from 'path'
import express, { Application } from 'express'

import { compile } from './compiler'
import { renderFnFactory } from './renderer'
import { getStaticDir } from './filesystem'

export const DIST_ROUTE = '/erssr-dist'

export interface ReactSSROptions {
  externals?: object,
  fileExtension?: string
}

export class ReactSSREngine {
  constructor(private viewDirectory: string, private options?: ReactSSROptions) { }
  registerOn(app: Application) {
    const renderFile = renderFnFactory(this.viewDirectory)

    app.use(DIST_ROUTE, express.static(getStaticDir(this.viewDirectory)))
    app.set('views', this.viewDirectory);

    if (this.options && this.options.fileExtension) {
      app.set('view engine', this.options.fileExtension)
      app.engine(this.options.fileExtension, renderFile)
    } else {
      if ((process as any)[Symbol.for('ts-node.register.instance')]) {
        app.set('view engine', 'tsx');
        app.engine('tsx', renderFile);
      } else {
        app.set('view engine', 'js');
        app.engine('js', renderFile)
      }  
    }
  }

  async compile() {
    await compile(this.viewDirectory, this.options)
  }
}