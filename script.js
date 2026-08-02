(() => {
  const body = document.body;
  const bar = document.querySelector('.progress-ring__bar');
  const label = document.querySelector('.splash-percent');
  const CIRCUMFERENCE = 339.29;
  const RING_START = 550;
  const RING_DURATION = 900;
  const start = performance.now();
  let pageReady = false;
  let ringDone = false;

  function tickRing(now) {
    const elapsed = now - start - RING_START;
    if (elapsed < 0) {
      requestAnimationFrame(tickRing);
      return;
    }
    const pct = Math.min(1, elapsed / RING_DURATION);
    if (bar) bar.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
    if (label) label.textContent = Math.round(pct * 100) + '%';
    if (pct < 1) {
      requestAnimationFrame(tickRing);
    } else {
      ringDone = true;
      maybeReveal();
    }
  }

  function maybeReveal() {
    if (!ringDone || !pageReady) return;
    body.classList.add('is-flashing');
    body.classList.remove('is-loading');
    body.classList.add('is-loaded');
  }

  requestAnimationFrame(tickRing);

  if (document.readyState === 'complete') {
    pageReady = true;
    maybeReveal();
  } else {
    window.addEventListener('load', () => { pageReady = true; maybeReveal(); });
  }
})();

/* ==========================================================
   Navigation dynamique du bloc de texte (hero)
   Pas de scroll de page : le contenu de gauche se remplace
   avec une animation "sortie vers le haut / entrée par le bas"
   ========================================================== */
