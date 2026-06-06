import { registerMember } from '../api/auth.js';
import { toast } from '../core/UI.js';

export function RegisterPage() {
  return `
    <main class="center-page" style="--page-bg:url('/assets/backgrounds/lobby.svg')">
      <form class="auth-card" id="registerForm">
        <img src="/assets/icons/profile.svg" alt="">
        <h1>👤 Criar conta</h1>
        <p>Use uma senha exclusiva para o Blinders. Não use a senha real do Zarcovi.</p>
        <label>Nick <input name="nick" autocomplete="nickname"></label>
        <label>Conta Zarcovi <input name="zarcoviAccount"></label>
        <label>Senha do app <input name="password" type="password"></label>
        <button class="primary">✅ Solicitar cadastro</button>
        <a class="ghost-link" href="/login">Já tenho conta</a>
      </form>
    </main>`;
}

export function bindRegisterPage() {
  document.querySelector('#registerForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      const data = await registerMember({
        nick: form.nick.value.trim(),
        zarcoviAccount: form.zarcoviAccount.value.trim(),
        password: form.password.value
      });
      toast(data.message || 'Conta criada e aguardando confirmação', 'good');
      location.href = '/login';
    } catch (error) {
      toast(error.message, 'bad');
    }
  });
}
