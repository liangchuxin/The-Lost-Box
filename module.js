window.addEventListener("message", event => {
  if (event.source !== window.parent || event.origin !== location.origin) return;
  if (event.data === "pause-puzzle" && typeof noLoop === "function") noLoop();
  if (event.data === "resume-puzzle" && typeof loop === "function") loop();
});

// Only navigation and retry/reset controls use the UI click sound.
const buttonSound = new Audio(new URL("sounds/button-click.mp3", document.currentScript.src).href);
document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button || button.matches(":disabled")) return;
  if (!["begin", "return-room", "reset", "reset-game"].includes(button.id)) return;
  buttonSound.currentTime = 0;
  buttonSound.play().catch(error => {
    if (error.name !== "AbortError") console.warn("Button sound could not start:", error.message);
  });
}, true);
