import { configureServer } from "./server"
import express from 'express'
import { ReactSSREngine } from '@jackvcurtis/express-react-ssr-engine'
import path from 'path'
import supertest from 'supertest'

describe("Server startup", () => {
    jest.setTimeout(30000)
    it("Successfully compiles and serves the landing page", async () => {
        const engine = new ReactSSREngine(path.join(__dirname, 'views'))
        await engine.compile()
        const app = express()
        engine.registerOn(app)
        configureServer(app)

        app.get('/', (req, res) => res.render('landing', { props: { message: "Hello from the test" } }))

        const res = await supertest(app)
            .get('/')
            .expect(200)

        expect(res.text).toContain("Hello from the test")
    })
})