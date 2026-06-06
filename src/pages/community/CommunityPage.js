import { shell, bindShellActions } from '../../core/UI.js';

export function CommunityPage() {
  return shell(`
    <section class="chat-layout">
      <article class="chat-card">
        <h2>💬 Chat global</h2>
        <div class="chat-window">
          <div><b>Staff</b><span>Bem-vindos ao Blinders.</span></div>
          <div><b>IRIS</b><span>Banco sincronizado.</span></div>
          <div><b>Sistema</b><span>Mensagens fixadas da staff aparecem aqui.</span></div>
        </div>
        <div class="chat-input-row">
          <input placeholder="Enviar mensagem">
          <button class="primary">Enviar</button>
        </div>
      </article>
      <article class="feature-card">
        <h2>🤝 Amigos</h2>
        <p>Adicione membros por ID único, bloqueie usuários e denuncie mensagens.</p>
        <input placeholder="ID do amigo">
        <button class="primary">Adicionar amigo</button>
      </article>
    </section>
  `, { title: 'Comunidade', subtitle: 'Chat, amigos, denúncias e mensagens da staff.', bg: 'lobby' });
}

export function bindCommunityPage() {
  bindShellActions();
}
