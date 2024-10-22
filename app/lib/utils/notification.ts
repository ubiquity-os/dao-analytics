export function toastNotification(message: string, timeout?: number) {
  const toast = document.createElement("div");
  toast.textContent = message;

  const style = `
        position: fixed;
        bottom: 0;
        right: 0;
        background-color: #333;
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;
  toast.style.cssText = style;

  document.body.appendChild(toast);

  function killToast() {
    document.body.removeChild(toast);
  }

  if (!timeout) {
    return killToast;
  }

  setTimeout(() => {
    killToast();
  }, timeout);

  return killToast;
}
