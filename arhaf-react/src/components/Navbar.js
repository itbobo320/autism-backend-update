// src/components/Navbar.js
import { useLang } from '../context/LangContext';
import { useApp }  from '../context/AppContext';

export default function Navbar() {
  const { t, toggleLang } = useLang();
  const { user, logout, page, navigate } = useApp();

  const links = [
    { key: 'home',    label: t.home,    icon: '🏠' },
    { key: 'upload',  label: t.analyze, icon: '🎙️' },
    { key: 'history', label: t.history, icon: '📋' },
    { key: 'profile', label: t.profile, icon: '👤' },
  ];

  const handleNav = (key) => {
    if (['upload', 'history', 'profile'].includes(key) && !user) {
      navigate('login');
    } else {
      navigate(key);
    }
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo" onClick={() => navigate('home')}>
        <div className="logo-ball">👶</div>
        <span className="logo-txt grad2">{t.appName}</span>
      </div>

      {/* Links */}
      <div className="nav-links">
        {links.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`nl${page === key ? ' active' : ''}`}
            onClick={() => handleNav(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="nav-right">
        <button className="lang-btn" onClick={toggleLang}>
          🌐 {t.langToggle}
        </button>

        {user ? (
          <>
            <span className="nav-user">{t.welcome}, {user.name}</span>
            <button className="btn bg bsm" onClick={logout}>{t.logout}</button>
          </>
        ) : (
          <>
            <button className="btn bg bsm"  onClick={() => navigate('login')}>{t.login}</button>
            <button className="btn bp bsm"  onClick={() => navigate('register')}>{t.register}</button>
          </>
        )}
      </div>
    </nav>
  );
}
