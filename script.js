const canvas = document.querySelector("#orbital-canvas");
const context = canvas?.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const contactEmail = "thisisme1289@gmail.com";

let width = 0;
let height = 0;
let points = [];
let angle = 0;

function getSceneCenter() {
  return {
    x: width < 900 ? width * 0.5 : width * 0.68,
    y: height * 0.48,
  };
}

function resizeCanvas() {
  if (!canvas || !context) return;

  width = window.innerWidth;
  height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const count = width < 700 ? 70 : 130;
  points = Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 7,
    y: (Math.random() - 0.5) * 5,
    z: (Math.random() - 0.5) * 7,
    size: 1 + Math.random() * 2.2,
    hue: Math.random() > 0.55 ? "110, 231, 168" : Math.random() > 0.45 ? "255, 140, 112" : "246, 200, 95",
  }));
}

function projectPoint(point, rotation) {
  const center = getSceneCenter();
  const cosY = Math.cos(rotation);
  const sinY = Math.sin(rotation);
  const cosX = Math.cos(rotation * 0.45);
  const sinX = Math.sin(rotation * 0.45);

  const rotatedX = point.x * cosY - point.z * sinY;
  const rotatedZ = point.x * sinY + point.z * cosY;
  const rotatedY = point.y * cosX - rotatedZ * sinX;
  const finalZ = point.y * sinX + rotatedZ * cosX + 9;
  const scale = Math.min(width, height) / finalZ;

  return {
    x: center.x + rotatedX * scale,
    y: center.y + rotatedY * scale,
    z: finalZ,
    alpha: Math.max(0.18, 1 - finalZ / 15),
    size: point.size * Math.max(0.6, scale / 78),
    hue: point.hue,
  };
}

function drawScene() {
  if (!context) return;

  context.clearRect(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "lighter";

  const projected = points.map((point) => projectPoint(point, angle)).sort((a, b) => b.z - a.z);
  const center = getSceneCenter();

  context.strokeStyle = "rgba(99, 216, 255, 0.16)";
  context.lineWidth = 1;
  for (let ring = 0; ring < 3; ring += 1) {
    context.beginPath();
    context.ellipse(center.x, center.y, 130 + ring * 42, 58 + ring * 18, angle * (0.45 + ring * 0.08), 0, Math.PI * 2);
    context.stroke();
  }

  projected.forEach((point, index) => {
    for (let next = index + 1; next < Math.min(index + 5, projected.length); next += 1) {
      const sibling = projected[next];
      const distance = Math.hypot(point.x - sibling.x, point.y - sibling.y);
      if (distance < 95) {
        context.strokeStyle = `rgba(255, 255, 255, ${0.08 * (1 - distance / 95)})`;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(sibling.x, sibling.y);
        context.stroke();
      }
    }

    context.fillStyle = `rgba(${point.hue}, ${point.alpha})`;
    context.beginPath();
    context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
    context.fill();
  });

  context.restore();

  if (!reduceMotion) {
    angle += 0.004;
    requestAnimationFrame(drawScene);
  }
}

if (canvas && context) {
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  drawScene();
}

const missionNodes = document.querySelectorAll(".mission-node");
const focusScore = document.querySelector("#focus-score");

missionNodes.forEach((node) => {
  node.addEventListener("click", () => {
    const targetId = node.dataset.target;
    const targetSection = document.querySelector(`#${targetId}`);
    if (!targetSection) return;

    targetSection.scrollIntoView({ behavior: "smooth" });
    missionNodes.forEach((item) => item.classList.remove("active"));
    node.classList.add("active");
    if (focusScore) {
      focusScore.textContent = node.querySelector("strong")?.textContent || "";
    }
  });
});

const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    projectCards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category.includes(filter);
      card.classList.toggle("hidden", !shouldShow);
    });
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const matchingNode = document.querySelector(`.mission-node[data-target="${entry.target.id}"]`);
      if (!matchingNode) return;
      missionNodes.forEach((node) => node.classList.remove("active"));
      matchingNode.classList.add("active");
      if (focusScore) {
        focusScore.textContent = matchingNode.querySelector("strong")?.textContent || "";
      }
    });
  },
  { rootMargin: "-40% 0px -50% 0px" },
);

document.querySelectorAll("#projects, #process, #contact").forEach((section) => sectionObserver.observe(section));

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.name.value.trim() || "there";
    const type = form.elements["project-type"].value.toLowerCase();
    const message = form.elements.message.value.trim();
    const subject = encodeURIComponent(`New ${type} project inquiry`);
    const body = encodeURIComponent(`Hi Abhishek,\n\nI'm ${name}.\n\n${message || "I want to discuss a project."}`);
    const formNote = document.querySelector("#form-note");

    if (formNote) {
      formNote.textContent = "Opening your email app with a prepared project message.";
    }
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  });
}
