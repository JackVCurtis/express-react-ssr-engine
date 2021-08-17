interface LandingPageProps {
    message: string
}

export default function LandingPage({ message } : LandingPageProps) {
    return (
        <div>
            <h1>Landing Page</h1>
            <p>{message}</p>
        </div>
    )
}