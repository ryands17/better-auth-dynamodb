import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import { BrowserRouter } from "react-router-dom"
import { Providers } from "./Providers.tsx"
import './index.css'

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <Providers>
            <App />
        </Providers>
    </BrowserRouter>
)
