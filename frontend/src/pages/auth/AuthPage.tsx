import { useParams } from "react-router-dom"
import { AuthCard } from "@daveyplate/better-auth-ui"

export default function AuthPage() {
    const { pathname } = useParams()

    return (
        <main className="container flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
            <AuthCard pathname={pathname} />
        </main>
    )
}
