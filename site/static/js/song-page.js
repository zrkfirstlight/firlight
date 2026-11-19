/* Video waits for a user gesture; avoid overlapping it with sidebar audio. */
(() => {
 const video=document.querySelector('[data-song-video]');if(!video)return;
 const status=document.querySelector('[data-video-status]');
 video.addEventListener('play',()=>{status.textContent='';window.dispatchEvent(new Event('blog:video-play'));});
 video.addEventListener('error',()=>{status.textContent='视频加载失败，请稍后重试，或下载文件播放。';});
 video.querySelector('source')?.addEventListener('error',()=>{status.textContent='视频加载失败，请稍后重试，或下载文件播放。';});
 window.addEventListener('blog:music-play',()=>video.pause());
})();
