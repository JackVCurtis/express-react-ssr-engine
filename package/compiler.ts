import { webpack, Stats } from "webpack";
import { DIST_ROUTE, ReactSSROptions } from "./index";
import { glob } from 'glob'
import path from 'path'
import { engineFs, updateCache, ReactSSRCache, getStaticDir } from './filesystem'

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
    }, options?.externals || {})
    const config = {
        mode: "production" as "production",
        entry: {
            index: filename,
        },
        experiments: {
            asset: true
        },
        output: {
            path: getStaticDir(viewDirectory),
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
    const compiler = webpack(config)
    compiler.outputFileSystem = engineFs
    return compiler
}

function compileFile(filename: string, viewDirectory: string, bundleName: string, options: ReactSSROptions): Promise<Stats> {
    return new Promise((resolve, reject) => {
        const compiler = compilerFactory(viewDirectory, filename, bundleName, options)

        compiler.run((err, stats) => {
            if (err) {
                reject(err)
            }
            if (stats.hasErrors() || stats.hasWarnings()) {
                console.log(stats.toString({
                    chunks: false, 
                    colors: true
                  }));                
            }

            if (stats.hasErrors()) {
                reject(stats.compilation.errors)
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

export async function compile(viewDirectory: string, options: ReactSSROptions): Promise<void> {
    const cache: ReactSSRCache = {}
    return new Promise<void>((resolve, reject) => {
        glob(viewDirectory + "/**/!(*.test).+(js|jsx|ts|tsx|scss)", null,  function (er, files) {
            if (er) {
                reject(er)
            }
            const fileCompilationPromises = files.map((file) => {
                return new Promise<void>((resolveInner, rejectInner) => {
                    const relativePath = path.relative(viewDirectory, file)
                    const ext = path.parse(relativePath).ext
                    const bundleName = relativePath.replace(path.delimiter, "_").replace(ext, "")
                    compileFile(file, viewDirectory, bundleName, options)
                        .then(stats => {
                            if (ext.match(/(\.tsx?$)/) || ext.match(/(\.jsx?$)/)) {
                                const bundleExt = 'js'
                                const hash = stats.compilation.hash
                                const contentPath = `${DIST_ROUTE}/${bundleName}.${hash}.${bundleExt}`
                                cache[file] = { contentPath, hash }
                            } else if (ext.match(/\.(sa|sc|c)ss$/)) {
                                const assetName = Object.keys(stats.compilation.assets).find(k => k.match(/\.css$/))
                                const contentPath = `${DIST_ROUTE}/${assetName}`
                                cache[file] = { contentPath }
                            } else {
                                throw new Error(`express-react-ssr-engine: Unsupported File Type ${ext}`)
                            }
                            resolveInner()
                        })
                        .catch(rejectInner)
                })
            })
            Promise.all(fileCompilationPromises)
                .then(() => {
                    updateCache(viewDirectory, cache)
                    resolve()
                })
                .catch(reject)
        })
    })
}