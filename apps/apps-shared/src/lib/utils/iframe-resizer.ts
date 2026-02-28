export const iframeResizer = () => {
  if (typeof window !== 'undefined' && window.parent !== window) {
    const sendHeight = () => {
      const height = document.body.scrollHeight + 24;
      window.parent.postMessage({ type: 'golemui-resize', height }, '*');
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(sendHeight);
    });

    observer.observe(document.body);

    window.addEventListener('load', sendHeight);
  }
};
