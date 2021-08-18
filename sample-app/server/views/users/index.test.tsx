import {render, waitFor, screen} from '@testing-library/react'
import UsersPage from './index'

describe("UsersPage Component", () => {
    it("Renders successfully", async () => {
        render(<UsersPage users={[{name: 'foobar'}]}/>)
        await waitFor(() => screen.getByRole('heading'))
        expect(screen.getByText('foobar')).toBeTruthy()
    })
})