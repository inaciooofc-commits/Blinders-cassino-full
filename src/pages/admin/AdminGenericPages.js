import { adminShell, bindAdminShell } from '../../components/AdminLayout.js';
import { State } from '../../core/State.js';
import { toast, escapeHtml } from '../../core/UI.js';
import { rpc } from '../../api/rpc.js';
import { bindPhoneMasks, isValidPhone } from '../../core/PhoneMask.js';

const PAGE = {
  accounts: {
    icon:'👥', title:'Resumo de contas', subtitle:'Busque membros por nick, conta, ID ou cargo.',
    fields:[
      ['query','Buscar conta','Digite nick, ID, conta ou cargo','text'],
      ['status','Filtro de status','active,pending,suspended,all','select:Todos=all,Ativas=active,Pendentes=pending,Suspensas=suspended'],
    ],
    button:'🔎 Buscar contas',
    module:'accounts', action:'search'
  },
  'approve-accounts': {
    icon:'✅', title:'Confirmar contas', subtitle:'Aprove uma conta pendente digitando nick, código ou ID.',
    fields:[
      ['target','Nick / Código / ID','Ex: GE9502 ou código de confirmação','text'],
      ['status','Novo status','active','select:Aprovar=active,Pendente=pending,Suspender=suspended'],
      ['note','Observação','Motivo da confirmação','textarea'],
    ],
    button:'✅ Confirmar conta',
    module:'accounts', action:'approve'
  },
  'create-account': {
    icon:'➕', title:'Criar conta', subtitle:'Crie membro comum, admin@(nome), moderador, mestre ou comissária.',
    fields:[
      ['nick','Nick de login','Ex: jogador01 ou admin@jogador01','text'],
      ['zarcovi_account','Conta Zarcovi','Conta Zarcovi do membro','text'],
      ['phone','Telefone','Formato: xx xxxxx-xxxx','phone'],
      ['password','Senha do app','Não use senha real do Zarcovi','password'],
      ['role','Cargo','user','select:Membro comum=user,Admin=admin,Dono=owner,Moderador=moderator,Mestre de mesa=table_master,Comissária=commissioner'],
      ['status','Status inicial','active','select:Ativa=active,Pendente=pending,Suspensa=suspended'],
      ['balance','Saldo inicial','Ex: 0, 1500B, 1.5T','text'],
      ['note','Observação','Mensagem para registro admin','textarea'],
    ],
    button:'➕ Criar conta agora',
    module:'accounts', action:'create'
  },
  'delete-account': {
    icon:'🗑️', title:'Excluir ou suspender conta', subtitle:'Suspenda, reative ou marque conta como removida.',
    fields:[
      ['target','Nick / ID da conta','Conta que será alterada','text'],
      ['account_action','Ação','suspend','select:Suspender=suspend,Reativar=reactivate,Marcar como removida=delete'],
      ['note','Motivo','Explique a ação','textarea'],
    ],
    button:'🗑️ Aplicar ação na conta',
    module:'accounts', action:'delete'
  },
  permissions: {
    icon:'♜', title:'Permissões', subtitle:'Troque o cargo de uma conta com registro em log.',
    fields:[
      ['target','Nick / ID da conta','Conta alvo','text'],
      ['role','Novo cargo','user','select:Membro=user,Admin=admin,Dono=owner,Moderador=moderator,Mestre=table_master,Comissária=commissioner'],
      ['note','Motivo','Motivo da troca de cargo','textarea'],
    ],
    button:'♜ Atualizar permissão',
    module:'accounts', action:'role'
  },
  deposits: {
    icon:'↥', title:'Confirmar depósitos', subtitle:'Registre depósito confirmado no cofre EMSHBY.',
    fields:[
      ['code','Código / Conta','Código do depósito ou conta do membro','text'],
      ['amount','Valor confirmado','Ex: 1500B ou 1.5T','text'],
      ['note','Observação','Print, horário ou detalhe do depósito','textarea'],
    ],
    button:'↥ Confirmar depósito',
    module:'bank', action:'deposit'
  },
  withdraws: {
    icon:'↧', title:'Confirmar saques', subtitle:'Marque saque como conferido e registre no log.',
    fields:[
      ['code','Código do saque','Código informado pelo jogador','text'],
      ['note','Observação','Detalhe do pagamento','textarea'],
    ],
    button:'↧ Confirmar saque',
    module:'bank', action:'withdraw'
  },
  transfers: {
    icon:'⇄', title:'Transferências', subtitle:'Consulte ou registre auditoria de transferência.',
    fields:[
      ['target','Conta / TX / Código','Alvo da consulta','text'],
      ['note','Observação','Detalhes para auditoria','textarea'],
    ],
    button:'⇄ Consultar transferência',
    module:'bank', action:'transfer-audit'
  },
  'iris-control': {
    icon:'🏦', title:'IRIS Control', subtitle:'Ajuste saldo de membro ou registre ação no Banco IRIS.',
    fields:[
      ['target','Nick / ID / IRIS','Conta alvo','text'],
      ['bank_action','Ação','consult','select:Consultar=consult,Ajustar saldo=set-balance,Adicionar saldo=add-balance,Remover saldo=remove-balance'],
      ['amount','Valor','Ex: 1T, 1500B ou 0','text'],
      ['note','Motivo','Motivo da alteração','textarea'],
    ],
    button:'🏦 Executar ação IRIS',
    module:'bank', action:'iris'
  },
  vault: {
    icon:'◆', title:'Cofre EMSHBY', subtitle:'Configure saldo/reserva/limite do cofre.',
    fields:[
      ['vault_action','Ação do cofre','consult','select:Consultar=consult,Definir saldo=set-balance,Adicionar=add-balance,Remover=remove-balance'],
      ['amount','Valor','Ex: 10T','text'],
      ['reserve_percent','Reserva mínima %','Ex: 10','number'],
      ['max_prize_percent','Prêmio máximo %','Ex: 10','number'],
      ['note','Observação','Registro da alteração','textarea'],
    ],
    button:'◆ Atualizar cofre',
    module:'bank', action:'vault'
  },
  sangria: {
    icon:'⇣', title:'Sangria', subtitle:'Gere resumo para copiar e enviar no WhatsApp.',
    fields:[
      ['period','Período','daily','select:Hoje=daily,Semana=weekly,Mês=monthly'],
      ['note','Observação','Mensagem adicional','textarea'],
    ],
    button:'⇣ Gerar sangria',
    module:'reports', action:'sangria'
  },
  'game-rules': {
    icon:'⚙️', title:'Regras dos jogos', subtitle:'Atualize regra, status, mínimo e máximo de aposta.',
    fields:[
      ['game_key','Jogo','bingo','select:Crash=crash,Roleta=roulette,Slots=slots,Blackjack=blackjack,Dados=dice,Bingo=bingo,Moeda=coin,Raspadinha=scratch,Memória=memory'],
      ['active','Status','true','select:Ativo=true,Desativado=false'],
      ['min_bet','Aposta mínima','Ex: 1500B','text'],
      ['max_bet','Aposta máxima','Ex: 3T','text'],
      ['rule_text','Texto da regra','Descrição visível ao jogador','textarea'],
    ],
    button:'⚙️ Salvar regra',
    module:'games', action:'rules'
  },
  'game-history': {
    icon:'📈', title:'Histórico de rodadas', subtitle:'Busque partidas por membro, jogo ou TX.',
    fields:[
      ['target','Nick / ID / TX','Consulta de histórico','text'],
      ['game_key','Jogo','all','select:Todos=all,Crash=crash,Roleta=roulette,Slots=slots,Blackjack=blackjack,Dados=dice,Bingo=bingo'],
    ],
    button:'📈 Buscar histórico',
    module:'games', action:'history'
  },
  'game-limits': {
    icon:'⊙', title:'Limites dos jogos', subtitle:'Ative modo seguro e configure limites globais.',
    fields:[
      ['safe_mode','Modo seguro','false','select:Desligado=false,Ligado=true'],
      ['global_max','Máximo global','Ex: 3T','text'],
      ['note','Observação','Motivo da alteração','textarea'],
    ],
    button:'⊙ Salvar limites',
    module:'games', action:'limits'
  },
  'bonus-codes': {
    icon:'％', title:'Códigos de bônus', subtitle:'Crie bônus com dinheiro, item, limite e expiração.',
    fields:[
      ['code','Código','Ex: BLINDERS2026','text'],
      ['title','Título','Nome do bônus','text'],
      ['money','Dinheiro','Ex: 1500B ou 0','text'],
      ['item_key','Item da loja','Opcional: vip_title, silver_frame','text'],
      ['max_uses','Limite total','Ex: 100','number'],
      ['max_per_user','Limite por usuário','Ex: 1','number'],
      ['expires_at','Expira em','YYYY-MM-DD ou vazio','text'],
    ],
    button:'🎁 Criar bônus',
    module:'bonus', action:'create'
  },
  events: {
    icon:'★', title:'Eventos', subtitle:'Crie evento diário, semanal, secreto ou especial.',
    fields:[
      ['title','Título do evento','Ex: Noite Blinders','text'],
      ['event_type','Tipo','special','select:Diário=daily,Semanal=weekly,Especial=special,Secreto=secret'],
      ['description','Descrição','Texto do evento','textarea'],
      ['reward','Recompensa','Ex: 1T + badge','text'],
    ],
    button:'★ Criar evento',
    module:'bonus', action:'event'
  },
  shop: {
    icon:'🛒', title:'Loja admin', subtitle:'Crie ou atualize item da loja.',
    fields:[
      ['item_key','Chave do item','Ex: silver_frame','text'],
      ['title','Nome do item','Ex: Moldura Prata','text'],
      ['category','Categoria','profile','select:Perfil=profile,Evento=event,Clã=clan,Consumível=consumable'],
      ['item_type','Tipo','badge','select:Badge=badge,Título=title,Moldura=frame,Fundo=background,Consumível=consumable'],
      ['rarity','Raridade','common','select:Comum=common,Raro=rare,Épico=epic,Lendário=legendary'],
      ['price','Preço','Ex: 1.5T','text'],
      ['stock','Estoque','0 = ilimitado','number'],
      ['active','Status','true','select:Ativo=true,Desativado=false'],
    ],
    button:'🛒 Salvar item',
    module:'shop', action:'save'
  },
  inventory: {
    icon:'▩', title:'Inventário admin', subtitle:'Adicionar ou remover item do inventário do membro.',
    fields:[
      ['target','Nick / ID do membro','Membro alvo','text'],
      ['item_key','Item','Chave do item','text'],
      ['inventory_action','Ação','add','select:Adicionar=add,Remover=remove,Consultar=consult'],
      ['note','Observação','Motivo da ação','textarea'],
    ],
    button:'▩ Atualizar inventário',
    module:'shop', action:'inventory'
  },
  announcements: {
    icon:'📢', title:'Anúncios', subtitle:'Crie mensagens que passam no topo.',
    fields:[
      ['message','Mensagem','Texto do anúncio','textarea'],
      ['priority','Prioridade','10','number'],
      ['active','Status','true','select:Ativo=true,Desativado=false'],
    ],
    button:'📢 Publicar anúncio',
    module:'system', action:'announcement'
  },
  media: {
    icon:'▣', title:'Mídia e fundos', subtitle:'Registre troca de background/banner.',
    fields:[
      ['asset_key','Chave do asset','Ex: lobby_banner','text'],
      ['asset_url','URL ou caminho','/assets/backgrounds/lobby.svg','text'],
      ['note','Observação','Detalhe da mídia','textarea'],
    ],
    button:'▣ Salvar mídia',
    module:'visual', action:'media'
  },
  music: {
    icon:'♪', title:'Rádio e trilha', subtitle:'Registre música de fundo/radio.',
    fields:[
      ['track_title','Nome da música','Título da trilha','text'],
      ['track_url','URL do YouTube','Cole link de vídeo ou playlist do YouTube','text'],
      ['volume','Volume','0.15','number'],
      ['active','Status','true','select:Ativo=true,Desativado=false'],
    ],
    button:'♪ Salvar trilha',
    module:'visual', action:'music'
  },
  clans: {
    icon:'⚑', title:'Admin clãs', subtitle:'Criar, auditar ou alterar clã.',
    fields:[
      ['clan_name','Nome do clã','Nome do clã','text'],
      ['leader','Líder/comissária','Nick ou ID','text'],
      ['clan_action','Ação','consult','select:Consultar=consult,Criar=create,Ativar=active,Suspender=suspend'],
      ['note','Observação','Detalhe da ação','textarea'],
    ],
    button:'⚑ Executar ação de clã',
    module:'clans', action:'manage'
  },
  'chat-control': {
    icon:'✉', title:'Controle do chat', subtitle:'Silenciar, bloquear ou auditar usuário/mensagem.',
    fields:[
      ['target','Nick / ID / Mensagem','Alvo','text'],
      ['chat_action','Ação','mute','select:Silenciar=mute,Bloquear=block,Desbloquear=unblock,Auditar=audit'],
      ['note','Motivo','Motivo da moderação','textarea'],
    ],
    button:'✉ Aplicar moderação',
    module:'community', action:'chat'
  },
  reports: {
    icon:'▤', title:'Relatórios', subtitle:'Gere relatório para copiar.',
    fields:[
      ['period','Período','daily','select:Hoje=daily,Semana=weekly,Mês=monthly'],
      ['report_type','Tipo','general','select:Geral=general,Banco=bank,Jogos=games,Bônus=bonus,Clãs=clans'],
    ],
    button:'▤ Gerar relatório',
    module:'reports', action:'generate'
  },
  health: {
    icon:'♡', title:'Saúde do sistema', subtitle:'Teste Supabase, login, funções e módulos.',
    fields:[
      ['test','Teste','all','select:Todos=all,Supabase=supabase,Login=login,Jogos=games,Funções=functions'],
    ],
    button:'♡ Rodar teste',
    module:'system', action:'health'
  },
  logs: {
    icon:'☰', title:'Logs', subtitle:'Filtre logs por área.',
    fields:[
      ['area','Área','all','select:Todos=all,Login=login,Jogos=games,Banco=bank,Admin=admin,Pagamentos=payments'],
      ['target','Busca','Nick, ID, TX ou texto','text'],
    ],
    button:'☰ Buscar logs',
    module:'system', action:'logs'
  },
  settings: {
    icon:'⚙️', title:'Configurações', subtitle:'Lock, manutenção, modo seguro e cache.',
    fields:[
      ['setting','Configuração','lock','select:Lock=lock,Manutenção=maintenance,Modo seguro=safe_mode,Cache=cache'],
      ['enabled','Ativar?','false','select:Não=false,Sim=true'],
      ['message','Mensagem','Mensagem para membros','textarea'],
    ],
    button:'⚙️ Salvar configuração',
    module:'system', action:'settings'
  },
  maintenance: {
    icon:'⚒', title:'Manutenção', subtitle:'Mensagem personalizada e bloqueio temporário.',
    fields:[
      ['enabled','Manutenção ativa?','true','select:Sim=true,Não=false'],
      ['message','Mensagem para membros','Estamos em manutenção. Volte em breve.','textarea'],
    ],
    button:'⚒ Aplicar manutenção',
    module:'system', action:'maintenance'
  },
  backup: {
    icon:'⧉', title:'Backup', subtitle:'Registrar versão segura e ponto de restauração.',
    fields:[
      ['label','Nome do backup','Ex: Versão estável antes da atualização','text'],
      ['note','Observação','Detalhes do backup','textarea'],
    ],
    button:'⧉ Criar ponto seguro',
    module:'system', action:'backup'
  }
};

