import { ReactSSREngine } from "@jackvcurtis/express-react-ssr-engine"
import path from "path"

export const engine = new ReactSSREngine(path.join(__dirname, 'views'), {
    externals: {
        "react-bootstrap": {
            commonjs: "react-bootstrap",
            commonjs2: "react-bootstrap",
            amd: "ReactBootstrap",
            root: "ReactBootstrap"
        }
    },
    fileExtension: process.env.NODE_ENV == "test" || process.env.NODE_ENV == "local" ? "tsx" : "js"
})