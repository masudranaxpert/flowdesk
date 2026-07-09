import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    jwplayer?: any;
  }
}

const JW_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/jwplayer@8.32.0/jwplayer.js',
  'https://content.jwplatform.com/libraries/SAHhwvZq.js',
];
const JW_KEY = 'zTEbSn/eAplL0RLXT030FzOcek6qXmtrxju6Jg==';
const PLAYER_DIV_ID = 'jw-player-container';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement('script');
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export default function VideoPlayer() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fileId) return;
    let destroyed = false;
    const token = localStorage.getItem('auth-token') || '';
    const sourceUrl = `/api/files/${fileId}?token=${encodeURIComponent(token)}`;

    (async () => {
      try {
        for (const src of JW_SCRIPTS) await loadScript(src);
        if (destroyed) return;
        const jw = window.jwplayer;
        if (!jw) throw new Error('JWPlayer failed to initialize');
        jw.key = JW_KEY;
        playerRef.current = jw(PLAYER_DIV_ID).setup({
          sources: [{ file: sourceUrl, type: 'mp4' }],
          aspectratio: '16:9',
          preload: 'metadata',
          autostart: true,
          controls: true,
          primary: 'html5',
          displaytitle: true,
          playbackRateControls: true,
          cast: {},
          skin: {
            controlbar: { icons: '#fff', iconsActive: 'var(--primary)' },
            menus: { textActive: '#fff' },
            tooltips: { text: '#000' },
          },
        });

        playerRef.current.on('ready', () => {
          setupForwardButton(playerRef.current);
        });

        playerRef.current.on('setupError', () => {
          setError('Video setup failed. The file may not be a supported video format.');
          setLoading(false);
        });

        playerRef.current.on('error', () => {
          setError('Playback error occurred.');
          setLoading(false);
        });

        setLoading(false);

        const onKey = (e: KeyboardEvent) => {
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA') return;
          const p = playerRef.current;
          if (!p) return;
          const state = p.getState();
          if (state !== 'playing' && state !== 'paused') return;
          switch (e.code) {
            case 'Space':
              e.preventDefault();
              if (state === 'playing') p.pause(); else p.play();
              break;
            case 'ArrowRight':
              e.preventDefault();
              p.seek(p.getPosition() + 10);
              break;
            case 'ArrowLeft':
              e.preventDefault();
              p.seek(Math.max(0, p.getPosition() - 10));
              break;
          }
        };
        document.addEventListener('keydown', onKey);

        return () => {
          document.removeEventListener('keydown', onKey);
        };
      } catch (e) {
        if (!destroyed) {
          setError(e instanceof Error ? e.message : 'Failed to load player');
          setLoading(false);
        }
      }
    })();

    return () => {
      destroyed = true;
      if (playerRef.current) {
        try { playerRef.current.remove(); } catch {}
        playerRef.current = null;
      }
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-[70vh] place-items-center text-center">
        <div>
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/files')}>
            <ArrowLeft className="h-4 w-4" /> Back to Files
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/files')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="truncate text-lg font-semibold">Video Player</h1>
      </div>

      <div className="overflow-hidden rounded-2xl bg-black">
        <div id={PLAYER_DIV_ID} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <kbd className="rounded border border-border px-2 py-0.5">Space</kbd>
        <span>Play/Pause</span>
        <kbd className="rounded border border-border px-2 py-0.5">← →</kbd>
        <span>Seek 10s</span>
      </div>
    </div>
  );
}

function setupForwardButton(player: any) {
  setTimeout(() => {
    const container = document.getElementById(PLAYER_DIV_ID);
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