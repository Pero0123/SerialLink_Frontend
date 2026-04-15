import classes from './MainNavigation.module.css';
import Link from 'next/link';
import HamMenu from '../generic/HamMenu';
import { useContext } from 'react';
import GlobalContext from '../../store/globalContext';
import SideBar from './SideBar';
import { useRouter } from 'next/router';

function MainNavigation() {
  const globalCtx = useContext(GlobalContext);
  const router    = useRouter();

  const contents = [
    { title: 'Devices',  webAddress: '/' },
    { title: 'Readings', webAddress: '/timetrack' },
  ];

  if (globalCtx.isLoggedIn) {
    contents.push({ title: 'Logout', webAddress: '/auth/login' });
  }

  return (
    <header className={classes.header}>
      <SideBar contents={contents} />
      <div className={classes.leftSection}>
        <HamMenu toggleMenuHide={() => globalCtx.toggleHamMenu(false)} />
        <div className={`${classes.icon} ${classes.iconBtn}`} onClick={() => router.push('/')}>
          <img src="/icon.png" alt="Icon" className={classes.iconImage} />
        </div>
        <span className={classes.title}>SerialLink Dashboard</span>
      </div>
      <nav className={classes.desktopNav}>
        <ul>
          <li><Link href="/">Devices</Link></li>
          <li><Link href="/timetrack">Readings</Link></li>
        </ul>
      </nav>
      <div className={classes.userSection}>
        {globalCtx.isLoggedIn ? (
          <div className={classes.userInfo}>
            <button onClick={globalCtx.logout} className={classes.logoutBtn}>Logout</button>
            <span className={classes.username}>{globalCtx.email?.split('@')[0]}</span>
          </div>
        ) : (
          <Link href="/auth/login" className={classes.loginLink}>Log In</Link>
        )}
      </div>
    </header>
  );
}

export default MainNavigation;
