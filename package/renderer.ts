import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import ReactDOMServer from 'react-dom/server'
import { ReactSSRCache } from './filesystem'
import React from 'react'
import { getCache } from './filesystem'

function render(cache: ReactSSRCache, component: any, template: any, viewDirectory: string, filename: string, props: object, templateModel: object, callback: (e?: any, string?: string) => void) {
    const cached = cache[filename]
    const parsedFilename = path.parse(filename)
    const cachedStyle = cache[path.join(parsedFilename.dir.replace(viewDirectory, `${viewDirectory}/styles`), `${parsedFilename.name}.scss`)]
    const element = React.createElement(component.default, props)
    const reactHtml = ReactDOMServer.renderToString(element)

    callback(null, template(Object.assign({
        reactScriptPath: cached.contentPath,
        reactHtml: reactHtml,
        reactProps: JSON.stringify(props),
        stylePath: cachedStyle ? cachedStyle.contentPath : '',
        nodeEnv: process.env.NODE_ENV
    }, templateModel || {})))
}

export function renderFnFactory(viewDirectory: string) {
    const cache = getCache(viewDirectory)
    const indexTemplate = Handlebars.compile(fs.readFileSync(path.join(viewDirectory, 'templates', 'layout.hbs')).toString())

    return (filename: string, options: { props: object, template: object }, callback: (e?: any, string?: string) => void) => {
        import(filename).then(component => {
            render(cache, component, indexTemplate, viewDirectory, filename, options.props, options.template, callback)
        })
    }
}
