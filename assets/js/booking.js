// Booking Form Logic
document.addEventListener('DOMContentLoaded', () => {
    // Set year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    // Show "Altres" text field when "Otro" is selected
    const otherRadio = document.getElementById('eventTypeOther');
    if (otherRadio) {
        otherRadio.addEventListener('change', function (e) {
            document.getElementById('eventTypeOtherText').style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Hide "Altres" text field when other options are selected
    document.querySelectorAll('input[name="eventType"]').forEach(radio => {
        if (radio.id !== 'eventTypeOther') {
            radio.addEventListener('change', function () {
                const otherText = document.getElementById('eventTypeOtherText');
                if (otherText) otherText.style.display = 'none';
            });
        }
    });

    // Form submission handler
    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Ensure Firebase is ready
        if (!window.database) {
            alert("Error: No s'ha pogut connectar amb la base de dades.");
            return;
        }

        const { database, ref, push, set } = window; // Use exposed Firebase

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviant...';

        // Collect selected music styles
        const musicStyles = [];
        document.querySelectorAll('input[name="musicStyle"]:checked').forEach((checkbox) => {
            musicStyles.push(checkbox.value);
        });

        const formData = {
            contactName: document.getElementById('contactName').value,
            contactPhone: document.getElementById('contactPhone').value,
            contactEmail: document.getElementById('contactEmail').value,
            eventType: document.querySelector('input[name="eventType"]:checked')?.value,
            eventTypeOther: document.getElementById('eventTypeOtherText').value,
            eventDate: document.getElementById('eventDate').value,
            eventTime: document.getElementById('eventTime').value,
            eventLocation: document.getElementById('eventLocation').value,
            attendees: document.querySelector('input[name="attendees"]:checked')?.value,
            audience: document.querySelector('input[name="audience"]:checked')?.value,
            previousEvent: document.querySelector('input[name="previousEvent"]:checked')?.value,
            otherActs: document.querySelector('input[name="otherActs"]:checked')?.value,
            duration: document.querySelector('input[name="duration"]:checked')?.value,
            tech: document.querySelector('input[name="tech"]:checked')?.value,
            musicStyle: musicStyles.join(', '),
            discovery: document.querySelector('input[name="discovery"]:checked')?.value,
            comments: document.getElementById('comments').value,
            submittedAt: new Date().toISOString(),
            status: 'pending' // pending, contacted, booked, cancelled
        };

        // Push to Firebase
        const newBookingRef = push(ref(database, 'booking-requests'));
        set(newBookingRef, formData)
            .then(() => {
                alert('Sol·licitud enviada correctament! Et contactarem aviat.');
                document.getElementById('booking-form').reset();
                const otherText = document.getElementById('eventTypeOtherText');
                if (otherText) otherText.style.display = 'none';
            })
            .catch((error) => {
                console.error(error);
                alert('Hi ha hagut un error al enviar la sol·licitud. Si us plau, intenta-ho més tard o contacta per Instagram.');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.feature-card').forEach(el => {
        observer.observe(el);
    });
});
