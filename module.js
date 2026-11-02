window.addEventListener("message", event => {
  if (event.source !== window.parent || event.origin !== location.origin) return;
  if (event.data === "pause-puzzle" && typeof noLoop === "function") noLoop();
  if (event.data === "resume-puzzle" && typeof loop === "function") loop();
});
