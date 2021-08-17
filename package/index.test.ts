import path from "path"
import express from "express"
import React from "react"
import supertest from "supertest"
import { ReactSSREngine } from "./index"

describe("registerReactSSREngine", () => {
    jest.setTimeout(30000);

    it("should compile the mock views directory", async () => {
        const engine = new ReactSSREngine(path.join(__dirname, 'mocks', 'mock_views'))
        await engine.compile()
        const app = express()
        engine.registerOn(app)

        app.get('/', (req, res) => res.render('landing', { props: { message: "Hello from the test" } }))

        await supertest(app)
            .get('/')
            .expect(200)
    })
})