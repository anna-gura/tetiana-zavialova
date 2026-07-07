'use strict';
class ThorApp {
  constructor() {
    this.nav      = new NavController();
    this.menu     = new MobileMenu();
    this.reveal   = new ScrollReveal();
    this.carousel = new Carousel();
    this.popup    = new PopupManager();

    window.openPopup       = (e) => this.popup.open(e);
    window.closeMobileMenu = ()  => this.menu.close();

    // Back navigation
    document.querySelectorAll('.thor-back').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); window.location.href = 'index.html'; });
    });
  }
}
document.addEventListener('DOMContentLoaded', () => { window.thorApp = new ThorApp(); });
