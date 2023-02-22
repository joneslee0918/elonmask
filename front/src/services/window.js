
export const openWindow = ({ url, name }) => {
  const top = (window.innerHeight - 400) / 2 + window.screenY;
  const left = (window.innerWidth - 400) / 2 + window.screenX;

  return window.open(
    url,
    name,
    `dialog=yes,top=${top}px,left=${left},width=${400}px,height=${700}px`
  );
};


export const observeWindow = ({ popup, interval, onClose }) => {
  const intervalId = setInterval(() => {
    if (popup.closed) {
      clearInterval(intervalId);
      onClose();
    }
  }, interval || 100);
};
