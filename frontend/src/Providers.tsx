import {AuthUIProvider} from "@daveyplate/better-auth-ui"
import {authClient} from "@/lib/auth-client"
import {useNavigate} from "react-router-dom"

export function Providers({children}: { children: React.ReactNode }) {
    const navigate = useNavigate()

    return (
        <AuthUIProvider
            authClient={authClient}
            navigate={navigate}
        >
            {children}
        </AuthUIProvider>
    )
}
