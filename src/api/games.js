import { rpc } from './rpc.js';
import { State } from '../core/State.js';

export async function startGame(gameKey, amount, choice) {
  return rpc('app_real_animation_start_game', {
    p_token: State.token,
    p_game_key: gameKey,
    p_amount: amount,
    p_choice: choice
  });
}

export async function finishGame(sessionId, clientResult = {}) {
  return rpc('app_real_animation_finish_game', {
    p_token: State.token,
    p_session_id: sessionId,
    p_client_result: clientResult
  });
}

export async function cashoutCrash(sessionId, multiplier) {
  return rpc('app_real_animation_cashout_crash', {
    p_token: State.token,
    p_session_id: sessionId,
    p_cashout_multiplier: multiplier
  });
}

export async function gameHistory() {
  return rpc('app_real_animation_game_history', { p_token: State.token });
}
