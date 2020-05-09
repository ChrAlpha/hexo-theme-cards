let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

document.addEventListener('DOMContentLoaded', function() {
    const goTopButton = document.querySelectorAll('#b2t')[0];
    const windowViewPortHeight = window.innerHeight;
    let isRequestingAnimationFrame = false;

    if (!goTopButton) {return;}

    goTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    window.addEventListener('scroll', function() {
        if (!isRequestingAnimationFrame) {
            requestAnimationFrame(filterGoTopButtonVisibility);
            isRequestingAnimationFrame = true;
        }
    });

    function filterGoTopButtonVisibility(timestamp) {
        let windowPageYOffset = window.pageYOffset || document.documentElement.scrollTop;
        if (windowPageYOffset > windowViewPortHeight) {
            goTopButton.style.display = 'block';
            isRequestingAnimationFrame = false;
        } else {
            goTopButton.style.display = 'none';
            requestAnimationFrame(filterGoTopButtonVisibility);
        }
    }
});
