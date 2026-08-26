gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ BOOT SEQUENCE ============ */
const bootFill = document.getElementById('bootFill');
const bootPct = document.getElementById('bootPct');
const boot = document.getElementById('boot');
let progress = 0;
const bootInterval = setInterval(() => {
  progress += Math.random() * 18 + 6;
  if (progress >= 100) {
    progress = 100;
    clearInterval(bootInterval);
    bootFill.style.width = '100%';
    bootPct.textContent = '100%';
    setTimeout(() => {
      boot.classList.add('hidden');
      document.body.classList.add('booted');
      runIntro();
    }, 350);
  } else {
    bootFill.style.width = progress + '%';
    bootPct.textContent = String(Math.floor(progress)).padStart(2, '0') + '%';
  }
}, 140);

/* ============ CUSTOM CURSOR ============ */
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top = mouseY + 'px';
});
function animateRing() {
  ringX += (mouseX - ringX) * 0.18;
  ringY += (mouseY - ringY) * 0.18;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
if (!prefersReducedMotion) animateRing();
document.querySelectorAll('a, .project, button').forEach(el => {
  el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
});

/* ============ HUD CLOCK ============ */
function updateClocks() {
  const t = new Date().toISOString().substr(11, 8);
  const hud = document.getElementById('hudClock');
  const footer = document.getElementById('footerClock');
  if (hud) hud.textContent = t + ' UTC';
  if (footer) footer.textContent = 'SYSTEM TIME · ' + t + ' UTC';
}
updateClocks();
setInterval(updateClocks, 1000);

/* ============ NAV HIDE ON SCROLL ============ */
let lastScroll = 0;
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  const cur = window.scrollY;
  if (cur > lastScroll && cur > 200) {
    nav.style.transform = 'translateY(-100%)';
  } else {
    nav.style.transform = 'translateY(0)';
  }
  lastScroll = cur;
}, { passive: true });
nav.style.transition = 'transform .4s ease';

/* ============ THREE.JS — HERO: NODES RESOLVING INTO GRID ============ */
let heroScene, heroCamera, heroRenderer, heroPoints, heroLines;
const NODE_COUNT = 260;
let nodeTargets = [];
let nodeRandoms = [];

function initHero() {
  const canvas = document.getElementById('heroCanvas');
  heroScene = new THREE.Scene();
  heroCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  heroCamera.position.z = 18;
  heroRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
  heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(NODE_COUNT * 3);
  const cols = 16, rows = Math.ceil(NODE_COUNT / cols);

  for (let i = 0; i < NODE_COUNT; i++) {
    const rx = (Math.random() - 0.5) * 34;
    const ry = (Math.random() - 0.5) * 20;
    const rz = (Math.random() - 0.5) * 14;
    positions[i * 3] = rx;
    positions[i * 3 + 1] = ry;
    positions[i * 3 + 2] = rz;

    const col = i % cols;
    const row = Math.floor(i / cols);
    const gx = (col - cols / 2) * 1.6;
    const gy = (row - rows / 2) * 1.6;
    nodeTargets.push(gx, gy, 0);
    nodeRandoms.push(rx, ry, rz);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x8B7FFF,
    size: 0.11,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true
  });
  heroPoints = new THREE.Points(geometry, material);
  heroScene.add(heroPoints);

  const accentGeo = new THREE.BufferGeometry();
  const accentPos = new Float32Array(40 * 3);
  for (let i = 0; i < 40; i++) {
    accentPos[i * 3] = (Math.random() - 0.5) * 40;
    accentPos[i * 3 + 1] = (Math.random() - 0.5) * 24;
    accentPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;
  }
  accentGeo.setAttribute('position', new THREE.BufferAttribute(accentPos, 3));
  const accentMat = new THREE.PointsMaterial({ color: 0xFFB454, size: 0.06, transparent: true, opacity: 0.4 });
  heroScene.add(new THREE.Points(accentGeo, accentMat));

  document.getElementById('nodeCount').textContent = NODE_COUNT;

  animateHero();
}

let heroClock = 0;
function animateHero() {
  requestAnimationFrame(animateHero);
  heroClock += 0.003;
  if (heroPoints) {
    heroPoints.rotation.y = Math.sin(heroClock) * 0.08;
    heroPoints.rotation.x = Math.cos(heroClock * 0.7) * 0.04;
  }
  heroRenderer.render(heroScene, heroCamera);
}

function resolveHeroNodes(progress) {
  if (!heroPoints) return;
  const pos = heroPoints.geometry.attributes.position.array;
  for (let i = 0; i < NODE_COUNT; i++) {
    const ix = i * 3;
    pos[ix] = nodeRandoms[ix] + (nodeTargets[ix] - nodeRandoms[ix]) * progress;
    pos[ix + 1] = nodeRandoms[ix + 1] + (nodeTargets[ix + 1] - nodeRandoms[ix + 1]) * progress;
    pos[ix + 2] = nodeRandoms[ix + 2] + (nodeTargets[ix + 2] - nodeRandoms[ix + 2]) * progress;
  }
  heroPoints.geometry.attributes.position.needsUpdate = true;
}

