import {render, waitFor, screen} from '@testing-library/react'
import LandingPage from './landing'

describe("LandingPage Component", () => {
    it("Renders successfully when passed an empty array for users", async () => {
        render(<LandingPage message="Hello from the test"/>)
        await waitFor(() => screen.getByRole('heading'))
        expect(screen.getByText('Hello from the test')).toBeTruthy()
    })
})