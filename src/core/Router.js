import { Performance } from './Performance.js';
import { LoginPage, bindLoginPage } from '../pages/LoginPage.js';
import { RegisterPage, bindRegisterPage } from '../pages/RegisterPage.js';
import { MenuPage, bindMenuPage } from '../pages/MenuPage.js';
import { GamesPage, bindGamesPage } from '../pages/GamesPage.js';
import { GamePage, bindGamePage } from '../pages/GamePage.js';
import { GraphicsPage, bindGraphicsPage } from '../pages/GraphicsPage.js';
import { AdminPage, bindAdminPage } from '../pages/AdminPage.js';
import { AdminGenericPage, bindAdminGenericPage } from '../pages/admin/AdminGenericPages.js';
import { BonusPage, bindBonusPage } from '../pages/bonus/BonusPage.js';
import { ClansPage, bindClansPage } from '../pages/clans/ClansPage.js';
import { ShopPage, bindShopPage } from '../pages/shop/ShopPage.js';
import { CommunityPage, bindCommunityPage } from '../pages/community/CommunityPage.js';
import { ReportsPage, bindReportsPage } from '../pages/reports/ReportsPage.js';
import { SecurityPage, bindSecurityPage } from '../pages/security/SecurityPage.js';
import { EventsPage, bindEventsPage } from '../pages/events/EventsPage.js';
import { MissionsPage, bindMissionsPage } from '../pages/missions/MissionsPage.js';
import { RankingsPage, bindRankingsPage } from '../pages/rankings/RankingsPage.js';
import { ProfilePage, bindProfilePage } from '../pages/profile/ProfilePage.js';
import { CommandCenterPage, bindCommandCenterPage } from '../pages/admin/CommandCenterPage.js';

export function route() {
  const path = normalize(location.pathname);
  if (path === '/login') return render(LoginPage, bindLoginPage);
  if (path === '/register') return render(RegisterPage, bindRegisterPage);
  if (path === '/games') return render(GamesPage, bindGamesPage);
  if (path === '/game') return render(GamePage, bindGamePage);
  if (path === '/graphics') return render(GraphicsPage, bindGraphicsPage);
  if (path === '/bonus') return render(BonusPage, bindBonusPage);
  if (path === '/clans') return render(ClansPage, bindClansPage);
  if (path === '/shop') return render(ShopPage, bindShopPage);
  if (path === '/community') return render(CommunityPage, bindCommunityPage);
  if (path === '/reports') return render(ReportsPage, bindReportsPage);
  if (path === '/profile') return render(ProfilePage, bindProfilePage);
  if (path === '/rankings') return render(RankingsPage, bindRankingsPage);
  if (path === '/missions') return render(MissionsPage, bindMissionsPage);
  if (path === '/events') return render(EventsPage, bindEventsPage);
  if (path === '/security') return render(SecurityPage, bindSecurityPage);
  if (path === '/admin/command') return render(CommandCenterPage, bindCommandCenterPage);
  if (path === '/admin') return render(AdminPage, bindAdminPage);
  if (path.startsWith('/admin/')) return render(AdminGenericPage, bindAdminGenericPage);
  return render(MenuPage, bindMenuPage);
}

function normalize(path) {
  return path.replace(/\/index\.html$/, '').replace(/\.html$/, '') || '/menu';
}

function render(page, bind) {
  Performance.cleanup();
  Performance.detect();
  document.getElementById('app').innerHTML = page();
  bind?.();
  interceptLinks();
}

function interceptLinks() {
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    if (link.dataset.routerReady) return;
    link.dataset.routerReady = '1';
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      history.pushState({}, '', link.getAttribute('href'));
      route();
    });
  });
}

window.addEventListener('popstate', route);
