import ReactDOMServer from 'react-dom/server';
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { webpack } from 'webpack'
import React from 'react'
import express from 'express';
import { glob } from 'glob';

const cache: { [key: string]: { contentPath: string, component: any } } = {}

function render(template: any, filename: string, props: object, callback: (e?: any, string?: string) => void) {
  const cached = cache[filename]
  const element = React.createElement(cached.component.default, props)
  const reactHtml = ReactDOMServer.renderToString(element)
  callback(null, template({ reactScriptPath: cache[filename].contentPath, reactHtml: reactHtml, reactProps: JSON.stringify(props) }))
}

function compilerFactory(viewDirectory: string, filename: string, bundleName: string) {
  const config = {
    mode: "production" as "production",
    entry: {
      index: filename,
    },
    output: {
      path: path.join(viewDirectory, '..', 'dist'),
      filename: `${bundleName}.js`,
      library: {
        name: "App",
        type: "umd",
      }
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    externals: {
      react: {
        commonjs: "react",
        commonjs2: "react",
        amd: "React",
        root: "React"
      },
      "react-dom": {
        commonjs: "react-dom",
        commonjs2: "react-dom",
        amd: "ReactDOM",
        root: "ReactDOM"
      }
    },
    module: {
      rules: [
        {
          test: /(\.tsx?$)/,
          use: [{
            loader: "babel-loader", options: {
              "presets": ["@babel/env", "@babel/react", "@babel/typescript"],
            }
          }],
          exclude: /node_modules/,
        },
        {
          test: /(\.jsx?$)/,
          use: [{
            loader: "babel-loader", options: {
              "presets": ["@babel/env", "@babel/react"],
            }
          }],
          exclude: /node_modules/, 
        }
      ],
    },
  };
  return webpack(config)
}

async function compileFile(filename: string, viewDirectory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const relativePath = path.relative(viewDirectory, filename)
    const ext = path.parse(relativePath).ext
    const bundleName = relativePath.replace(path.delimiter, "_").replace(ext, "")
    const compiler = compilerFactory(viewDirectory, filename, bundleName)

    compiler.run((err, stats) => {
      if (err) {
        reject(err)
      }
      compiler.close((err, res) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  })

}

function renderFileFactory(viewDirectory: string) {
  const indexTemplate = Handlebars.compile(fs.readFileSync(path.join(viewDirectory, 'templates/layout.hbs')).toString())
  const errorTemplate = Handlebars.compile(fs.readFileSync(path.join(viewDirectory, 'templates/layout.hbs')).toString())

  return (filename: string, options: { props: object }, callback: (e?: any, string?: string) => void) => {
    if (!cache[filename]) {
      const bundleName = path.relative(viewDirectory, filename)
        .replace(path.delimiter, "_")
        .replace(path.parse(filename).ext, "")
      const contentPath = `react-ssr/${bundleName}.js`

      import(filename).then(component => {
        cache[filename] = { contentPath, component }
        render(indexTemplate, filename, options.props, callback)
      })

    } else {
      render(indexTemplate, filename, options.props, callback)
    }
  }
}

async function asyncForEach<T>(array: T[], callback: (v: T, i: number, array: T[]) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
    resolve()
  })
}

export interface ReactSSROptions {

}

export async function registerReactSSREngine(app: express.Application, viewDirectory: string, options?: ReactSSROptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const renderFile = renderFileFactory(viewDirectory)

    app.use('/react-ssr', express.static(path.join(viewDirectory, '..', 'dist')))
    app.set('views', viewDirectory);
    if (process.env.NODE_ENV == "test") {
      app.set('view engine', 'tsx');
      app.engine('tsx', (path: string, options: object, callback) => callback(null, "<html></html>"))
    } else if (process.env.NODE_ENV != "production") {
      app.set('view engine', 'tsx');
      app.engine('tsx', renderFile);
    } else {
      app.set('view engine', 'js');
      app.engine('js', renderFile)
    }

    glob(viewDirectory + "/**/!(*.test).+(js|jsx|ts|tsx)", null, async function (er, files) {
      await asyncForEach(files, async file => {
        console.log("Compiling " + file)
        await compileFile(file, viewDirectory)
        console.log("Compiled " + file)
      });
      resolve()
    })
  })
}