const DEFAULT = PAGE.accounts;

export function AdminGenericPage() {
  const slug = location.pathname.replace('/admin/', '') || 'accounts';
  const cfg = PAGE[slug] || DEFAULT;

  return adminShell({
    title: cfg.title,
    subtitle: cfg.subtitle,
    icon: cfg.icon,
    body: `
      <div class="admin-form-layout">
        <article class="admin-form-card">
          <h3>${cfg.icon} ${cfg.title}</h3>
          <p class="muted">${cfg.subtitle}</p>
          <form id="adminRealForm" class="admin-specific-form">
            ${cfg.fields.map(renderField).join('')}
            <div class="admin-action-buttons">
              <button class="primary" type="submit">${cfg.button}</button>
              <button class="ghost" type="button" id="clearFormBtn">🧹 Limpar</button>
              <button class="ghost" type="button" id="copyBtn">📋 Copiar resultado</button>
              <a class="ghost" href="/admin">← Admin Center</a>
            </div>
          </form>
          <div class="admin-action-result" id="resultBox">
            Preencha os campos e execute a ação.
          </div>
        </article>

        <aside class="admin-help-card">
          <h3>📌 O que fazer aqui?</h3>
          ${helpFor(cfg.module, cfg.action)}
          <div class="mini-kpi-grid">
            <div><b>Módulo</b><span>${cfg.module}</span></div>
            <div><b>Ação</b><span>${cfg.action}</span></div>
            <div><b>Segurança</b><span>token + cargo</span></div>
            <div><b>Registro</b><span>admin_audit_logs</span></div>
          </div>
        </aside>
      </div>
    `
  });
}

