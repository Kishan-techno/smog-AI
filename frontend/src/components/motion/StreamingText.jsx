import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function StreamingText({ text = '', className = '' }) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef(null);
  const animatedKey = useRef('');
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (reducedMotion || !text) {
      setShown(text);
      return undefined;
    }
    if (animatedKey.current === text) {
      setShown(text);
      return undefined;
    }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(text);
      return undefined;
    }

    let timer = null;
    const startTyping = () => {
      animatedKey.current = text;
      const words = text.split(' ');
      let idx = 0;
      setShown('');
      timer = setInterval(() => {
        idx += 2;
        if (idx >= words.length) {
          setShown(text);
          clearInterval(timer);
        } else {
          setShown(words.slice(0, idx).join(' '));
        }
      }, 28);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startTyping();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [text, reducedMotion]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
