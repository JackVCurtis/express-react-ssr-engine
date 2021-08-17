import path from "path"
import express from "express"
import { registerReactSSREngine } from "./index"
import React from "react"
import supertest from "supertest"

describe("registerReactSSREngine", () => {
    it("should compile the mock views directory", async () => {
        jest.setTimeout(30000);

        const app = express()
        await registerReactSSREngine(app, path.join(__dirname, "mocks", "mock_views"), React)

        app.get('/', (req, res) => res.render('landing', { props: { message: "Hello from the test" } }))

        supertest(app)
            .get('/')
            .expect(200)
            .then((res) => {
                
            })
    })
})