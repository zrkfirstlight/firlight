import {MusicPlayer} from './music-player.js?v=20261119music';
import {mountMotion} from './motion-effects.js?v=20261119sunrise2';
import {mountSky} from './sky-effects.js';
import {mountDawn} from './dawn-effects.js?v=20261119mist';
// Stack uses full-document navigation, with explicit bfcache lifecycle cleanup.
function mount() {
  const node = document.getElementById('experience-config'); if (!node) return () => {};
  const config = JSON.parse(node.textContent);
  let storage; try { storage = window.localStorage; } catch { storage = {getItem: () => null, setItem: () => {}}; }
  const root = document.getElementById('music-player');
  const player = root ? new MusicPlayer(root, config.music, {storage}) : null;
  const stopMotion = mountMotion(config, storage);
  const stopSky = mountSky(config, storage);
  const stopDawn = mountDawn(config);
  return () => { stopDawn(); stopSky(); stopMotion(); player?.destroy(); };
}
let destroy = mount();
window.addEventListener('pagehide', () => destroy());
window.addEventListener('pageshow', e => { if (e.persisted) destroy = mount(); });
