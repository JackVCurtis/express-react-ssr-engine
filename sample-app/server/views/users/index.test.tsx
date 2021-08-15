import {render, waitFor, screen} from '@testing-library/react'
import UserIndex from './index'

describe("UserIndex Component", () => {
    it("Renders successfully", async () => {
        render(<UserIndex users={[{name: 'foobar'}]}/>)
        await waitFor(() => screen.getByRole('heading'))
        expect(screen.getByText('foobar')).toBeTruthy()
    })
})