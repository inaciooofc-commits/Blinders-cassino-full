import { shell, bindShellActions, escapeHtml } from '../core/UI.js';
import { isAdmin } from '../core/State.js';

export function adminShell({ title, subtitle, icon = '🔒', body, bg = 'admin' }) {
  if (!isAdmin()) {
    return shell(`
      <section class="center-message">
        <h2>🔒 Acesso reservado</h2>
        <p>Entre como admin/dono para acessar esta área.</p>
        <a class="primary" href="/login">🔐 Login</a>
      </section>
    `, { title: 'Acesso reservado', bg });
  }

  return shell(`
    <section class="admin-screen">
      <header class="admin-screen-header">
        <div class="admin-screen-icon">${icon}</div>
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle || '')}</p>
        </div>
        <a class="ghost" href="/admin">← Admin Center</a>
      </header>
      ${body}
    </section>
  `, { title, subtitle, bg });
}

export function bindAdminShell() {
  bindShellActions();
}
