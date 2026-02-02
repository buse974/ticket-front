import { useState, useCallback } from "react";

export function usePushNotifications() {
  const [isSupported] = useState(
    () => "serviceWorker" in navigator && "PushManager" in window,
  );
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "denied",
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [isSupported]);

  const subscribe = useCallback(
    async (vapidPublicKey: string): Promise<string | null> => {
      if (!isSupported || permission !== "granted") return null;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
        return JSON.stringify(subscription);
      } catch (error) {
        console.error("Failed to subscribe to push:", error);
        return null;
      }
    },
    [isSupported, permission],
  );

  return {
    isSupported,
    permission,
    requestPermission,
    subscribe,
  };
}
