import { configureServer } from "./server"

describe("configureServer", () => {
    it("Successfully configures the app and compiles all views", async () => {
        const app = await configureServer()
        expect(app).toBeTruthy()
    })
})