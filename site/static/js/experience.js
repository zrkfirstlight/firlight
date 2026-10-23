import {MusicPlayer} from './music-player.js';
import {mountMotion} from './motion-effects.js';
import {mountSky} from './sky-effects.js';
// Stack uses full-document navigation, with explicit bfcache lifecycle cleanup.
function mount() {
  const node = document.getElementById('experience-config'); if (!node) return () => {};
  const config = JSON.parse(node.textContent);
  let storage; try { storage = window.localStorage; } catch { storage = {getItem: () => null, setItem: () => {}}; }
  const root = document.getElementById('music-player');
  const player = root ? new MusicPlayer(root, config.music, {storage}) : null;
  const stopMotion = mountMotion(config, storage);
  const stopSky = mountSky(config, storage);
  return () => { stopSky(); stopMotion(); player?.destroy(); };
}
let destroy = mount();
window.addEventListener('pagehide', () => destroy());
window.addEventListener('pageshow', e => { if (e.persisted) destroy = mount(); });
