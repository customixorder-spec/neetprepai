import { useState, useEffect, useCallback } from 'react';
import { wakeLockManager } from './wakeLock';

interface UseWakeLockOptions {
  enabled?: boolean;
  tag?: string;
}

export function useWakeLock(options: UseWakeLockOptions = {}) {
  const { enabled = false, tag = 'custom' } = options;
  const [isLocked, setIsLocked] = useState<boolean>(wakeLockManager.isLocked());
  const [isSupported] = useState<boolean>(wakeLockManager.isSupported());

  useEffect(() => {
    const unsubscribe = wakeLockManager.subscribe((active) => {
      setIsLocked(active);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (enabled) {
      wakeLockManager.requestLock(tag);
    } else {
      wakeLockManager.releaseLock(tag);
    }

    return () => {
      wakeLockManager.releaseLock(tag);
    };
  }, [enabled, tag]);

  const request = useCallback(async () => {
    return wakeLockManager.requestLock(tag);
  }, [tag]);

  const release = useCallback(async () => {
    return wakeLockManager.releaseLock(tag);
  }, [tag]);

  return {
    isLocked,
    isSupported,
    request,
    release,
  };
}
