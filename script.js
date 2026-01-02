/**
 * TailorSmart Initiative - Main JavaScript
 * Consolidated, cleaned and extended with gallery lightbox
 */
(function () {
    'use strict';

    // CONFIG
    const CONFIG = {
        navbarHeight: 80,
        scrollThreshold: 100,
        observerThreshold: 0.3,
        animationDelay: 100
    };

    // UTILITIES
    const utils = {
        debounce(func, wait = 20) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        easeOutQuad(t) {
            return t * (2 - t);
        }
    };

    // SMOOTH SCROLL
    const smoothScroll = {
        init() {
            const links = document.querySelectorAll('a[href^="#"]');
            links.forEach(link => link.addEventListener('click', this.handleClick.bind(this)));
        },

        handleClick(e) {
            const href = e.currentTarget.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - CONFIG.navbarHeight;

            window.scrollTo({ top: targetPosition, behavior: 'smooth' });

            try {
                if (history.pushState) history.pushState(null, null, href);
            } catch (err) {
                // ignore
            }

            this.closeMobileMenu();
        },

        closeMobileMenu() {
            const mobileMenu = document.querySelector('.nav-links');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
            }
        }
    };

    // NAVBAR SCROLL EFFECT
    const navbarScroll = {
        init() {
            this.navbar = document.querySelector('.navbar');
            if (!this.navbar) return;
            window.addEventListener('scroll', utils.debounce(this.handleScroll.bind(this), 10));
            this.handleScroll();
        },

        handleScroll() {
            if (window.scrollY > CONFIG.scrollThreshold) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        }
    };

    // ANIMATED COUNTERS
    const animatedCounters = {
        init() {
            this.counters = document.querySelectorAll('.stat-number');
            if (!this.counters || this.counters.length === 0) return;

            const observerOptions = {
                threshold: CONFIG.observerThreshold,
                rootMargin: '0px 0px -100px 0px'
            };

            this.observer = new IntersectionObserver(this.handleIntersection.bind(this), observerOptions);
            this.counters.forEach(c => this.observer.observe(c));
        },

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    this.animateCounter(entry.target);
                }
            });
        },

        animateCounter(element) {
            const originalText = element.textContent || '';
            const hasKES = originalText.includes('KES');
            const hasPlus = originalText.includes('+');

            const numericValue = originalText.replace(/[^0-9,]/g, '').replace(/,/g, '');
            const targetValue = parseInt(numericValue, 10);
            if (isNaN(targetValue)) return;

            const duration = 2000;
            const startTime = performance.now();
            const startValue = 0;

            const animate = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const eased = utils.easeOutQuad(progress);
                const currentValue = Math.floor(startValue + (targetValue - startValue) * eased);
                let displayValue = currentValue.toLocaleString();

                if (hasKES) displayValue = 'KES ' + displayValue;
                if (hasPlus && progress === 1) displayValue += '+';

                element.textContent = displayValue;

                if (progress < 1) requestAnimationFrame(animate);
            };

            requestAnimationFrame(animate);
        }
    };

    // SCROLL REVEAL
    const scrollReveal = {
        init() {
            this.elements = document.querySelectorAll('.challenge-item, .solution-card, .timeline-item, .tier, .donation-card-simple');
            if (!this.elements || this.elements.length === 0) return;

            const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
            this.observer = new IntersectionObserver(this.handleIntersection.bind(this), observerOptions);

            this.elements.forEach(el => {
                el.classList.add('reveal-hidden');
                this.observer.observe(el);
            });
        },

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('reveal-visible');
                        entry.target.classList.remove('reveal-hidden');
                    }, CONFIG.animationDelay);
                    this.observer.unobserve(entry.target);
                }
            });
        }
    };


       
    // MOBILE MENU
    const mobileMenu = {
        init() {
            this.createToggleButton();
            this.attachEventListeners();
        },

        createToggleButton() {
            const navbar = document.querySelector('.navbar .container');
            if (!navbar) return;
            const button = document.createElement('button');
            button.className = 'mobile-menu-toggle';
            button.setAttribute('aria-label', 'Toggle navigation menu');
            button.setAttribute('aria-expanded', 'false');
            button.innerHTML = '<span class="hamburger-line"></span><span class="hamburger-line"></span><span class="hamburger-line"></span>';
            navbar.appendChild(button);
            this.toggleButton = button;
        },

        attachEventListeners() {
            if (!this.toggleButton) return;
            this.toggleButton.addEventListener('click', () => {
                const navLinks = document.querySelector('.nav-links');
                if (!navLinks) return;
                const isActive = navLinks.classList.toggle('active');
                this.toggleButton.classList.toggle('active');
                this.toggleButton.setAttribute('aria-expanded', String(isActive));
                document.body.style.overflow = isActive ? 'hidden' : '';
            });
        }
    };

    // FORM VALIDATION
    const formValidation = {
        init() {
            this.forms = document.querySelectorAll('form');
            this.forms.forEach(form => form.addEventListener('submit', this.handleSubmit.bind(this)));
        },

        handleSubmit(e) {
            const form = e.target;
            const isValid = form.checkValidity();
            if (!isValid) {
                e.preventDefault();
                this.showErrors(form);
            }
        },

        showErrors(form) {
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                if (!input.validity.valid) {
                    input.classList.add('error');
                    this.showErrorMessage(input);
                }
            });
        },

        showErrorMessage(input) {
            const errorId = `error-${input.id || Math.random().toString(36).slice(2)}`;
            let errorElement = document.getElementById(errorId);
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.id = errorId;
                errorElement.className = 'error-message';
                input.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = input.validationMessage;
        }
    };

    // LAZY LOADING
    const lazyLoading = {
        init() {
            this.images = document.querySelectorAll('img[data-src]');
            if (!this.images || this.images.length === 0) return;
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver(this.handleIntersection.bind(this), { rootMargin: '100px' });
                this.images.forEach(img => this.observer.observe(img));
            } else {
                this.images.forEach(img => this.loadImage(img));
            }
        },

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        },

        loadImage(img) {
            const src = img.getAttribute('data-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        }
    };

    // SCROLL TO TOP
    const scrollToTop = {
        init() {
            this.createButton();
            this.attachEventListeners();
        },

        createButton() {
            const button = document.createElement('button');
            button.id = 'scrollToTop';
            button.className = 'scroll-to-top';
            button.setAttribute('aria-label', 'Scroll to top');
            button.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
            document.body.appendChild(button);
            this.button = button;
        },

        attachEventListeners() {
            window.addEventListener('scroll', utils.debounce(() => {
                if (window.scrollY > 500) this.button.classList.add('visible');
                else this.button.classList.remove('visible');
            }, 100));

            this.button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    };

    // ANALYTICS (simple)
    const analytics = {
        init() {
            this.trackButtonClicks();
            this.trackSectionViews();
        },

        trackButtonClicks() {
            const buttons = document.querySelectorAll('.btn');
            buttons.forEach(button => button.addEventListener('click', (e) => {
                const text = e.currentTarget.textContent.trim();
                console.log('Button clicked:', text);
            }));
        },

        trackSectionViews() {
            const sections = document.querySelectorAll('section[id]');
            if (!sections || sections.length === 0) return;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) console.log('Section viewed:', entry.target.id);
                });
            }, { threshold: 0.5 });
            sections.forEach(s => observer.observe(s));
        }
    };

    // GALLERY LIGHTBOX (creates DOM and behavior)
    const gallery = {
        init() {
            this.items = document.querySelectorAll('.gallery-item');
            if (!this.items || this.items.length === 0) return;
            this.createLightbox();
            this.attachListeners();
        },

        createLightbox() {
            const lb = document.createElement('div');
            lb.id = 'lightbox';
            lb.className = 'lightbox';
            lb.setAttribute('aria-hidden', 'true');
            lb.tabIndex = -1;
            lb.innerHTML = `
                <button class="lightbox-close" aria-label="Close gallery">&times;</button>
                <img class="lightbox-img" alt="">
                <div class="lightbox-caption small-text"></div>
            `;
            document.body.appendChild(lb);
            this.lightbox = lb;
            this.lbImg = lb.querySelector('.lightbox-img');
            this.lbCaption = lb.querySelector('.lightbox-caption');
            this.lbClose = lb.querySelector('.lightbox-close');
        },

        attachListeners() {
            this.items.forEach(btn => {
                btn.addEventListener('click', () => {
                    const src = btn.getAttribute('data-src') || btn.querySelector('img')?.src;
                    const alt = btn.querySelector('img')?.alt || '';
                    this.open(src, alt);
                });
            });

            this.lbClose.addEventListener('click', () => this.close());
            this.lightbox.addEventListener('click', (e) => { if (e.target === this.lightbox) this.close(); });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.lightbox.getAttribute('aria-hidden') === 'false') this.close();
            });
        },

        open(src, alt = '') {
            if (!this.lightbox) return;
            this.lbImg.src = src || '';
            this.lbImg.alt = alt;
            this.lbCaption.textContent = alt;
            this.lightbox.setAttribute('aria-hidden', 'false');
            this.lightbox.style.display = 'flex';
            this.lightbox.focus();
            document.body.style.overflow = 'hidden';
        },

        close() {
            if (!this.lightbox) return;
            this.lightbox.setAttribute('aria-hidden', 'true');
            this.lbImg.src = '';
            this.lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // COPY PHONE NUMBER (for support section)
    function copyNumber() {
        const phone = '0748052811';
        const btn = document.getElementById('copy-btn');
        if (!btn) return;

        const originalHtml = btn.innerHTML;
        const originalBg = btn.style.background;

        const onSuccess = () => {
            btn.innerHTML = '<i class="fas fa-check"></i> Copied';
            btn.style.background = 'var(--copy-success)';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = originalHtml || '<i class="fas fa-copy"></i> Copy';
                btn.style.background = originalBg || '';
                btn.disabled = false;
            }, 2000);
        };

        const onFailure = (err) => {
            console.error('Failed to copy: ', err);
        };

        const fallback = () => {
            const temp = document.createElement('input');
            temp.value = phone;
            document.body.appendChild(temp);
            temp.select();
            try {
                document.execCommand('copy');
                onSuccess();
            } catch (err) {
                onFailure(err);
            }
            temp.remove();
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(phone).then(onSuccess).catch((err) => {
                onFailure(err);
                fallback();
            });
        } else {
            fallback();
        }
    }

    window.copyNumber = copyNumber;

    // INITIALIZE
    function initializeApp() {
        smoothScroll.init();
        navbarScroll.init();
        animatedCounters.init();
        scrollReveal.init();
        donationModal.init();
        mobileMenu.init();
        scrollToTop.init();
        lazyLoading.init();
        formValidation.init();
        analytics.init();
        gallery.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

    // Expose minimal API
    window.TailorSmart = {
        openDonationModal: () => donationModal.open(),
        closeDonationModal: () => donationModal.close()
    };

})();