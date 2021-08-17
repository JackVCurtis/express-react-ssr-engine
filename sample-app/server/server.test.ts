import { configureServer } from "./server"

describe("configureServer", () => {
    jest.setTimeout(30000)
    it("Successfully configures the app and compiles all views", async () => {
        const app = await configureServer()
        expect(app).toBeTruthy()
    })
})