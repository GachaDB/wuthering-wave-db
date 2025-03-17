function createNavigation() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';
    
    const menuBtn = document.createElement('div');
    menuBtn.className = 'menu-btn';
    menuBtn.innerHTML = '<i class="bx bx-menu"></i>';
    
    navbar.appendChild(menuBtn);

    const sidebar = document.createElement('nav');
    sidebar.className = 'sidebar';

    const header = document.createElement('header');
    const imageText = document.createElement('div');
    imageText.className = 'image-text';

    const link = document.createElement('a');
    link.href = 'your-link-here';
    
    const imageSpan = document.createElement('span');
    imageSpan.className = 'image';
    const img = document.createElement('img');
    img.src = 'https://t4.ftcdn.net/jpg/04/06/91/91/240_F_406919147_D3WsGjwXj1qmFNrei2ZFvBWwiueRcFmg.jpg';
    img.alt = 'logo';
    imageSpan.appendChild(img);
    link.appendChild(imageSpan);

    const headerText = document.createElement('div');
    headerText.className = 'text header-text';
    headerText.innerHTML = '<span class="main">Wuthering Waves</span>';

    imageText.appendChild(link);
    imageText.appendChild(headerText);

    const toggle = document.createElement('i');
    toggle.className = 'bx bx-chevron-right toggle';

    header.appendChild(imageText);
    header.appendChild(toggle);

    const menuBar = document.createElement('div');
    menuBar.className = 'menu-bar';

    const menuItems = [
        { href: '../index', icon: 'bx-home-alt', text: 'Dashboard' },
        { href: '/Pages/Code', icon: 'bxs-coupon', text: 'Coupons/Codes' },
        { href: '/Pages/Character', icon: 'bx-group', text: 'Character' },
        { href: '/Pages/Weapon', icon: 'bx-knife', text: 'Weapon' },
        { href: '/Pages/Echos-TD', icon: 'bxs-virus', text: 'Echos/TD' },
        { href: '/Pages/Story', icon: 'bx-book-content', text: 'Story' },
        { href: '/Pages/Timeline', icon: 'bx-calendar', text: 'Timeline' },
        { href: '/Pages/Gacha', icon: 'bx-stats', text: 'Gacha Simulator' }
    ];
    const validPaths = new Set(menuItems.map(item => item.href));

    // On page load or navigation
    document.addEventListener('DOMContentLoaded', () => {
        const path = window.location.pathname;
        if (!validPaths.has(path)) {
            fetch('/404.html')
                .then(response => response.text())
                .then(html => document.body.innerHTML = html);
        }
    });

    const menu = document.createElement('div');
    menu.className = 'menu';

    menuItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'nav-link';
        
        const a = document.createElement('a');
        a.href = item.href;
        a.innerHTML = `
            <i class="bx ${item.icon} icons"></i>
            <span class="text nav-text">${item.text}</span>
        `;
        
        li.appendChild(a);
        menu.appendChild(li);
    });

    const bottomContent = document.createElement('div');
    bottomContent.className = 'bottom-content';

    const supportLi = document.createElement('li');
    supportLi.className = 'nav-link';
    
    const supportA = document.createElement('a');
    supportA.href = '/Pages/Credits';
    supportA.innerHTML = `
        <i class="bx bxs-heart icons"></i>
        <span class="text nav-text">Support Us</span>
    `;
    
    supportLi.appendChild(supportA);
    bottomContent.appendChild(supportLi);

    menuBar.appendChild(menu);
    menuBar.appendChild(bottomContent);

    sidebar.appendChild(header);
    sidebar.appendChild(menuBar);

    document.body.appendChild(navbar);
    document.body.appendChild(sidebar);

    const body = document.querySelector("body");
    const createdSidebar = document.querySelector(".sidebar");
    const createdToggle = document.querySelector(".toggle");
    const createdMenuBtn = document.querySelector(".menu-btn");

    body.classList.add("dark");
    createdSidebar.classList.add("close");

    createdToggle.addEventListener("click", () => {
        createdSidebar.classList.toggle("close");
    });

    createdMenuBtn.addEventListener("click", () => {
        createdSidebar.classList.toggle("close");
    });
}

document.addEventListener('DOMContentLoaded', createNavigation);