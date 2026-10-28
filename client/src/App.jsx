import CartList from './components/CartList';
import LoginForm from './components/LoginForm';
import Toasts from './components/Toasts';
import useAuth from './hooks/useAuth';
import useNotifications from './hooks/useNotifications';

export default function App() {
  const { user, notice, login, register, logout } = useAuth();
  const { notifications, notify, dismiss } = useNotifications();

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Магазин одежды</h1>
          <p className="muted">Управление корзиной · данные хранятся на сервере (REST API)</p>
        </div>
        {user && (
          <div className="user-box">
            <span className="muted">{user.email}{user.role === 'admin' ? ' · администратор' : ''}</span>
            <button type="button" className="btn" onClick={logout}>Выйти</button>
          </div>
        )}
      </header>

      {/* key: при смене пользователя корзина монтируется заново и загружается с сервера. */}
      {user
        ? <CartList key={user.id} notify={notify} />
        : <LoginForm onLogin={login} onRegister={register} notice={notice} />}

      <Toasts notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