function renderField(field) {
  const [name, label, placeholder, type='text'] = field;
  if (type === 'textarea') {
    return `<label>${escapeHtml(label)}<textarea name="${name}" placeholder="${escapeHtml(placeholder)}"></textarea></label>`;
  }
  if (type.startsWith('select:')) {
    const opts = type.replace('select:', '').split(',').map(pair => {
      const [t, v] = pair.split('=');
      return `<option value="${escapeHtml(v || t)}">${escapeHtml(t)}</option>`;
    }).join('');
    return `<label>${escapeHtml(label)}<select name="${name}">${opts}</select></label>`;
  }
  const attrs = type === 'phone' ? 'type="tel" inputmode="numeric" maxlength="13" data-phone-mask pattern="\\d{2} \\d{5}-\\d{4}"' : `type="${type}"`;
  return `<label>${escapeHtml(label)}<input name="${name}" ${attrs} placeholder="${escapeHtml(placeholder)}"></label>`;
}

function helpFor(module, action) {
  const map = {
    accounts: 'Use para criar, aprovar, suspender, reativar e alterar cargos de membros.',
    bank: 'Use para confirmar depósitos, saques, transferências e controlar o cofre EMSHBY.',
    games: 'Use para configurar regras, limites e consultar histórico dos jogos.',
    bonus: 'Use para criar códigos de bônus e eventos com limites.',
    shop: 'Use para criar itens seguros, estoque e inventário de membros.',
    system: 'Use para anúncios, manutenção, logs, saúde e configurações globais.',
    visual: 'Use para registrar backgrounds, banners, rádio e trilhas.',
    clans: 'Use para clãs, comissárias, líderes e cofres de clã.',
    community: 'Use para moderação de chat, bloqueios e denúncias.',
    reports: 'Use para gerar sangria e relatórios copiáveis.'
  };
  return `<p class="muted">${escapeHtml(map[module] || 'Área administrativa separada por função.')}</p>`;
}