if (!prefersReducedMotion) {
  initHero();
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 0.6,
    onUpdate: (self) => resolveHeroNodes(self.progress)
  });
}

window.addEventListener('resize', () => {
  if (!heroRenderer) return;
  heroCamera.aspect = window.innerWidth / window.innerHeight;
  heroCamera.updateProjectionMatrix();
  heroRenderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============ THREE.JS — CONTACT: AMBIENT DRIFT ============ */
function initContact() {
  const canvas = document.getElementById('contactCanvas');
  if (!canvas) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 14;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geo = new THREE.BufferGeometry();
  const count = 120;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x59D8C9, size: 0.08, transparent: true, opacity: 0.5 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let t = 0;
  function loop() {
    requestAnimationFrame(loop);
    t += 0.002;
    points.rotation.y = t;
    renderer.render(scene, camera);
  }
  loop();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
if (!prefersReducedMotion) initContact();

/* ============ INTRO TIMELINE (after boot) ============ */
function runIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.6 }, 0.1)
    .from('.hero-title .line', { yPercent: 110, duration: 0.9, stagger: 0.08 }, 0.15)
    .from('.hero-sub', { opacity: 0, y: 16, duration: 0.7 }, '-=0.5')
    .from('.hero-ctas', { opacity: 0, y: 16, duration: 0.7 }, '-=0.5')
    .from('.hero-scroll-cue', { opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.hud-corner', { opacity: 0, duration: 0.5, stagger: 0.06 }, '-=0.6');
}
gsap.set('.hero-eyebrow', { opacity: 0, y: -10 });
gsap.set('.hero-title .line', { });

/* ============ THESIS WORD REVEAL ============ */
ScrollTrigger.create({
  trigger: '.thesis',
  start: 'top 70%',
  end: 'bottom 60%',
  scrub: 0.4,
  onUpdate: (self) => {
    const words = document.querySelectorAll('.reveal-word');
    const total = words.length;
    const activeCount = Math.floor(self.progress * total);
    words.forEach((w, i) => {
      w.style.opacity = i < activeCount ? 1 : 0.18;
    });
  }
});

/* ============ PROJECT REVEALS + TERMINAL TYPE-ON ============ */
document.querySelectorAll('.project').forEach((project) => {
  gsap.from(project.querySelector('.project-visual'), {
    scrollTrigger: { trigger: project, start: 'top 78%' },
    opacity: 0, y: 60, duration: 0.9, ease: 'power3.out'
  });
  gsap.from(project.querySelector('.project-info'), {
    scrollTrigger: { trigger: project, start: 'top 78%' },
    opacity: 0, y: 30, duration: 0.9, delay: 0.15, ease: 'power3.out'
  });

  const lines = project.querySelectorAll('.term-line');
  const cursorEl = project.querySelector('.term-cursor');
  ScrollTrigger.create({
    trigger: project,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      lines.forEach((line, i) => {
        tl.to(line, { opacity: 1, duration: 0.05 }, i * 0.35);
      });
      if (cursorEl) tl.to(cursorEl, { opacity: 1, duration: 0.1 }, lines.length * 0.35);
    }
  });
});

/* ============ CREDENTIALS ROW REVEAL ============ */
gsap.utils.toArray('.cred-row').forEach((row, i) => {
  gsap.from(row, {
    scrollTrigger: { trigger: row, start: 'top 85%' },
    opacity: 0, y: 20, duration: 0.6, delay: (i % 3) * 0.05, ease: 'power2.out'
  });
});
gsap.utils.toArray('.cred-heading').forEach((h) => {
  gsap.from(h, {
    scrollTrigger: { trigger: h, start: 'top 88%' },
    opacity: 0, y: 12, duration: 0.5, ease: 'power2.out'
  });
});

/* ============ CONTACT LINKS STAGGER ============ */
gsap.from('.contact-link', {
  scrollTrigger: { trigger: '.contact-links', start: 'top 80%' },
  opacity: 0, x: -20, duration: 0.6, stagger: 0.1, ease: 'power2.out'
});
gsap.from('.contact-title', {
  scrollTrigger: { trigger: '.contact-title', start: 'top 85%' },
  opacity: 0, y: 24, duration: 0.8, ease: 'power3.out'
});

/* ============ BEVZILLA PARALLAX ============ */
gsap.to('.bevzilla-video-wrap', {
  scrollTrigger: { trigger: '.bevzilla', start: 'top bottom', end: 'bottom top', scrub: true },
  yPercent: 15,
  ease: 'none'
});
gsap.from('.bevzilla-content > *', {
  scrollTrigger: { trigger: '.bevzilla', start: 'top 60%' },
  opacity: 0, y: 30, duration: 0.8, stagger: 0.1, ease: 'power3.out'
});

/* ============ PROJECT LINK PLACEHOLDER HANDLER ============ */
document.querySelectorAll('[data-project-link]').forEach(link => {
  link.addEventListener('click', (e) => {
    if (link.getAttribute('href') === '#') {
      e.preventDefault();
      link.textContent = 'Link coming soon';
      setTimeout(() => {
        link.innerHTML = 'View project <span class="btn-arrow">→</span>';
      }, 1500);
    }
  });
});