(() => {
  const heroInner = document.getElementById('hero-inner');
  const nav = document.getElementById('sections-nav');
  if (!heroInner || !nav) return;

  const SECTIONS = {
    accueil: {
      title: 'Développer sans jamais<br>sacrifier la <span class="accent">sécurité</span>.',
      text: "AsGuard développe et sécurise vos applications, sites vitrines et infrastructures - une seule équipe, du premier commit à la mise en production.",
      cta: { text: 'Discuter de votre projet →', action: 'open-form' }
    },
    services: {
      title: 'Nos <span class="accent">services</span>.',
      text: "Développement d'applications web & mobiles, sites vitrines et audit de sécurité - chaque projet est pensé du code à l'infrastructure. (Texte d'exemple à remplacer.)",
      cta: null
    },
    projets: {
      title: 'Nos <span class="accent">projets</span>.',
      text: "Un aperçu de réalisations récentes : applications métier, plateformes sécurisées et sites vitrines livrés clé en main. (Texte d'exemple à remplacer.)",
      cta: null
    },
    entreprise: {
      title: 'Qui est <span class="accent">AsGuard</span>.',
      text: "Une équipe qui allie développement et cybersécurité pour livrer des projets robustes, du premier commit à la mise en production. (Texte d'exemple à remplacer.)",
      cta: null,
      extra: `
        <div class="founders">
          <div class="founder">
            <div class="founder-photo"><span>EV</span></div>
            <span class="founder-name">Evan Barreiros</span>
          </div>
          <div class="founder">
            <div class="founder-photo"><span>EN</span></div>
            <span class="founder-name">Enzo Barreiros</span>
          </div>
          <div class="founder">
            <div class="founder-photo"><span>ID</span></div>
            <span class="founder-name">Idir bidulchouette</span>
          </div>
        </div>
      `
    },
    contact: {
      title: 'Parlons de votre <span class="accent">projet</span>.',
      text: "Décrivez-nous votre besoin, on revient vers vous rapidement pour en discuter. (Texte d'exemple à remplacer.)",
      cta: { text: 'Envoyer un message →', action: 'open-form' }
    }
  };

  const FORM_HTML = `
    <div class="contact-form-wrap">
      <button type="button" class="form-back" id="form-back-btn">← Retour</button>
      <h2>Discutons de votre projet</h2>
      <form id="contact-form" novalidate>
        <div class="form-row">
          <label>Nom<input type="text" name="nom" autocomplete="family-name"></label>
          <label>Prénom<input type="text" name="prenom" autocomplete="given-name"></label>
        </div>
        <label>Email<input type="email" name="email" autocomplete="email"></label>
        <label>Téléphone<input type="tel" name="telephone" autocomplete="tel"></label>
        <label>LinkedIn<input type="text" name="linkedin" placeholder="linkedin.com/in/..."></label>
        <label>Votre message<textarea name="message" rows="4"></textarea></label>
        <button type="submit" class="cta form-submit">Envoyer →</button>
      </form>
    </div>
  `;

  let current = 'accueil';
  let animating = false;
  let formOrigin = null;

  function renderContent(id) {
    const data = SECTIONS[id];
    if (!data) return;
    let html = `<h1>${data.title}</h1><p>${data.text}</p>`;
    if (data.extra) {
      html += data.extra;
    }
    if (data.cta) {
      if (data.cta.action) {
        html += `<a class="cta" href="#" data-action="${data.cta.action}">${data.cta.text}</a>`;
      } else {
        html += `<a class="cta" href="${data.cta.href}">${data.cta.text}</a>`;
      }
    }
    heroInner.innerHTML = html;
  }

  function renderForm() {
    heroInner.innerHTML = FORM_HTML;
  }

  function setActiveLink(id) {
    nav.querySelectorAll('.section-link').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.section === id);
    });
  }

  // Transition générique : fait sortir le contenu actuel (exitClass),
  // exécute renderFn, puis fait entrer le nouveau contenu (enterStartClass -> état normal)
  function transition(renderFn, exitClass, enterStartClass) {
    if (animating) return;
    animating = true;

    const onOutEnd = (e) => {
      if (e.target !== heroInner || e.propertyName !== 'transform') return;
      heroInner.removeEventListener('transitionend', onOutEnd);
      renderFn();
      heroInner.classList.remove(exitClass);
      heroInner.classList.add(enterStartClass);
      // force reflow pour que le navigateur enregistre la position de départ
      void heroInner.offsetWidth;
      heroInner.classList.remove(enterStartClass);
      // libère le verrou une fois l'entrée bien lancée
      window.setTimeout(() => { animating = false; }, 480);
    };

    heroInner.addEventListener('transitionend', onOutEnd);
    heroInner.classList.add(exitClass);
  }

  // Navigation entre sections du menu : transition verticale (haut/bas)
  function goTo(id) {
    if (id === current || !SECTIONS[id] || animating) return;
    current = id;
    setActiveLink(id);
    transition(() => renderContent(id), 'is-out', 'is-in-start');
  }

  // Ouverture du formulaire de contact : transition horizontale (gauche/droite)
  function openForm() {
    if (animating) return;
    formOrigin = current;
    transition(renderForm, 'is-out-left', 'is-in-right-start');
  }

  // Retour au contenu précédent depuis le formulaire : transition horizontale inverse
  function closeForm() {
    if (animating || !formOrigin) return;
    const origin = formOrigin;
    formOrigin = null;
    transition(() => renderContent(origin), 'is-out-right', 'is-in-left-start');
  }

  nav.querySelectorAll('.section-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(link.dataset.section);
    });
  });

  // Délégation d'événements sur le hero (le contenu est régénéré à chaque transition)
  heroInner.addEventListener('click', (e) => {
    const openTrigger = e.target.closest('[data-action="open-form"]');
    if (openTrigger) {
      e.preventDefault();
      openForm();
      return;
    }
    const backBtn = e.target.closest('#form-back-btn');
    if (backBtn) {
      e.preventDefault();
      closeForm();
    }
  });

  heroInner.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'contact-form') {
      // Formulaire de démonstration : aucun envoi réel pour le moment
      e.preventDefault();
      const btn = e.target.querySelector('.form-submit');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Envoyé ✓';
        btn.disabled = true;
        window.setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 2000);
      }
    }
  });
})();