// Handle 404 logic separately
function handle404() {
    const menuItems = [
        { href: '/index', icon: 'bx-home-alt', text: 'Dashboard' },
        { href: '/Pages/Code', icon: 'bxs-coupon', text: 'Coupons/Codes' },
        { href: '/Pages/Character', icon: 'bx-group', text: 'Character' },
        { href: '/Pages/Weapon', icon: 'bx-knife', text: 'Weapon' },
        { href: '/Pages/Echos-TD', icon: 'bxs-virus', text: 'Echos/TD' },
        { href: '/Pages/Story', icon: 'bx-book-content', text: 'Story' },
        { href: '/Pages/Timeline', icon: 'bx-calendar', text: 'Timeline' },
        { href: '/Pages/Gacha', icon: 'bx-stats', text: 'Gacha Simulator' }
    ];
    const validPaths = new Set(menuItems.map(item => item.href));
    const currentPath = window.location.pathname;

    // Check if the path is not in validPaths
    if (!validPaths.has(currentPath)) {
        fetch('../404.html')
            .then(response => {
                if (!response.ok) throw new Error('404.html not found');
                return response.text();
            })
            .then(html => {
                document.body.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading 404:', error);
                document.body.innerHTML = '<h1>404 Not Found</h1><p>Page not found.</p>';
            });
    }
}

// Run navigation creation and 404 handling on DOM load
document.addEventListener('DOMContentLoaded', () => {
    createNavigation();
    handle404();
});