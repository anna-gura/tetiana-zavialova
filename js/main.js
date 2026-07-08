'use strict';

class NavController {
  constructor() {
    this.nav = document.getElementById('main-nav');
    if (!this.nav) return;
    window.addEventListener('scroll', () => {
      this.nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
    this.nav.classList.toggle('scrolled', window.scrollY > 60);
  }
}

class MobileMenu {
  constructor() {
    this.menu   = document.getElementById('mobile-menu');
    this.opener = document.getElementById('burger');
    this.closer = document.getElementById('menu-close');
    if (!this.menu) return;
    this.opener?.addEventListener('click', () => this.open());
    this.closer?.addEventListener('click', () => this.close());
    this.menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => this.close()));
  }
  open()  { this.menu.classList.add('open');    document.body.style.overflow = 'hidden'; }
  close() { this.menu.classList.remove('open'); document.body.style.overflow = ''; }
}

class ScrollReveal {
  constructor() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
  }
}

class Carousel {
  constructor() {
    this.track   = document.getElementById('carouselTrack');
    this.dotsEl  = document.getElementById('carouselDots');
    this.prevBtn = document.getElementById('cPrev');
    this.nextBtn = document.getElementById('cNext');
    if (!this.track) return;

    // Save source HTML of each card
    this._source = Array.from(
      this.track.querySelectorAll('.carousel-card')
    ).map(c => c.outerHTML);
    this.total    = this._source.length;
    this.pos      = 0;
    this.busy     = false;
    this.WIN      = 2;
    this.cardH    = 0; // locked height, measured once

    this._buildDots();
    this._measureHeight();  // render all cards off-screen to find max height
    this._fill();
    this._center(false);
    this._updateDots();
    this._bindEvents();
  }

  /* ---- Measure max natural height across all cards ----------- */
  _measureHeight() {
    // Use actual rendered card width (respects mobile breakpoints)
    const actualW = this.track.parentElement?.offsetWidth
      ? Math.min(this.track.parentElement.offsetWidth - 48, 500)
      : 500;

    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;top:-9999px;left:0;width:${actualW}px;`;
    document.body.appendChild(probe);

    let maxH = 0;
    this._source.forEach(html => {
      const d = document.createElement('div');
      d.innerHTML = html;
      const card = d.firstElementChild;
      card.style.height  = 'auto';
      card.style.width   = '100%';
      card.style.padding = '2.5rem'; // match CSS padding
      card.style.boxSizing = 'border-box';
      probe.appendChild(card);
      maxH = Math.max(maxH, card.offsetHeight);
      probe.removeChild(card);
    });

    document.body.removeChild(probe);
    this.cardH = maxH + 2;
  }

  /* ---- Rebuild DOM window: [pos-WIN ... pos ... pos+WIN] ----- */
  _fill() {
    this.track.innerHTML = '';
    for (let d = -this.WIN; d <= this.WIN; d++) {
      const idx = ((this.pos + d) % this.total + this.total) % this.total;
      const div = document.createElement('div');
      div.innerHTML = this._source[idx];
      const card = div.firstElementChild;

      // Lock height so all cards are identical size
      card.style.height   = this.cardH + 'px';
      card.style.overflow = 'hidden';

      // Always start with same opacity — transition happens via CSS
      card.classList.remove('active', 'adjacent');
      if (d === 0)                card.classList.add('active');
      else if (Math.abs(d) === 1) card.classList.add('adjacent');

      this.track.appendChild(card);
    }
  }

  /* ---- Position track so middle card (WIN index) is centred -- */
  _center(animated) {
    const cards = this.track.children;
    if (!cards.length) return;
    const cardW  = cards[0].offsetWidth;
    const gap    = 24;
    const outerW = this.track.parentElement?.offsetWidth || window.innerWidth;
    // index WIN is the active card
    const offset = (outerW / 2) - (cardW / 2) - this.WIN * (cardW + gap);
    this.track.style.transition = animated
      ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)'
      : 'none';
    this.track.style.transform = `translateX(${offset}px)`;
  }

  /* ---- Slide one step in direction (+1 / -1) ----------------- */
  _slide(dir) {
    if (this.busy) return;
    this.busy = true;

    // 1. Animate: shift track by one card width
    const cards  = this.track.children;
    const cardW  = cards[0]?.offsetWidth || 500;
    const gap    = 24;
    const curTx  = new DOMMatrix(getComputedStyle(this.track).transform).m41;

    this.track.style.transition = 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)';
    this.track.style.transform  = `translateX(${curTx - dir * (cardW + gap)}px)`;

    // 2. After animation: update logical pos, rebuild window, recentre silently
    this.track.addEventListener('transitionend', () => {
      this.pos = (this.pos + dir + this.total) % this.total;
      this._fill();
      this._center(false);
      this._updateDots();
      this.busy = false;
    }, { once: true });
  }

  _buildDots() {
    this._source.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'c-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => {
        if (this.busy || i === this.pos) return;
        const dir = ((i - this.pos + this.total) % this.total <= this.total / 2) ? 1 : -1;
        // For dot clicks just jump directly
        this.pos = i;
        this._fill();
        this._center(false);
        this._updateDots();
      });
      this.dotsEl.appendChild(d);
    });
    this.dots = Array.from(this.dotsEl.querySelectorAll('.c-dot'));
  }

  _updateDots() {
    this.dots?.forEach((d, i) => d.classList.toggle('active', i === this.pos));
  }

  _bindEvents() {
    this.prevBtn?.addEventListener('click', () => this._slide(-1));
    this.nextBtn?.addEventListener('click', () => this._slide(1));

    let sx = 0;
    this.track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    this.track.addEventListener('touchend', e => {
      const dx = sx - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) this._slide(dx > 0 ? 1 : -1);
    });

    window.addEventListener('resize', () => {
      this._measureHeight();
      this._fill();
      this._center(false);
    }, { passive: true });
  }
}

class PopupManager {
  constructor() {
    this.overlay  = document.getElementById('popupOverlay');
    this.closeBtn = document.getElementById('popupClose');
    if (!this.overlay) return;
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }
  open(e)  { e?.preventDefault(); this.overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  close()  { this.overlay.classList.remove('open'); document.body.style.overflow = ''; }
}

class EasterEgg {
  constructor() {
    this.buf  = '';
    this.seqs = ['thor', 'ерщк'];
    this.max  = 5;
    document.getElementById('thorTrigger')?.addEventListener('click', () => this._go());
    document.addEventListener('keydown', e => {
      this.buf = (this.buf + e.key.toLowerCase()).slice(-this.max);
      if (this.seqs.some(s => this.buf.endsWith(s))) this._go();
    });
  }
  _go() { window.location.href = 'index_thor.html'; }
}

class App {
  constructor() {
    this.nav      = new NavController();
    this.menu     = new MobileMenu();
    this.reveal   = new ScrollReveal();
    this.carousel = new Carousel();
    this.popup    = new PopupManager();
    this.egg      = new EasterEgg();

    window.openPopup       = (e) => this.popup.open(e);
    window.closeMobileMenu = ()  => this.menu.close();
  }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
