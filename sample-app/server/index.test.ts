import { configureServer } from "./server"
import express from 'express'
import supertest from 'supertest'
import { engine } from './engine'

describe("Server startup", () => {
    jest.setTimeout(30000)
    it("Successfully compiles and serves the landing page", async () => {
        await engine.compile()
        const app = express()
        engine.registerOn(app)

        app.get('/', (req, res) => res.render('landing', { props: { message: "Hello from the test" } }))

        const res = await supertest(app)
            .get('/')
            .expect(200)

        expect(res.text).toContain("Hello from the test")
    })
})