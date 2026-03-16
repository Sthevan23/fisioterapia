(() => {
  const CONFIG = {
    whatsappPhoneE164DigitsOnly: "5537991165725", // <- troque para seu número (ex: 5511999999999)
    whatsappDefaultMessage:
      "Olá! Gostaria de agendar uma avaliação com a Thaís Marques (Fisioterapia e Pilates Clínico).",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const toastEl = $("#toast");
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("is-on"), 3200);
  }

  function buildWhatsappLink(messageOverride) {
    const phone = String(CONFIG.whatsappPhoneE164DigitsOnly || "").replace(/\D/g, "");
    const msg = encodeURIComponent(messageOverride || CONFIG.whatsappDefaultMessage || "");
    return `https://wa.me/${phone}?text=${msg}`;
  }

  function wireWhatsappLinks() {
    const links = $$("[data-whatsapp-link]");
    const href = buildWhatsappLink();
    links.forEach((a) => {
      a.setAttribute("href", href);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });

    if (String(CONFIG.whatsappPhoneE164DigitsOnly || "").includes("0000")) {
      showToast("Dica: atualize o número do WhatsApp em js/script.js (CONFIG).");
    }
  }

  function wireYear() {
    const el = $("#ano");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function wireMobileNav() {
    const toggle = $("[data-nav-toggle]");
    const nav = $("[data-nav]");
    const links = $$("[data-nav-link]");
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    links.forEach((l) => l.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (nav.classList.contains("is-open") && !nav.contains(target) && !toggle.contains(target)) {
        setOpen(false);
      }
    });
  }

  function wireRevealOnScroll() {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el, idx) => {
      el.style.transitionDelay = `${Math.min(idx * 45, 220)}ms`;
      io.observe(el);
    });
  }

  function wireActiveNavLink() {
    const sections = $$("main section[id]");
    const navLinks = $$("[data-nav-link]");
    if (!sections.length || !navLinks.length || !("IntersectionObserver" in window)) return;

    const byId = new Map(navLinks.map((a) => [a.getAttribute("href")?.slice(1), a]));

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (!visible) return;
        const id = visible.target.getAttribute("id");
        navLinks.forEach((a) => a.classList.remove("is-active"));
        const link = byId.get(id);
        if (link) link.classList.add("is-active");
      },
      { threshold: [0.15, 0.35, 0.55] }
    );

    sections.forEach((s) => io.observe(s));
  }

  function validateField(input) {
    const field = input.closest(".field");
    if (!field) return true;

    const errorEl = $(".field__error", field);
    if (!errorEl) return input.checkValidity();

    let msg = "";
    if (input.validity.valueMissing) msg = "Este campo é obrigatório.";
    else if (input.validity.typeMismatch) msg = "Preencha com um formato válido.";
    else if (input.validity.tooShort) msg = "Preencha com mais detalhes.";

    errorEl.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  function wireForm() {
    const form = $("#formContato");
    if (!form) return;

    const inputs = $$("input, textarea", form);
    inputs.forEach((el) => {
      el.addEventListener("blur", () => validateField(el));
      el.addEventListener("input", () => {
        if (el.getAttribute("aria-invalid") === "true") validateField(el);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const ok = inputs.map((el) => validateField(el)).every(Boolean);
      if (!ok) {
        showToast("Por favor, revise os campos destacados.");
        return;
      }

      const fd = new FormData(form);
      const nome = String(fd.get("nome") || "").trim();
      const msg = String(fd.get("mensagem") || "").trim();

      const composed = `Olá! Meu nome é ${nome}. ${msg}`;
      const wa = buildWhatsappLink(composed);

      showToast("Mensagem pronta. Vou abrir o WhatsApp para enviar.");
      window.setTimeout(() => window.open(wa, "_blank", "noopener,noreferrer"), 400);
      form.reset();
      inputs.forEach((el) => {
        el.setAttribute("aria-invalid", "false");
        const field = el.closest(".field");
        const errorEl = field ? $(".field__error", field) : null;
        if (errorEl) errorEl.textContent = "";
      });
    });
  }

  wireYear();
  wireWhatsappLinks();
  wireMobileNav();
  wireRevealOnScroll();
  wireActiveNavLink();
  wireForm();
})();

