import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { Stats, webpack } from 'webpack'
import express from 'express'
import { glob } from 'glob'

const cache: { [key: string]: { contentPath: string, component?: any, hash?: string } } = {}

function render(template: any, react: any, reactDomServer: any, viewDirectory: string, filename: string, props: object, callback: (e?: any, string?: string) => void) {
  const cached = cache[filename]
  const parsedFilename = path.parse(filename)
  const cachedStyle = cache[path.join(parsedFilename.dir.replace(viewDirectory, `${viewDirectory}/styles`), `${parsedFilename.name}.scss`)]
  const element = react.createElement(cached.component.default, props)
  const reactHtml = reactDomServer.renderToString(element)

  callback(null, template({
    reactScriptPath: cached.contentPath,
    reactHtml: reactHtml,
    reactProps: JSON.stringify(props),
    stylePath: cachedStyle ? cachedStyle.contentPath : ''
  }))
}

function compilerFactory(viewDirectory: string, filename: string, bundleName: string, options: ReactSSROptions) {
  const externals = Object.assign({
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
  }, options.externals)
  const config = {
    mode: "production" as "production",
    entry: {
      index: filename,
    },
    experiments: {
      asset: true
    },
    output: {
      path: path.join(viewDirectory, '..', 'dist'),
      filename: `${bundleName}.[hash].js`,
      publicPath: '/',
      library: {
        name: "App",
        type: "umd",
      },
      globalObject: 'this',
      assetModuleFilename: `${bundleName}.[hash].css`
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".sass", ".scss"]
    },
    externals: externals,
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
        },
        {
          test: /\.(sa|sc|c)ss$/,
          type: 'asset/resource',
          use: [
            "sass-loader",
          ],
        },
      ],
    },
  };
  return webpack(config)
}

async function compileFile(filename: string, viewDirectory: string, bundleName: string, options: ReactSSROptions): Promise<Stats> {
  return new Promise((resolve, reject) => {
    const compiler = compilerFactory(viewDirectory, filename, bundleName, options)

    compiler.run((err, stats) => {
      if (err) {
        reject(err)
      }
      compiler.close((err, res) => {
        if (err) {
          reject(err)
        }
        resolve(stats)
      })
    })
  })

}

function compiledFilename(filename: string, viewDirectory: string, hash: string): string {
  const ext = path.parse(filename).ext
  return filename.replace(viewDirectory, path.join(viewDirectory, '..', 'dist')).replace(ext, `.${hash}.js`)
}

function renderFileFactory(viewDirectory: string, react: any, reactDomServer: any, ) {
  const indexTemplate = Handlebars.compile(fs.readFileSync(path.join(viewDirectory, 'templates/layout.hbs')).toString())

  return (filename: string, options: { props: object }, callback: (e?: any, string?: string) => void) => {
    if (!cache[filename]?.component) {
      import(filename).then(component => {
        cache[filename].component = component
        render(indexTemplate, react, reactDomServer, viewDirectory, filename, options.props, callback)
      })

    } else {
      render(indexTemplate, react, reactDomServer, viewDirectory, filename, options.props, callback)
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
  externals: object
}

export async function registerReactSSREngine(app: express.Application, viewDirectory: string, react: any, reactDomServer: any, options?: ReactSSROptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const renderFile = renderFileFactory(viewDirectory, react, reactDomServer)

    app.use('/react-ssr', express.static(path.join(viewDirectory, '..', 'dist')))
    app.set('views', viewDirectory);
    if (process.env.NODE_ENV == "test") {
      app.set('view engine', 'tsx');
      app.engine('tsx', (path: string, options: object, callback) => callback(null, "<html></html>"))
    } else if ((process as any)[Symbol.for('ts-node.register.instance')]) {
      app.set('view engine', 'tsx');
      app.engine('tsx', renderFile);
    } else {
      app.set('view engine', 'js');
      app.engine('js', renderFile)
    }

    glob(viewDirectory + "/**/!(*.test).+(js|jsx|ts|tsx|scss)", null, async function (er, files) {
      if (er) {
        reject(er)
      }
      try {
        await asyncForEach(files, async file => {
          const relativePath = path.relative(viewDirectory, file)
          const ext = path.parse(relativePath).ext
          const bundleName = relativePath.replace(path.delimiter, "_").replace(ext, "")
          const stats = await compileFile(file, viewDirectory, bundleName, options)
          if (ext.match(/(\.tsx?$)/) || ext.match(/(\.jsx?$)/)) {
            const bundleExt = 'js'
            const hash = stats.compilation.hash
            const contentPath = `/react-ssr/${bundleName}.${hash}.${bundleExt}`
            cache[file] = { contentPath, hash }
          } else if (ext.match(/\.(sa|sc|c)ss$/)) {
            const assetName = Object.keys(stats.compilation.assets).find(k => k.match(/\.css$/))
            const contentPath = `/react-ssr/${assetName}`
            cache[file] = { contentPath }
          } else {
            throw new Error(`express-react-ssr-engine: Unsupported File Type ${ext}`)
          }
        });
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
}