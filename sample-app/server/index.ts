import path from 'path'
import express, { Application, Request, Response } from "express"
import {registerReactSSREngine} from "express-react-ssr-engine"

async function configureServer(): Promise<Application> {
    const app = express()
    await registerReactSSREngine(app, path.join(__dirname, 'views'))

    app.get('/', (req: Request, res: Response) => {
        res.render('landing', { props: { message: "Hello from the server"}})
    })

    return app
}

configureServer()
    .then(app => {
        app.listen(3000)
        console.log("Server listening on port 3000")
    })