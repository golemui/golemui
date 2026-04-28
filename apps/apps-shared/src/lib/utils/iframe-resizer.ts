export const iframeResizer = () => {
  if (typeof window !== 'undefined' && window.parent !== window) {
    const sendHeight = () => {
      const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
      window.parent.postMessage({ type: 'golemui-resize', height }, '*');
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(sendHeight);
    });

    observer.observe(document.body);

    window.addEventListener('load', sendHeight);
  }
};
