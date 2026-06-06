import { PNG } from '../core/PngAssets.js';
import { shell, bindShellActions } from '../core/UI.js';
import { gameRegistry, gameMeta } from '../games/GameRegistry.js';

let activeGame = null;

export function GamePage() {
  const params = new URLSearchParams(location.search);
  const key = params.get('game') || 'crash';
  const meta = gameMeta[key] || gameMeta.crash;
  return shell(`<div id="gameMount"></div>`, {
    title: `${meta.icon} ${meta.name}`,
    subtitle: meta.desc,
    bg: meta.bg
  });
}

export function bindGamePage() {
  bindShellActions();
  const params = new URLSearchParams(location.search);
  const key = params.get('game') || 'crash';
  const GameClass = gameRegistry[key] || gameRegistry.crash;
  activeGame?.destroy?.();
  activeGame = new GameClass();
  activeGame.mount(document.querySelector('#gameMount'));
}
