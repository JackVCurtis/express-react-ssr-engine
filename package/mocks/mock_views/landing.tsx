import React from "react";

interface LandingPageProps {
    message: string
}
const LandingPage: React.FC<LandingPageProps> = ({ message }) => {
    return (
        <div>
            <h1>Landing Page</h1>
            <p>{message}</p>
        </div>
    )
}

export default LandingPage