// Mashups Page Logic
import { auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function () {
    // Check if Tesseract is available
    if (typeof Tesseract === 'undefined') {
        console.error('Tesseract.js not loaded');
    }

    // Initialize translations logic if available
    if (typeof initializePage === 'function' && window.pageTranslations) {
        initializePage(window.pageTranslations, (translations, getLanguage) => {
            setupMashupsPage(translations, getLanguage);
        });
    } else {
        // Fallback if translations script isn't ready
        setupMashupsPage(null, () => 'ca');
    }
});

function setupMashupsPage(translations, getLanguage) {
    const followGate = document.getElementById('follow-gate');
    const mashupsContent = document.getElementById('mashups-content');
    const verifyButton = document.getElementById('verify-button');
    const modal = document.getElementById('verification-modal');
    const cancelBtn = document.getElementById('cancel-verification');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('screenshot-input');
    const uploadText = document.getElementById('upload-text');
    const statusText = document.getElementById('verification-status');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');

    // Helper to getText safely
    const getText = (key) => {
        const lang = getLanguage();
        return translations && translations[lang] && translations[lang][key] ? translations[lang][key] : key;
    };

    // Check if already verified
    const djPosaxaFollowVerified = localStorage.getItem('djPosaxaFollowVerified');
    if (djPosaxaFollowVerified === 'true') {
        if (followGate) followGate.style.display = 'none';
        if (mashupsContent) mashupsContent.style.display = 'block';
    }

    if (!verifyButton || !fileInput) return;

    // Verify button click
    verifyButton.addEventListener('click', () => {
        // We use the global auth object from firebase-config if available
        // Or check if user is logged in via UI state
        // For simplicity, we just prompt login if we can't find a user

        const currentUser = auth.currentUser;

        if (currentUser) {
            modal.style.display = 'flex';
        } else {
            const authModal = document.getElementById('authModal');
            if (authModal) {
                const bsModal = new bootstrap.Modal(authModal);
                bsModal.show();
            } else {
                alert("Error: Auth modal not found");
            }
        }
    });

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            fileInput.value = '';
            statusText.innerHTML = '';
            progressContainer.style.display = 'none';
            uploadText.textContent = getText('modal_upload_text');
        });
    }

    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // File input change
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        uploadText.textContent = `Arxiu: ${file.name}`;
        statusText.innerHTML = "Analitzant amb Sigma AI...";
        statusText.style.color = '#667eea';
        progressBar.style.width = '0%';
        progressContainer.style.display = 'block';

        const followWords = [
            "siguiendo", "following", "seguint", "sigues a", "follows you",
            "suivi", "suivant", "gefolgt", "folgen", "seguito", "seguindo",
            "volgend", "takiptesin", "читаю", "подписан", "متابع", "フォロー中", "팔로잉", "正在关注",
            "amistades", "amigos", "friends", "amis", "freunde" // Expanded keywords to cover more "following" states
        ];

        try {
            const { data: { text } } = await Tesseract.recognize(file, 'eng+spa+cat', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = m.progress * 100;
                        progressBar.style.width = `${progress}%`;
                        statusText.innerHTML = `Analitzant amb Sigma AI... (${Math.round(progress)}%)`;
                    }
                }
            });

            progressContainer.style.display = 'none';
            const texto = text.toLowerCase();

            // Validation Logic
            const follows = followWords.some(word => texto.includes(word));

            // Relaxed name matching to avoid OCR errors (e.g "posaxa" is unique enough)
            const hasName = texto.includes("dj.posaxa") ||
                texto.includes("dj posaxa") ||
                texto.includes("posaxa") ||
                texto.includes("dj_posaxa") ||
                texto.includes("djposaxa");

            if (follows && hasName) {
                statusText.innerHTML = '✅ <b>Verificat:</b> S\'ha detectat que segueixes a DJ Posaxa.';
                statusText.style.color = '#10b981';
                localStorage.setItem('djPosaxaFollowVerified', 'true');

                // Update Firebase if possible
                if (window.updateFirebasePreference) {
                    window.updateFirebasePreference('djPosaxaFollowVerified', 'true');
                }

                setTimeout(() => {
                    modal.style.display = 'none';
                    followGate.style.display = 'none';
                    mashupsContent.style.display = 'block';
                }, 2000);
            } else {
                let errorMsg = '❌ <b>No verificat.</b><br>';
                if (!hasName) errorMsg += 'No hem trobat el nom "dj.posaxa". ';
                if (!follows) errorMsg += 'No hem trobat l\'indicador de "Seguint". ';

                statusText.innerHTML = errorMsg + '<br>Prova amb una altra captura més clara.';
                statusText.style.color = '#ef4444';
                fileInput.value = '';
                uploadText.textContent = getText('modal_upload_text');
            }
        } catch (err) {
            progressContainer.style.display = 'none';
            statusText.innerHTML = "⚠️ Error en processar la imatge. Intenta-ho de nou.";
            statusText.style.color = '#ef4444';
            console.error(err);
            fileInput.value = '';
            uploadText.textContent = getText('modal_upload_text');
        }
    });
}
