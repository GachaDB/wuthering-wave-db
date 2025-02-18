// GSAP Animations
gsap.from(".hero-content h1", {
  opacity: 0,
  y: -50,
  duration: 1,
  delay: 0.5,
});

gsap.from(".hero-content p", {
  opacity: 0,
  y: 50,
  duration: 1,
  delay: 1,
});

gsap.from(".cta-button", {
  opacity: 0,
  scale: 0.5,
  duration: 1,
  delay: 1.5,
});