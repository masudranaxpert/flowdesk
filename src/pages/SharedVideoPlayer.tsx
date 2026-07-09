import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    jwplayer?: any;
  }
}

const JW_LIBRARY = 'https://content.jwplatform.com/libraries/SAHhwvZq.js';
const JW_KEY = 'zTEbSn/eAplL0RLXT030FzOcek6qXmtrxju6Jg==';
const PLAYER_DIV_ID = 'jw-player-target';

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (window.jwplayer) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Script load failed')));
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export default function SharedVideoPlayer() {
  const { type, id, shareCode } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  const [showSpinner, setShowSpinner] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const endpoint = shareCode
      ? `/api/share/${encodeURIComponent(shareCode)}`
      : type && id
        ? `/api/share/${encodeURIComponent(type)}/${encodeURIComponent(id)}`
        : '';

    if (!endpoint) {
      setErrorMsg('No file specified');
      setShowSpinner(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(endpoint);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Shared item not found');

        const item = data.item;
        if (!item || !item.url) throw new Error('Video URL not found');
        
        const fileUrl = item.url;
        let mimeType = item.mimeType || 'mp4';

        await loadScriptOnce(JW_LIBRARY);
        if (cancelled || !window.jwplayer) return;

        window.jwplayer.key = JW_KEY;
        const player = window.jwplayer(PLAYER_DIV_ID);
        player.setup({
          file: fileUrl,
          type: mimeType,
          width: '100%',
          aspectratio: '16:9',
          autostart: false,
          mute: false,
          preload: 'metadata',
          primary: 'html5',
          controls: true,
          playbackRateControls: true,
          displaytitle: true,
          skin: {
            controlbar: { icons: '#fff', iconsActive: '#00DAB4' },
            menus: { textActive: '#fff' },
            tooltips: { text: '#000' },
          },
        });

        player.on('ready', () => {
          if (cancelled) return;
          playerRef.current = player;
          setupForwardButton(player);
          setShowSpinner(false);
        });

        player.on('setupError', () => {
          if (!cancelled) { setErrorMsg('Video setup failed.'); setShowSpinner(false); }
        });

        player.on('error', () => {
          if (!cancelled) { setErrorMsg('Playback error.'); }
        });

        const onKey = (e: KeyboardEvent) => {
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA') return;
          const p = playerRef.current;
          if (!p) return;
          const st = p.getState();
          if (st !== 'playing' && st !== 'paused') return;
          switch (e.code) {
            case 'Space': e.preventDefault(); st === 'playing' ? p.pause() : p.play(); break;
            case 'ArrowRight': e.preventDefault(); p.seek(p.getPosition() + 10); break;
            case 'ArrowLeft': e.preventDefault(); p.seek(Math.max(0, p.getPosition() - 10)); break;
          }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      } catch (e) {
        if (!cancelled) { setErrorMsg(e instanceof Error ? e.message : 'Failed to load player'); setShowSpinner(false); }
      }
    })();

    return () => {
      cancelled = true;
      if (playerRef.current) { try { playerRef.current.remove(); } catch {} playerRef.current = null; }
    };
  }, [type, id, shareCode]);

  return (
    <div className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl animate-fade-in">
        <div className="mb-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="truncate text-lg font-semibold">Shared Video Player</h1>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '16 / 9' }}>
          <div id={PLAYER_DIV_ID} className="absolute inset-0" />

          {showSpinner && !errorMsg && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-lg font-semibold text-destructive">{errorMsg}</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4" /> Go Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function setupForwardButton(player: any) {
  setTimeout(() => {
    const container = player.getContainer?.() as HTMLElement;
    if (!container) return;

    const rewindDisplay = container.querySelector<HTMLElement>('.jw-display-icon-rewind');
    if (rewindDisplay) {
      const fwd = rewindDisplay.cloneNode(true) as HTMLElement;
      const btn = fwd.querySelector<HTMLElement>('.jw-icon-rewind');
      if (btn) {
        btn.style.transform = 'scaleX(-1)';
        btn.setAttribute('aria-label', 'Forward 10s');
        const next = container.querySelector<HTMLElement>('.jw-display-icon-next');
        if (next?.parentNode) {
          next.parentNode.insertBefore(fwd, next);
          btn.onclick = () => player.seek(player.getPosition() + 10);
        }
      }
    }

    const bar = container.querySelector<HTMLElement>('.jw-button-container');
    if (bar) {
      const rewindBar = bar.querySelector<HTMLElement>('.jw-icon-rewind');
      if (rewindBar) {
        const fwdBar = rewindBar.cloneNode(true) as HTMLElement;
        fwdBar.style.transform = 'scaleX(-1)';
        fwdBar.setAttribute('aria-label', 'Forward 10s');
        rewindBar.parentNode?.insertBefore(fwdBar, rewindBar.nextElementSibling);
        fwdBar.onclick = () => player.seek(player.getPosition() + 10);
      }
    }

    const nextBtn = container.querySelector<HTMLElement>('.jw-display-icon-next');
    if (nextBtn) nextBtn.style.display = 'none';
  }, 1000);
}
