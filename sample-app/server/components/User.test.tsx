import {render, waitFor, screen} from '@testing-library/react'
import {User} from './User'

describe("User Component", () => {
    it("Renders successfully", async () => {
        render(<User user={{name: 'foobar'}}/>)
        await waitFor(() => screen.getByRole('listitem'))
        expect(screen.getByText('foobar')).toBeTruthy()
    })
})