export function bindAdminGenericPage() {
  bindAdminShell();
  bindPhoneMasks(document);

  const form = document.querySelector('#adminRealForm');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const slug = location.pathname.replace('/admin/', '') || 'accounts';
    const cfg = PAGE[slug] || DEFAULT;
    const result = document.querySelector('#resultBox');
    const payload = Object.fromEntries(new FormData(form).entries());

    if (payload.phone && !isValidPhone(payload.phone)) {
      toast('Telefone inválido. Use o formato xx xxxxx-xxxx.', 'bad');
      if (result) result.innerHTML = '⚠️ Telefone inválido. Use o formato xx xxxxx-xxxx.';
      return;
    }

    if (!State.token) {
      toast('Sessão ausente. Faça login novamente.', 'bad');
      if (result) result.innerHTML = '⚠️ Sessão ausente. Faça login novamente.';
      return;
    }

    if (result) result.innerHTML = '⏳ Executando ação...';

    try {
      const data = await executeAdminAction(cfg, payload);

      if (result) {
        result.innerHTML = `
          ✅ <b>Ação executada</b><br>
          Módulo: <b>${escapeHtml(cfg.module)}</b><br>
          Ação: <b>${escapeHtml(cfg.action)}</b><br>
          Resposta:<br>
          <code>${escapeHtml(JSON.stringify(data, null, 2))}</code>
        `;
      }

      if (cfg.module === 'visual' && cfg.action === 'music') {
        const url = payload.track_url || '';
        if (url) {
          localStorage.setItem('BLINDERS_YOUTUBE_RADIO_V8', JSON.stringify({ url }));
          window.dispatchEvent(new CustomEvent('blinders:music-updated', { detail: { url } }));
        }
      }

      toast('Ação executada com sucesso', 'good');
    } catch (error) {
      if (result) result.innerHTML = `⚠️ ${escapeHtml(error.message)}`;
      toast(error.message, 'bad');
    }
  });

  document.querySelector('#clearFormBtn')?.addEventListener('click', () => {
    form?.reset();
  });

  document.querySelector('#copyBtn')?.addEventListener('click', async () => {
    const text = document.querySelector('#resultBox')?.innerText || 'Resultado vazio';
    await navigator.clipboard?.writeText(text).catch(() => null);
    toast('Resultado copiado', 'good');
  });
}

async function executeAdminAction(cfg, payload) {
  const data = await rpc('app_admin_execute_action', {
    p_token: State.token,
    p_module: cfg.module,
    p_action: cfg.action,
    p_payload: payload
  });

  return { via: 'supabase-rpc-direct', ...data };
}
