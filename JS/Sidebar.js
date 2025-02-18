const body = document.querySelector("body"),
  sidebar = document.querySelector(".sidebar"),
  toggle = document.querySelector(".toggle"),
  menuBtn = document.querySelector(".menu-btn"), // Added menu button
  modeSwitch = document.querySelector(".toggle-switch"),
  modeText = document.querySelector(".mode-text"),
  searchBtn = document.querySelector(".search-bar");

// Default settings
body.classList.add("dark");
sidebar.classList.add("close");

// Sidebar toggle (sidebar button)
toggle.addEventListener("click", () => {
  sidebar.classList.toggle("close");
});

// Sidebar toggle (navbar menu button)
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("close"); // Open sidebar when button is clicked
});
