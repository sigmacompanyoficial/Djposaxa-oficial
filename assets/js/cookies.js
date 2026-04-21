document.addEventListener("DOMContentLoaded", function () {
    const cookieKey = "djposaxa_cookies_accepted";

    // Check if user already accepted
    if (localStorage.getItem(cookieKey)) {
        return;
    }

    // Create Banner HTML
    const banner = document.createElement("div");
    banner.id = "cookie-banner";
    banner.innerHTML = `
        <div class="cookie-content">
            <div class="cookie-text">
                <h4>🍪 Cookies</h4>
                <p>Utilitzem cookies pròpies i de tercers per millorar la teva experiència i analitzar el trànsit. Si continues navegant, acceptes el seu ús.</p>
            </div>
            <div class="cookie-buttons">
                <button id="accept-cookies" class="btn-accept">Acceptar</button>
                <a href="/legal.html#cookies" class="btn-policy">Veure Política</a>
            </div>
        </div>
    `;

    // Styles
    const style = document.createElement("style");
    style.textContent = `
        #cookie-banner {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 600px;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            z-index: 100000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: slideUp 0.5s ease-out;
        }
        .cookie-content {
            display: flex;
            flex-direction: column;
            gap: 15px;
            color: #fff;
        }
        .cookie-text h4 { margin: 0 0 5px 0; font-size: 1.1rem; }
        .cookie-text p { margin: 0; font-size: 0.9rem; color: #ccc; }
        .cookie-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .btn-accept {
            background: #fff;
            color: #000;
            border: none;
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn-accept:hover { transform: scale(1.05); }
        .btn-policy {
            color: #aaa;
            text-decoration: underline;
            padding: 8px 10px;
            font-size: 0.9rem;
        }
        @keyframes slideUp { from { transform: translate(-50%, 100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Logic
    document.getElementById("accept-cookies").addEventListener("click", () => {
        localStorage.setItem(cookieKey, "true");
        banner.style.opacity = "0";
        setTimeout(() => banner.remove(), 500);
    });
});