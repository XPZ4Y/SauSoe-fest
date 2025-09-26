document.addEventListener('DOMContentLoaded', () => {

            // --- 3D Xuanzhuan Logic ---
            const carouselComponent = document.querySelector('[carousel="component"]');
            if (carouselComponent) {
                const wrapEl = carouselComponent.querySelector('[carousel="wrap"]');
                const itemEls = wrapEl.querySelectorAll('.carousel_item');
                const rotateAmount = 360 / itemEls.length;
                const zTranslate = 2 * Math.tan((rotateAmount / 2) * (Math.PI / 180));

                const negTranslate = `calc(var(--3d-carousel-item-width) / -${zTranslate} - var(--3d-carousel-gap))`;
                const posTranslate = `calc(var(--3d-carousel-item-width) / ${zTranslate} + var(--3d-carousel-gap))`;

                wrapEl.style.setProperty('--3d-carousel-z', negTranslate);
                wrapEl.style.perspective = posTranslate;

                gsap.to(wrapEl, { opacity: 1 });

                itemEls.forEach((item, index) => {
                    item.style.transform = `rotateY(${rotateAmount * index}deg) translateZ(${posTranslate})`;
                });

                gsap.timeline({
                    scrollTrigger: {
                        trigger: document.body,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 1.5
                    }
                }).fromTo(wrapEl, {
                    '--3d-carousel-rotate': '0deg'
                }, {
                    '--3d-carousel-rotate': `-${360 - rotateAmount}deg`,
                    ease: "none"
                });
            }

            // --- Hero Section Typewriter Animation ---
            const typewriterText = document.getElementById('typewriter-text');
            const words = [" vibe. ", " impact. ", " revolution. ", " future. ", " change. "
                
            ];
            let wordIndex = 0;
            let charIndex = 0;
            let isDeleting = false;
            function type() {
                const currentWord = words[wordIndex];
                if (isDeleting) {
                    typewriterText.textContent = currentWord.substring(0, charIndex - 1);
                    charIndex--;
                } else {
                    typewriterText.textContent = currentWord.substring(0, charIndex + 1);
                    charIndex++;
                }
                if (!isDeleting && charIndex === currentWord.length) {
                    setTimeout(() => isDeleting = true, 3000); // Increased pause
                } else if (isDeleting && charIndex === 0) {
                    isDeleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                }
                const typingSpeed = isDeleting ? 75 : 150;
                setTimeout(type, typingSpeed);
            }
            if (typewriterText) type();



            // --- Animated Terminal in About Section ---
            const terminalCode = document.getElementById('terminal-code');
            if (terminalCode) {
                const terminalLines = [
                    { text: '$ resoenance connect', isCommand: true, delayAfter: 500 },
                    { text: 'Connecting to resoenance 2025...', isCommand: false, delayAfter: 1000 },
                    { text: 'Connection successful. ✅', isCommand: false, delayAfter: 1000 },
                    { text: '$ register --event "Idea Jam" --team "Innovators"', isCommand: true, delayAfter: 500 },
                    { text: 'Building team...', isCommand: false },
                    { text: 'Deploying registration... Done! 🚀', isCommand: false, delayAfter: 1000 },
                    { text: 'Your spot is secured. Welcome to the future!', isCommand: false, cursor: true }
                ];
                let lineIndex = 0;
                function typeTerminalLine() {
                    if (lineIndex >= terminalLines.length) return;
                    const line = terminalLines[lineIndex];
                    if (line.isCommand) {
                        let charIdx = 0;
                        const commandText = document.createElement('span');
                        commandText.className = 'text-white';
                        terminalCode.innerHTML += `<span style="color: var(--secondary-blue);">$ </span>`;
                        terminalCode.appendChild(commandText);
                        const intervalId = setInterval(() => {
                            commandText.textContent += line.text[charIdx + 2];
                            charIdx++;
                            if (charIdx === line.text.length - 2) {
                                clearInterval(intervalId);
                                terminalCode.innerHTML += '\n';
                                lineIndex++;
                                setTimeout(typeTerminalLine, line.delayAfter);
                            }
                        }, 50);
                    } else {
                        terminalCode.innerHTML += `<span class="text-stone-300">${line.text}</span>\n`;
                        lineIndex++;
                        if (line.cursor) terminalCode.innerHTML += '<span class="animate-blink">█</span>';
                        setTimeout(typeTerminalLine, line.delayAfter);
                    }
                }
                typeTerminalLine();
            }

            // --- Mobile Menu Toggle ---
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
            mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mobileMenu.classList.add('hidden')));

            // --- Header & Back to Top Scroll Effect ---
            const header = document.getElementById('header');
            const backToTopBtn = document.getElementById('back-to-top');

            const handleScroll = () => {
                const scrollY = window.scrollY;
                header.classList.toggle('scrolled', scrollY > 50);
                if (backToTopBtn) {
                    backToTopBtn.style.display = scrollY > 300 ? 'block' : 'none';
                }
            };
            window.addEventListener('scroll', handleScroll);
            if (backToTopBtn) {
                backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }


            // --- Swiper Initialization ---
            var eventsSwiper = new Swiper('.events-slider', {
                effect: 'coverflow',
                grabCursor: true,
                centeredSlides: true,
                slidesPerView: 'auto',
                loop: true,
                coverflowEffect: {
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                },
                pagination: {
                    el: '#events .swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '#events .swiper-button-next',
                    prevEl: '#events .swiper-button-prev',
                },
                initialSlide: 1,
                breakpoints: {
                    1024: {
                        effect: 'slide',
                        slidesPerView: 3,
                        spaceBetween: 30,
                        centeredSlides: false,
                    },
                    1536: {
                        effect: 'slide',
                        slidesPerView: 4,
                        spaceBetween: 30,
                        centeredSlides: false,
                    }
                }
            });

            var teamSwiper = new Swiper('.team-slider', {
                effect: 'coverflow',
                grabCursor: true,
                centeredSlides: true,
                slidesPerView: 'auto',
                loop: true,
                coverflowEffect: {
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                },
                pagination: {
                    el: '#team .swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '#team .swiper-button-next',
                    prevEl: '#team .swiper-button-prev',
                },
                initialSlide: 1,
                breakpoints: {
                    1024: {
                        effect: 'slide',
                        slidesPerView: 3,
                        spaceBetween: 30,
                        centeredSlides: false,
                    },
                    1536: {
                        effect: 'slide',
                        slidesPerView: 4,
                        spaceBetween: 30,
                        centeredSlides: false,
                    }
                }
            });

            var soeSwiper = new Swiper('.soe-slider', {
                effect: 'coverflow',
                grabCursor: true,
                centeredSlides: true,
                slidesPerView: 'auto',
                loop: true,
                coverflowEffect: {
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                },
                pagination: {
                    el: '#soe .swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '#soe .swiper-button-next',
                    prevEl: '#soe .swiper-button-prev',
                },
                initialSlide: 1,
                breakpoints: {
                    1024: {
                        effect: 'slide',
                        slidesPerView: 3,
                        spaceBetween: 30,
                        centeredSlides: false,
                    },
                    1536: {
                        effect: 'slide',
                        slidesPerView: 4,
                        spaceBetween: 30,
                        centeredSlides: false,
                    }
                }
            });

            // --- Modal Handling ---
            const detailsModal = document.getElementById('details-modal');
            const soeDetailsModal = document.getElementById('soe-details-modal');
            const registerModal = document.getElementById('register-modal');
            const openDetailsButtons = document.querySelectorAll('.swiper-slide');
            const openSoeDetailsButtons = document.querySelectorAll('.open-soe-details-modal');
            const openRegisterButtons = document.querySelectorAll('.open-register-modal');
            const openRegisterFromDetailsBtn = document.querySelector('.open-register-modal-from-details');
            const allCloseButtons = document.querySelectorAll('.close-modal-btn');

            const openModal = (modal, text) => {
                if (!modal) return;
                text ? valueX=text : valueX='eee';//a small fix that ensures that the code is only accessed if available
                window.eee=modal.querySelector('#teamName') //only if the modal is form registraion
                
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                setTimeout(() => {modal.querySelector('.modal-content').classList.add('active'); window.eee.value=valueX; window.eee.readOnly=true;}, 10);
            };

            const closeModal = (modal) => {
                if (!modal) return;
                modal.querySelector('.modal-content').classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }, 300);
            };

            openDetailsButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const eventTitle = button.children[3].dataset.event;
                    const eventDetails = button.children[3].dataset.details;
                    const iconContainer = document.getElementById(button.children[3].dataset.icon);
                    if (detailsModal) {
                        document.getElementById('modal-event-title').textContent = eventTitle;
                        document.getElementById('modal-event-details').textContent = eventDetails;
                        const modalIcon = document.getElementById('modal-event-icon');
                        if (modalIcon && iconContainer) {
                            modalIcon.innerHTML = iconContainer.innerHTML;
                        }
                        openModal(detailsModal);
                    }
                });
            });

            openSoeDetailsButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const title = button.dataset.title;
                    const details = button.dataset.details;
                    const iconContainer = document.getElementById(button.dataset.icon);
                    document.getElementById('modal-soe-title').textContent = title;
                    document.getElementById('modal-soe-details').textContent = details;
                    document.getElementById('modal-soe-icon').innerHTML = iconContainer ? iconContainer.innerHTML : '';
                    openModal(soeDetailsModal);
                });
            });

            openRegisterButtons.forEach(button => {//!? que, ^^&p over the top. don't touch
                button.addEventListener('click', () => {
                	//const parentElement = button.parentElement; // or button.parentElement
        			//alert(parentElement)
                	openModal(registerModal)
                });
            });

            if (openRegisterFromDetailsBtn) {
                openRegisterFromDetailsBtn.addEventListener('click', () => {
                    closeModal(detailsModal);
                    myEventCode = detailsModal.querySelector('#modal-event-title')//isolation of the event code
                    setTimeout(() => openModal(registerModal, myEventCode.textContent), 300);
                });
            }
            allCloseButtons.forEach(button => button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop'))));
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) closeModal(backdrop);
            }));



            // --- Form Validation Logic (backend magic) ---
            const form = document.getElementById('registrationForm');
            const formMessage = document.getElementById('form-message');
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                clearErrors();
                formMessage.classList.add('hidden');

                let isValid = true;
                const requiredFields = ['fullName', 'teamName', 'class', 'school', 'contactNumber', 'location', 'guardianPhone'];

                requiredFields.forEach(fieldId => {
                    const input = document.getElementById(fieldId);
                    if (input && !input.value.trim()) {

                        showError(fieldId, `${input.previousElementSibling.textContent.replace('*', '')} is required.`);
                        isValid = false;
                    }
                });

                const emailInput = document.getElementById('email');
                if (emailInput) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailInput.value.trim() && !emailRegex.test(emailInput.value)) {
                        showError('email', 'Please enter a valid email format.');
                        isValid = false;
                    }
                }

                if (!isValid) {
                    formMessage.textContent = 'Please correct the errors above.';
                    formMessage.className = 'block bg-red-900/50 border border-red-500 text-red-300 text-center p-3 rounded-lg mb-4';
                    formMessage.classList.remove('hidden');
                    return;
                }

                const submitButton = form.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = 'Submitting...';

                const formData = new FormData(form);
                const body = new URLSearchParams(formData).toString();
                console.log(body)

                fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: body,
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            formMessage.textContent = data.message;
                            formMessage.className = 'block bg-green-900/50 border border-green-500 text-green-300 text-center p-3 rounded-lg mb-4';
                            form.reset();
                        } else {
                            let errorMessage = data.message;
                            if (data.errors) {
                                errorMessage += `: ${data.errors.join(', ')}`;
                            }
                            formMessage.textContent = errorMessage;
                            formMessage.className = 'block bg-red-900/50 border border-red-500 text-red-300 text-center p-3 rounded-lg mb-4';
                        }
                    })
                    .catch(error => {
                        console.error('Submission Error:', error);
                        formMessage.textContent = 'An error occurred. Please check your connection and try again.';
                        formMessage.className = 'block bg-red-900/50 border border-red-500 text-red-300 text-center p-3 rounded-lg mb-4';
                    })
                    .finally(() => {
                        formMessage.classList.remove('hidden');
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonText;
                    });
            });

            function showError(fieldId, message) {
                const errorEl = document.getElementById(`${fieldId}Error`);
                const inputEl = document.getElementById(fieldId);
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.style.display = 'block';
                }
                if (inputEl) {
                    inputEl.classList.add('invalid-input');
                }
            }

            function clearErrors() {
                document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
            }

            // --- Team Card Flip and Touch Functionality ---
            document.querySelectorAll('.team-card-wrapper').forEach(card => {
                const cardFront = card.querySelector('.card-front');

                // Click to flip
                card.addEventListener('click', (e) => {
                    if (e.target.closest('a')) return;
                    card.classList.toggle('is-flipped');
                });

                // Touch events for hover effect on mobile
                card.addEventListener('touchstart', () => {
                    if (cardFront) cardFront.classList.add('touched');
                }, { passive: true });

                card.addEventListener('touchend', () => {
                    if (cardFront) setTimeout(() => cardFront.classList.remove('touched'), 150);
                });
                card.addEventListener('touchcancel', () => {
                    if (cardFront) cardFront.classList.remove('touched');
                });
            });

            // --- Event Card Touch Functionality ---
            document.querySelectorAll('.events-slider .swiper-slide, .soe-slider .swiper-slide').forEach(card => {
                card.addEventListener('touchstart', () => {
                    card.classList.add('touched');
                }, { passive: true });

                card.addEventListener('touchend', () => {
                    setTimeout(() => card.classList.remove('touched'), 150);
                });
                card.addEventListener('touchcancel', () => {
                    card.classList.remove('touched');
                });
            });
        });
