import path from 'path'
import express, { Application, Request, Response } from "express"
import { registerReactSSREngine } from "express-react-ssr-engine"
import React from 'react'
import ReactDOMServer from 'react-dom/server'

export async function configureServer(): Promise<Application> {
    const app = express()
    await registerReactSSREngine(
        app,
        path.join(__dirname, 'views'),
        React,
        ReactDOMServer,
        {
            externals: {
                "react-bootstrap": {
                    commonjs: "react-bootstrap",
                    commonjs2: "react-bootstrap",
                    amd: "ReactBootstrap",
                    root: "ReactBootstrap"
                }
            }
        }
    )

    app.get('/', (req: Request, res: Response) => {
        res.render('landing', { props: { message: "Hello from the server" } })
    })
    app.get('/users', (req: Request, res: Response) => {
        res.render('users/index', { props: { users: [{ name: 'Freddie Mercury' }, { name: 'Tupac Shakur' }] } })
    })

    return app
}
