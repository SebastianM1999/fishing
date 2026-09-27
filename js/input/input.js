// Keyboard, mouse, touch and virtual joystick normalized into the same game actions:
//   move {x, y} (screen space, y = up), interact (edge), reel (held), worldTap (screen point)
const MOVE_KEYS = {
  KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};
const INTERACT_KEYS = new Set(["KeyE", "Enter", "Space"]);

export function createInput({ canvas, joystick, knob, reelPad }) {
  const keys = new Set();
  let interactQueued = false;
  let pointerReel = false;
  let taps = [];
  const stick = { id: null, x: 0, y: 0 };

  const isTyping = e => e.target instanceof HTMLElement && e.target.closest("input, textarea, select");

  addEventListener("keydown", e => {
    if (isTyping(e)) return;
    if (MOVE_KEYS[e.code] || e.code === "Space") e.preventDefault();
    if (!e.repeat && INTERACT_KEYS.has(e.code)) {
      // Enter/Space on a focused button should click that button, not act in the world.
      if (!(e.code !== "KeyE" && e.target instanceof HTMLButtonElement)) interactQueued = true;
    }
    keys.add(e.code);
  });
  addEventListener("keyup", e => keys.delete(e.code));
  addEventListener("blur", () => { keys.clear(); pointerReel = false; stick.id = null; stick.x = stick.y = 0; });

  // World canvas: tap/click = move target, hook or reel.
  canvas.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    pointerReel = true;
    taps.push({ x: e.clientX, y: e.clientY });
  });
  reelPad.addEventListener("pointerdown", e => {
    e.preventDefault();
    pointerReel = true;
    taps.push({ x: e.clientX, y: e.clientY, pad: true });
  });
  const release = () => { pointerReel = false; };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);

  // Virtual joystick.
  const RADIUS = 46;
  const updateStick = e => {
    const r = joystick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) { dx *= RADIUS / len; dy *= RADIUS / len; }
    stick.x = dx / RADIUS;
    stick.y = -dy / RADIUS;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  joystick.addEventListener("pointerdown", e => {
    e.preventDefault();
    stick.id = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    updateStick(e);
  });
  joystick.addEventListener("pointermove", e => { if (e.pointerId === stick.id) updateStick(e); });
  const endStick = e => {
    if (e.pointerId !== stick.id) return;
    stick.id = null;
    stick.x = stick.y = 0;
    knob.style.transform = "";
  };
  joystick.addEventListener("pointerup", endStick);
  joystick.addEventListener("pointercancel", endStick);

  return {
    queueInteract() { interactQueued = true; },
    poll() {
      let x = 0, y = 0;
      for (const code of keys) {
        const m = MOVE_KEYS[code];
        if (m) { x += m[0]; y += m[1]; }
      }
      if (stick.id !== null && Math.hypot(stick.x, stick.y) > 0.15) { x += stick.x; y += stick.y; }
      const len = Math.hypot(x, y);
      if (len > 1) { x /= len; y /= len; }
      const actions = {
        move: { x, y },
        interact: interactQueued,
        reel: pointerReel || keys.has("Space"),
        taps,
      };
      interactQueued = false;
      taps = [];
      return actions;
    },
  };
}
