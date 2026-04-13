import { createContext, useState, useEffect } from 'react'

const GlobalContext = createContext()

export function GlobalContextProvider({ children }) {
    const [token, setToken] = useState(null)
    const [email, setEmail] = useState(null)
    const [hideHamMenu, setHideHamMenu] = useState(true)

    // Restore session on page load
    useEffect(() => {
        const savedToken = sessionStorage.getItem('token')
        const savedEmail = sessionStorage.getItem('email')
        if (savedToken && savedEmail) {
            setToken(savedToken)
            setEmail(savedEmail)
        }
    }, [])

    function login(newToken, userEmail) {
        sessionStorage.setItem('token', newToken)
        sessionStorage.setItem('email', userEmail)
        setToken(newToken)
        setEmail(userEmail)
    }

    function logout() {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('email')
        setToken(null)
        setEmail(null)
    }

    // Returns Authorization header for authenticated API calls
    function getAuthHeaders() {
        if (!token) return {}
        return { Authorization: `Bearer ${token}` }
    }

    function toggleHamMenu(val) {
        setHideHamMenu(val)
    }

    return (
        <GlobalContext.Provider value={{
            email,
            token,
            isLoggedIn: !!token,
            hideHamMenu,
            login,
            logout,
            getAuthHeaders,
            toggleHamMenu,
        }}>
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalContext
