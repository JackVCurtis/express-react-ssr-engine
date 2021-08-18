import { ReactSSREngine } from '@jackvcurtis/express-react-ssr-engine'
import throng from 'throng'
import path from 'path'
import express from 'express'
import { configureServer } from './server'

const engine = new ReactSSREngine(path.join(__dirname, 'views'), {
    externals: {
        "react-bootstrap": {
            commonjs: "react-bootstrap",
            commonjs2: "react-bootstrap",
            amd: "ReactBootstrap",
            root: "ReactBootstrap"
        }
    }
})
throng({
    master: async function() {
        await engine.compile()
    },
    worker: async function () {
        const app = express()
        engine.registerOn(app)
        await configureServer(app)
        app.listen(3000)
        console.log("Server listening on 3000")
    },
    count: 2
})