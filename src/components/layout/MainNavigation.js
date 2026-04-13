import classes from './MainNavigation.module.css'
import Link from 'next/link'
import HamMenu from "../generic/HamMenu"

import { useContext } from 'react'
import GlobalContext from "../../store/globalContext"
import SideBar from "./SideBar"
import { useRouter } from 'next/router'

function MainNavigation() {
  const globalCtx = useContext(GlobalContext)
  const router = useRouter()

  function toggleMenuHide() {
    globalCtx.toggleHamMenu(false)
  }

  const contents = [
    {title: 'Home', webAddress: '/'},
    {title: 'Readings', webAddress: '/timetrack'},
    {title: 'Devices', webAddress: '/projects'},
  ]
  
  // Add logout option if user is logged in
  if (globalCtx.isLoggedIn) {
    contents.push({title: 'Logout', webAddress: '/auth/login'})
  }

  return (
    <header className={classes.header}>
      <SideBar contents={contents} />
      <div className={classes.leftSection}>
        <HamMenu toggleMenuHide={() => toggleMenuHide()} />
        <div className={classes.icon} onClick={() => router.push('/')} style={{cursor: 'pointer'}}>
          <img src="/icon.png" alt="Icon" className={classes.iconImage} />
        </div>
        SerialLink Dashboard
      </div>
      <nav>
        <ul>
          <li>
            <Link href='/'>Home</Link>
          </li>
          <li>
            <Link href='/timetrack'>Readings</Link>
          </li>
          <li>
            <Link href='/projects'>Devices</Link>
          </li>
        </ul>
      </nav>
      <div className={classes.userSection}>
        {globalCtx.isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={classes.username}>{globalCtx.email}</div>
            <button 
              onClick={globalCtx.logout}
              style={{ 
                background: 'transparent', 
                border: '3px solid rgba(56, 56, 56, 0.3)', 
                color: (10, 10, 51),
                padding: '0.5rem 1rem', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href='/auth/login' className={classes.loginLink}>Log In</Link>
        )}
      </div>
    </header>
  );
}

export default MainNavigation
