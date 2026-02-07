
// ** Security: Prevent stealing HTML/Code **
document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
}, false);

document.addEventListener("keydown", function (e) {
    // F12
    if (e.keyCode == 123) {
        e.preventDefault();
        return false;
    }
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
        e.preventDefault();
        return false;
    }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.keyCode == 74) {
        e.preventDefault();
        return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.keyCode == 85) {
        e.preventDefault();
        return false;
    }
});
