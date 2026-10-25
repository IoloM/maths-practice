import { useEffect, useState } from 'react';
import { canSpeak, speak, stopSpeaking } from '../lib/speech';
import { Icon } from './Icon';

/** Read some text aloud; press again to stop. Hidden where the browser can't speak. */
export function ReadAloud({ text, className = 'btn btn-small btn-ghost', label = 'Read aloud' }: { text: () => string; className?: string; label?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => () => void stopSpeaking(), []);
  if (!canSpeak()) return null;
  return (
    <button
      className={className}
      aria-pressed={on}
      onClick={() => {
        if (on) {
          stopSpeaking();
          setOn(false);
        } else {
          setOn(true);
          speak(text(), () => setOn(false));
        }
      }}
    >
      <Icon name={on ? 'stop' : 'speaker'} /> {on ? 'Stop reading' : label}
    </button>
  );
}
