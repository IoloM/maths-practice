import { useState } from 'react';
import { Icon } from './Icon';

/**
 * A video that only loads when you press play (from youtube-nocookie.com), so nothing is sent to
 * YouTube just by opening the page, and the page stays quick.
 */
export function VideoCard({ id, title, channel }: { id: string; title: string; channel?: string }) {
  const [on, setOn] = useState(false);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  return (
    <figure className="video-card">
      <div className="video-frame">
        {on ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button className="video-play" onClick={() => setOn(true)} disabled={offline} aria-label={`Play video: ${title}`}>
            <Icon name="play" />
            <span>{offline ? 'Videos need an internet connection' : 'Play video'}</span>
          </button>
        )}
      </div>
      <figcaption className="small">
        <b>{title}</b>
        {channel && <span className="muted"> · {channel}</span>}{' '}
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
          Open on YouTube
        </a>
      </figcaption>
    </figure>
  );
}
