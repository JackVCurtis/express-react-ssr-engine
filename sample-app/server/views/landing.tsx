import React from 'react'
import Alert from 'react-bootstrap/Alert'

export default function LandingPage({ message }) {
    return (
        <div>
            <h1>Landing Page</h1>
            <p>{message}</p>
            <Alert variant={'success'}>Bootstrap works</Alert>
        </div>
    )
}