import throng from 'throng'
import express from 'express'
import { configureServer } from './server'
import { engine } from './engine'

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