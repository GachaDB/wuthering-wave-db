async function fetchCharacters() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/GachaDB/wuthering-wave-db/main/Asset/Json/characters.json");
    const characters = await response.json();
    const filteredCharacters = characters.filter((char) => char.release_date !== "???");
    displayCharacters(filteredCharacters);
  } catch (error) {
    console.error("Error loading characters:", error);
  }
}
function displayCharacters(characters) {
  const container = document.getElementById("characterGrid");
  container.innerHTML = "";

  const currentDate = new Date();
  const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

  const recentCharacters = [];
  const otherCharacters = [];

  characters.forEach((character) => {
    const releaseDate = new Date(character.release_date);
    const isValidDate = !isNaN(releaseDate);
    const isRecent = isValidDate && currentDate - releaseDate <= oneWeek;

    if (isRecent) {
      recentCharacters.push(character);
    } else {
      otherCharacters.push(character);
    }
  });

  // Sort characters
  recentCharacters.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  otherCharacters.sort((a, b) => a.name.localeCompare(b.name));

  const sortedCharacters = [...recentCharacters, ...otherCharacters];

  sortedCharacters.forEach((character) => {
    const rarityClass = character.rarity === 4 ? "rarity-4" : character.rarity === 5 ? "rarity-5" : "";
    const releaseDate = new Date(character.release_date);
    const isValidDate = !isNaN(releaseDate);
    const isRecent = isValidDate && currentDate - releaseDate <= oneWeek;

    const nameWithEmoji = isRecent ? `${character.name} <span style="color: red;">★</span>` : character.name;

    const charDiv = document.createElement("div");
    charDiv.className = `item ${rarityClass}`;
    charDiv.innerHTML = `
        <div class="item-info">
            <div class="item-name">${nameWithEmoji}</div>
            <div class="item-price">
                <img src="https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/element/${character.element}_Element_Icon.webp" 
                    alt="${character.element} Element" 
                    class="element-icon"
                    title="${character.element}">

                <img src="https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/weapon/${character.type}_Weapon_Icon.webp" 
                    alt="${character.type} Weapon" 
                    class="weapon-icon"
                    title="${character.type}">

                ${"⭐".repeat(character.rarity)}
            </div>
        </div>
        <img src="https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/resonator/Character%20Icon/${character.image}" 
            alt="${character.name}" 
            class="head-icon">
    `;

    // Add click event to navigate to the detail page
    charDiv.addEventListener("click", () => {
      // window.location.href = `Character-Detail.html?name=${encodeURIComponent(character.name)}`;
    });

    container.appendChild(charDiv);
  });

  console.log(
    "✅ Display Order:",
    sortedCharacters.map((c) => `${c.name} (${c.release_date})`)
  );
}

function toggleAll(mainCheckbox, className) {
  const checkboxes = document.querySelectorAll(`.${className}`);
  checkboxes.forEach((checkbox) => {
    checkbox.checked = mainCheckbox.checked;
  });
  filterCharacters();
}

function filterCharacters() {
  console.log("🔄 filterCharacters() triggered!");

  fetch("../Asset/json/characters.json")
    .then((response) => response.json())
    .then((characters) => {
      //   console.log("✅ JSON Loaded:", characters.length, "characters");

      const search = document.getElementById("searchInput").value.toLowerCase();
      const selectedElements = Array.from(document.querySelectorAll(".element-filter:checked")).map((el) => el.value);
      const selectedRarity = Array.from(document.querySelectorAll(".rarity-filter:checked")).map((el) => parseInt(el.value));
      const selectedTypes = Array.from(document.querySelectorAll(".type-filter:checked")).map((el) => el.value);
      const selectedRole = document.getElementById("roleFilter").value;

      const filtered = characters.filter((character) => {
        const hasValidReleaseDate = character.release_date && character.release_date !== "???";
        const initials = getInitials(character.name);
        const nameLower = character.name.toLowerCase();

        return (
          hasValidReleaseDate &&
          (search === "" || fuzzyMatch(nameLower, search) || fuzzyMatch(initials, search)) &&
          (selectedElements.length === 0 || selectedElements.includes(character.element)) &&
          (selectedRarity.length === 0 || selectedRarity.includes(character.rarity)) &&
          (selectedTypes.length === 0 || selectedTypes.includes(character.type)) &&
          (selectedRole === "" || character.role === selectedRole)
        );
      });

      // Display the results
      displayCharacters(filtered);
    })
    .catch((error) => console.error("❌ Error filtering characters:", error));
}

// 🔎 Filters remain the same
document.addEventListener("DOMContentLoaded", () => {
  fetchCharacters();

  document.querySelectorAll(".element-filter, .rarity-filter, .type-filter").forEach((filter) => {
    filter.addEventListener("change", filterCharacters);
  });
});

function fuzzyMatch(target, search) {
  let searchIndex = 0;
  for (let char of target) {
    if (char === search[searchIndex]) {
      searchIndex++;
      if (searchIndex === search.length) return true;
    }
  }
  return false;
}

function getInitials(name) {
  return name
    .split(/\s+/) // Split by spaces
    .map((word) =>
      word
        .split("")
        .filter((char, i) => i === 0 || char.toUpperCase() === char)
        .join("")
    )
    .join("")
    .toLowerCase();
}
