import {Route, Routes} from "react-router-dom"
import AuthPage from "./pages/auth/AuthPage"
import {ThemeProvider} from "@/components/theme-provider.tsx";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Routes>
                <Route index path="/auth/:pathname" element={<AuthPage/>}/>
            </Routes>
        </ThemeProvider>
    )
}

export default App
