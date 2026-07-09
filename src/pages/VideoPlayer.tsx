import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JWPlayer from '@jwplayer/jwplayer-react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const JW_LIBRARY = 'https://content.jwplatform.com/libraries/SAHhwvZq.js';
const JW_KEY = 'zTEbSn/eAplL0RLXT030FzOcek6qXmtrxju6Jg==';

export default function VideoPlayer() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const playerRef = useRef<any>(null);
  const [error, setError] = useState('');

  const fileUrl = fileId
    ? `/api/files/${fileId}?token=${encodeURIComponent(localStorage.getItem('auth-token') || '')}`
    : '';

  useEffect(() => {
    if (!fileId) {
      setError('No file specified');
      return;
    }
  }, [fileId]);

  const handleReady = (player: any) => {
    playerRef.current = player;
    setupForwardButton(player);
    setupKeyboardShortcuts(player);
  };

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
        <JWPlayer
          file={fileUrl}
          library={JW_LIBRARY}
          config={{
            key: JW_KEY,
            aspectratio: '16:9',
            autostart: true,
            preload: 'metadata',
            primary: 'html5',
            playbackRateControls: true,
            skin: {
              controlbar: { icons: '#fff', iconsActive: '#00DAB4' },
              menus: { textActive: '#fff' },
              tooltips: { text: '#000' },
            },
          }}
          didMountCallback={({ player }: { player: any }) => handleReady(player)}
          onSetupError={() => setError('Video setup failed. The file may not be a supported video format.')}
          onError={() => setError('Playback error occurred.')}
        />
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

function setupKeyboardShortcuts(player: any) {
  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const state = player.getState?.();
    if (state !== 'playing' && state !== 'paused') return;
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (state === 'playing') player.pause(); else player.play();
        break;
      case 'ArrowRight':
        e.preventDefault();
        player.seek(player.getPosition() + 10);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        player.seek(Math.max(0, player.getPosition() - 10));
        break;
    }
  };
  document.addEventListener('keydown', onKey);
}