import { BLINDERS_RELEASE } from '../lib/release';

export const ReleaseBadge = () => (
  <div className="release-badge" title={BLINDERS_RELEASE.code}>
    <span>{BLINDERS_RELEASE.name}</span>
    <b>{BLINDERS_RELEASE.version}</b>
  </div>
);
