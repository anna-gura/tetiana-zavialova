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

    this._originals = Array.from(this.track.querySelectorAll('.carousel-card')).map(c => c.outerHTML);
    this.total = this._originals.length;
    this.current = 0; // logical index
    this.busy = false;

    this._buildDOM();
    this._buildDots();
    this._setPosition(false);
    this._bindEvents();
  }

  // Build: clone[-2,-1, 0,1,...,n-1, n,n+1] — 2 clones on each side
  _buildDOM() {
    const EXTRA = 2;
    this.track.innerHTML = '';
    // prepend clones of last EXTRA items
    for (let i = this.total - EXTRA; i < this.total; i++) {
      this.track.insertAdjacentHTML('beforeend', this._originals[i]);
    }
    // real cards
    this._originals.forEach(h => this.track.insertAdjacentHTML('beforeend', h));
    // append clones of first EXTRA items
    for (let i = 0; i < EXTRA; i++) {
      this.track.insertAdjacentHTML('beforeend', this._originals[i]);
    }
    this.cards = Array.from(this.track.querySelectorAll('.carousel-card'));
    this.EXTRA = EXTRA;
    // real cards start at index EXTRA
    this._updateClasses();
  }

  // Which DOM index corresponds to current logical position
  get _domIdx() { return this.current + this.EXTRA; }

  _setPosition(animated) {
    const card  = this.cards[0];
    if (!card) return;
    const cardW  = card.offsetWidth;
    const gap    = 24;
    const outerW = this.track.parentElement?.offsetWidth || window.innerWidth;
    const offset = (outerW / 2) - (cardW / 2) - this._domIdx * (cardW + gap);
    this.track.style.transition = animated
      ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    this.track.style.transform = `translateX(${offset}px)`;
  }

  _updateClasses() {
    this.cards.forEach((c, i) => {
      c.classList.remove('active', 'adjacent');
      const diff = Math.abs(i - this._domIdx);
      if (diff === 0) c.classList.add('active');
      else if (diff === 1) c.classList.add('adjacent');
    });
  }

  _slide(dir) {
    if (this.busy) return;
    this.busy = true;

    this.current += dir;
    this._updateClasses(); // opacity starts transitioning NOW via CSS
    this._setPosition(true);

    const onEnd = () => {
      // Jump silently if we hit a clone zone
      const minReal = 0, maxReal = this.total - 1;
      if (this.current < minReal) {
        this.current = maxReal;
        this._setPosition(false);
      } else if (this.current > maxReal) {
        this.current = minReal;
        this._setPosition(false);
      }
      this._updateDots();
      this.busy = false;
    };

    this.track.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, 520); // fallback
  }

  _buildDots() {
    this._originals.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'c-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => {
        if (this.busy) return;
        this.current = i;
        this._updateClasses();
        this._setPosition(true);
        this._updateDots();
      });
      this.dotsEl.appendChild(d);
    });
    this.dots = Array.from(this.dotsEl.querySelectorAll('.c-dot'));
  }

  _updateDots() {
    const idx = ((this.current % this.total) + this.total) % this.total;
    this.dots?.forEach((d, i) => d.classList.toggle('active', i === idx));
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
    window.addEventListener('resize', () => this._setPosition(false), { passive: true });
  }
}

class PopupManager {
  constructor() {
    this.overlay  = document.getElementById('popupOverlay');
    this.closeBtn = document.getElementById('popupClose');
    this.tgBtn    = this.overlay?.querySelector('.popup-btn.tg');
    this.title    = this.overlay?.querySelector('h3');
    if (!this.overlay) return;
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }

  // Messages per type (URL-encoded Ukrainian)
  _tgMessage(type) {
    const base = 'https://t.me/Tetiana_Zavialova?text=';
    const msgs = {
      consult:     'Добридень%2C%20Тетяно.%20Хочу%20записатися%20на%20консультацію.',
      supervision: 'Добридень%2C%20Тетяно.%20Я%20психолог%20і%20хочу%20записатися%20на%20супервізію.',
      cooperation: 'Добридень%2C%20Тетяно.%20Хочу%20обговорити%20можливу%20співпрацю.',
    };
    return base + (msgs[type] || msgs.consult);
  }

  _titles(type) {
    const t = {
      consult:     'Записатися на консультацію',
      supervision: 'Записатися на супервізію',
      cooperation: 'Обговорити співпрацю',
    };
    return t[type] || 'Оберіть зручний спосіб';
  }

  open(e, type) {
    e?.preventDefault();
    // Update Telegram link and title based on type
    if (this.tgBtn) this.tgBtn.href = this._tgMessage(type);
    if (this.title) this.title.textContent = this._titles(type);
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  close() { this.overlay.classList.remove('open'); document.body.style.overflow = ''; }
}


class GalleryCarousel {
  constructor() {
    this.track   = document.getElementById('galleryCarouselTrack');
    this.dotsEl  = document.getElementById('galleryDots');
    this.prevBtn = document.getElementById('galleryPrev');
    this.nextBtn = document.getElementById('galleryNext');
    if (!this.track) return;

    this._originals = Array.from(this.track.querySelectorAll('.gallery-photo-card')).map(c => c.outerHTML);
    this.total = this._originals.length;
    this.current = 0;
    this.busy = false;

    this._buildDOM();
    this._buildDots();
    this._setPosition(false);
    this._bindEvents();
  }

