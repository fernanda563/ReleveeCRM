import * as React from "react";

/**
 * Detects a real handheld device (phone/tablet with a camera), not just a narrow window.
 * Combines UA hints, coarse pointer and touch support so a resized desktop browser
 * is never treated as a phone.
 */
export function useIsMobileDevice() {
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);

  React.useEffect(() => {
    const detect = () => {
      const ua = navigator.userAgent || "";
      const uaMobile =
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile|Silk|BlackBerry/i.test(ua);
      // iPadOS reports as Mac but exposes touch points.
      const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const touch = navigator.maxTouchPoints > 0;

      setIsMobileDevice((uaMobile || iPadOS) && (coarsePointer || touch));
    };

    detect();
    window.addEventListener("orientationchange", detect);
    return () => window.removeEventListener("orientationchange", detect);
  }, []);

  return isMobileDevice;
}
