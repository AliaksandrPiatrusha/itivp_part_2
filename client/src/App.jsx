import CartList from './components/CartList';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Магазин одежды</h1>
        <p className="muted">Управление корзиной · данные хранятся в localStorage</p>
      </header>
      <CartList />
    </div>
  );
}
