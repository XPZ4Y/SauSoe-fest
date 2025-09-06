document.addEventListener('DOMContentLoaded', () => {

            // --- Hero Section Typewriter Animation ---
            const typewriterText = document.getElementById('typewriter-text');
            const words = ['STRATEGY', 'LEADERSHIP', 'SUCCESS'];
            let wordIndex = 0; let charIndex = 0; let isDeleting = false;
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
                    setTimeout(() => isDeleting = true, 2500);
                } else if (isDeleting && charIndex === 0) {
                    isDeleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                }
                const typingSpeed = isDeleting ? 75 : 150;
                setTimeout(type, typingSpeed);
            }
            if (typewriterText) type();

            // --- Mobile Menu Toggle ---
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
                mobileMenu.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
                });
            }

            // --- Header & Back to Top Scroll Effect ---
            const header = document.getElementById('header');
            const backToTopBtn = document.getElementById('back-to-top');

            const handleScroll = () => {
                if (header) {
                    header.classList.toggle('scrolled', window.scrollY > 50);
                }
                if (backToTopBtn) {
                    backToTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
                }
            };
            window.addEventListener('scroll', handleScroll);
            if (backToTopBtn) {
                backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // --- Swiper Initialization ---
            if (typeof Swiper !== 'undefined') {
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
                        }
                    }
                });
            }

            // --- Modal Handling ---
            const detailsModal = document.getElementById('details-modal');
            const registerModal = document.getElementById('register-modal');
            const openDetailsButtons = document.querySelectorAll('.open-details-modal');
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
                const modalContent = modal.querySelector('.modal-content');
                if (modalContent) modalContent.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }, 300);
            };

            openDetailsButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const eventTitle = button.dataset.event;
                    const eventDetails = button.dataset.details;
                    const iconContainer = document.getElementById(button.dataset.icon);
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

            if (openRegisterFromDetailsBtn) {
                openRegisterFromDetailsBtn.addEventListener('click', () => {
                    closeModal(detailsModal);
                    myEventCode = detailsModal.querySelector('#modal-event-title')//isolation of the event code
                    setTimeout(() => openModal(registerModal, myEventCode.textContent), 300);
                });
            }
            allCloseButtons.forEach(button => button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop'))));

            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) closeModal(backdrop);
                });
            });

            // --- Form Validation & Submission ---
            const form = document.getElementById('registrationForm');
            const formMessage = document.getElementById('form-message');
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                clearErrors();
                formMessage.classList.add('hidden');

                let isValid = true;
                const requiredFields = ['fullName', 'teamName', 'class', 'school'];

                requiredFields.forEach(fieldId => {
                    const input = document.getElementById(fieldId);
                    if (input && !input.value.trim()) {

                        showError(fieldId, `${input.previousElementSibling.textContent.replace('*', '')} is required.`);
                        isValid = false;
                    }
                });

                

                const submitButton = form.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = 'Submitting...';

                const formData = new FormData(form);
                const body = new URLSearchParams(formData).toString();

                fetch('/echelon-post', {//backend
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

            function showMessage(message, type) {
                const formMessage = document.getElementById('form-message');
                if (!formMessage) return;
                formMessage.textContent = message;
                formMessage.className = `text-center p-3 rounded-lg mb-4 ${type === 'success' ? 'bg-green-900/50 border border-green-500 text-green-300' : 'bg-red-900/50 border border-red-500 text-red-300'}`;
                formMessage.classList.remove('hidden');
            }

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
                document.querySelectorAll('.error-message').forEach(el => {
                    el.style.display = 'none';
                    el.textContent = '';
                });
                document.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
                const formMessage = document.getElementById('form-message');
                if (formMessage) formMessage.classList.add('hidden');
            }

        });