  _buildDOM() {
    const EXTRA = 2;
    this.track.innerHTML = '';
    for (let i = this.total - EXTRA; i < this.total; i++) {
      this.track.insertAdjacentHTML('beforeend', this._originals[i]);
    }
    this._originals.forEach(h => this.track.insertAdjacentHTML('beforeend', h));
    for (let i = 0; i < EXTRA; i++) {
      this.track.insertAdjacentHTML('beforeend', this._originals[i]);
    }
    this.cards = Array.from(this.track.querySelectorAll('.gallery-photo-card'));
    this.EXTRA = EXTRA;
    // bind lightbox to each card
    this.cards.forEach(card => {
      card.addEventListener('click', () => {
        if (!card.classList.contains('active')) return;
        const img = card.querySelector('img');
        const lb  = document.getElementById('lightbox');
        if (lb) {
          document.getElementById('lightboxImg').src = img.src;
          document.getElementById('lightboxCaption').textContent = card.dataset.caption || img.alt;
          lb.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    });
    this._updateClasses();
  }

  get _domIdx() { return this.current + this.EXTRA; }

  _setPosition(animated) {
    const card  = this.cards[0];
    if (!card) return;
    const cardW  = card.offsetWidth;
    const outerW = this.track.parentElement?.offsetWidth || window.innerWidth;
    const offset = (outerW / 2) - (cardW / 2) - this._domIdx * (cardW + 24);
    this.track.style.transition = animated
      ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    this.track.style.transform = `translateX(${offset}px)`;
  }

  _updateClasses() {
    this.cards.forEach((c, i) => {
      c.classList.remove('active', 'adjacent');
      const diff = Math.abs(i - this._domIdx);
      if (diff === 0) c.classList.add('active');
      else if (diff === 1) c.classList.add('adjacent');
    });
  }

  _slide(dir) {
    if (this.busy) return;
    this.busy = true;
    this.current += dir;
    this._updateClasses();
    this._setPosition(true);

    const onEnd = () => {
      if (this.current < 0) { this.current = this.total - 1; this._setPosition(false); }
      else if (this.current >= this.total) { this.current = 0; this._setPosition(false); }
      this._updateDots();
      this.busy = false;
    };
    this.track.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, 520);
  }

  _buildDots() {
    this._originals.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'gallery-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => {
        if (this.busy) return;
        this.current = i;
        this._updateClasses();
        this._setPosition(true);
        this._updateDots();
      });
      this.dotsEl.appendChild(d);
    });
    this.dots = Array.from(this.dotsEl.querySelectorAll('.gallery-dot'));
  }

  _updateDots() {
    const idx = ((this.current % this.total) + this.total) % this.total;
    this.dots?.forEach((d, i) => d.classList.toggle('active', i === idx));
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
    window.addEventListener('resize', () => this._setPosition(false), { passive: true });
  }
}

class App {
  constructor() {
    this.nav      = new NavController();
    this.menu     = new MobileMenu();
    this.reveal   = new ScrollReveal();
    this.carousel = new Carousel();
    this.popup    = new PopupManager();
    this.gallery        = new Gallery();
    this.galleryCarousel = new GalleryCarousel();

    window.openPopup       = (e, type) => this.popup.open(e, type);
    window.closeMobileMenu = ()  => this.menu.close();
  }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });

/* ============================================================
   Gallery — lightbox + mobile touch captions
   ============================================================ */
class Gallery {
  constructor() {
    this.lightbox = document.getElementById('lightbox');
    this.lbImg    = document.getElementById('lightboxImg');
    this.lbCap    = document.getElementById('lightboxCaption');
    this.lbBg     = document.getElementById('lightboxBg');
    this.lbClose  = document.getElementById('lightboxClose');
    if (!this.lightbox) return;

    this._bindDesktop();
    this._bindMobile();
    this._bindClose();
  }

  _bindDesktop() {
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const cap = item.dataset.caption || img.alt;
        this._openLightbox(img.src, cap);
      });
    });
  }

  _bindMobile() {
    // Mobile: tap slide to toggle caption, swipe handled by native scroll
    document.querySelectorAll('.gallery-slide').forEach(slide => {
      let captionVisible = false;
      slide.addEventListener('click', () => {
        const img = slide.querySelector('img');
        const cap = slide.querySelector('.gallery-slide-caption').textContent;
        // On mobile open lightbox
        if (window.innerWidth > 768) return;
        captionVisible = !captionVisible;
        // Just open lightbox on tap
        this._openLightbox(img.src, cap);
      });
    });
  }

  _openLightbox(src, caption) {
    this.lbImg.src       = src;
    this.lbCap.textContent = caption;
    this.lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  _closeLightbox() {
    this.lightbox.classList.remove('open');
    document.body.style.overflow = '';
    this.lbImg.src = '';
  }

  _bindClose() {
    this.lbBg?.addEventListener('click',    () => this._closeLightbox());
    this.lbClose?.addEventListener('click', () => this._closeLightbox());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._closeLightbox();
    });
  }
}
