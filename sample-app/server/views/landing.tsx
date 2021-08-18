import React from 'react'
import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'

export default function LandingPage({ message }) {
    const [toggle, setToggle] = useState(false)
    return (
        <div>
            <h1>Landing Page</h1>
            <button onClick={() => setToggle(!toggle)}>{toggle ? 'ON' : 'OFF'}</button>
            <p>{message}</p>
            <Alert variant={'success'}>Bootstrap works</Alert>
        </div>
    )
}