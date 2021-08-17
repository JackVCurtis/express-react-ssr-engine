import path from 'path'
import express, { Application, Request, Response } from "express"
import React from 'react'
import ReactDOMServer from 'react-dom/server'

export async function configureServer(app: Application): Promise<Application> {
    
    app.get('/', (req: Request, res: Response) => {
        res.render('landing', { props: { message: "Hello from the server" } })
    })
    app.get('/users', (req: Request, res: Response) => {
        res.render('users/index', { props: { users: [{ name: 'Freddie Mercury' }, { name: 'Tupac Shakur' }] } })
    })

    return app
}
