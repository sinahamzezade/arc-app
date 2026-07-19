/** Side-cannon burst — celebration on lesson complete. Lazy-loads canvas-confetti. */
export async function fireLessonConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#ffc928", "#6b4eff", "#ff8a3d", "#2dbe65", "#ffffff"];
  const end = Date.now() + 2200;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 58,
      startVelocity: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      zIndex: 40,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 58,
      startVelocity: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      zIndex: 40,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();

  confetti({
    particleCount: 48,
    spread: 80,
    startVelocity: 38,
    origin: { x: 0.5, y: 0.35 },
    colors,
    shapes: ["circle", "square"],
    zIndex: 40,
    disableForReducedMotion: true,
  });
}
