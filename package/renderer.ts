import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import ReactDOMServer from 'react-dom/server'
import { ReactSSRCache } from './index'

function render(cache: ReactSSRCache, template: any, react: any, viewDirectory: string, filename: string, props: object, callback: (e?: any, string?: string) => void) {
    const cached = cache[filename]
    const parsedFilename = path.parse(filename)
    const cachedStyle = cache[path.join(parsedFilename.dir.replace(viewDirectory, `${viewDirectory}/styles`), `${parsedFilename.name}.scss`)]
    const element = react.createElement(cached.component.default, props)
    const reactHtml = ReactDOMServer.renderToString(element)

    callback(null, template({
        reactScriptPath: cached.contentPath,
        reactHtml: reactHtml,
        reactProps: JSON.stringify(props),
        stylePath: cachedStyle ? cachedStyle.contentPath : ''
    }))
}

export function renderFnFactory(cache: ReactSSRCache, viewDirectory: string, react: any) {
    const indexTemplate = Handlebars.compile(fs.readFileSync(path.join(viewDirectory, 'templates', 'layout.hbs')).toString())

    return (filename: string, options: { props: object }, callback: (e?: any, string?: string) => void) => {
        if (!cache[filename]?.component) {
            import(filename).then(component => {
                cache[filename].component = component
                render(cache, indexTemplate, react, viewDirectory, filename, options.props, callback)
            })
        } else {
            render(cache, indexTemplate, react, viewDirectory, filename, options.props, callback)
        }
    }
}
