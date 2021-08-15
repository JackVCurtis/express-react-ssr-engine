import { configureServer } from './server'

configureServer()
    .then(app => {
        app.listen(3000)
        console.log("Server listening on port 3000")
    })