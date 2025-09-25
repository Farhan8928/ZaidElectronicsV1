import { useEffect, useRef, useState } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    console.log(`🚀 ${componentName} mounted in ${mountTime.current.toFixed(2)}ms`);
    
    return () => {
      const unmountTime = performance.now();
      console.log(`🔄 ${componentName} unmounted after ${(unmountTime - mountTime.current).toFixed(2)}ms`);
    };
  }, [componentName]);

  const startRender = () => {
    renderStartTime.current = performance.now();
  };

  const endRender = () => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > 16) { // More than one frame (16ms at 60fps)
      console.warn(`⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms (slow)`);
    }
  };

  return { startRender, endRender };
}

export function useMemoryUsage() {
  useEffect(() => {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        console.log('📊 Memory Usage:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        });
      };

      checkMemory();
      const interval = setInterval(checkMemory, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, []);
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}
