import { login } from '../api/auth.js';
import { toast } from '../core/UI.js';

export function LoginPage() {
  return `
    <main class="center-page" style="--page-bg:url('/assets/backgrounds/lobby.svg')">
      <form class="auth-card" id="loginForm">
        <img src="/assets/icons/home.svg" alt="">
        <h1>🏆 Blinders Cassino</h1>
        <p>Entre com sua conta. Não use a senha real do Zarcovi.</p>
        <label>Conta ou nick <input name="identifier" value="GE9502" autocomplete="username"></label>
        <label>Senha <input name="password" type="password" value="950200" autocomplete="current-password"></label>
        <button class="primary">🔐 Entrar</button>
        <a class="ghost-link" href="/register">Criar conta</a>
      </form>
    </main>`;
}

export function bindLoginPage() {
  document.querySelector('#loginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const identifier = form.identifier.value.trim();
    const password = form.password.value;

    try {
      await login(identifier, password, 'member');
      toast('Login confirmado', 'good');
      location.href = '/menu';
    } catch (error) {
      toast(error.message, 'bad');
    }
  });
}
