document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");
    initializeBanners();
  });

const eventsDataUrl = "https://raw.githubusercontent.com/GachaDB/wuthering-wave-db/refs/heads/main/Asset/Json/events.json";
const rates = {
    base5Star: 0.008,
    average5Star: 0.018,
    guarantee5Star: 80,
    base4Star: 0.06,
    guarantee4Star: 10,
    increased5StarPerSummon: 0.05,
    softPity: 67,
};
console.log("Gacha.js is loaded!");

let banners = []; // Will be populated with active convene events
let summonData = JSON.parse(localStorage.getItem("summonData")) || {};

async function initializeBanners() {
    try {
      const response = await fetch(eventsDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      const events = await response.json();
      console.log("Fetched events:", events);
  
      const now = new Date();
      console.log("Current date:", now);
  
      const parseDate = (dateString) => {
        const [date, time] = dateString.split(" ");
        const [year, month, day] = date.split("-");
        const [hour, minute] = time.split(":");
        return new Date(year, month - 1, day, hour, minute);
      };
  
      const filteredEvents = events
        .filter((event) => event.type === "Convene") // Match the case
        .filter((event) => {
          const start = parseDate(event.start);
          const end = parseDate(event.end);
          console.log(`Event: ${event.name}, Start: ${start}, End: ${end}, Now: ${now}`);
          return now >= start && now <= end;
        });
  
      console.log("Filtered events:", filteredEvents);
  
      banners = filteredEvents.map((event) => ({
        id: event.id,
        type: event.event_detail.type,
        name: event.name,
        featured: event.event_detail.featured,
        featured4Star: event.event_detail.featured4Star,
        imageUrl: `https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/other/Convene%20Event/${event.imageUrl}`,
      }));
  
      console.log("Banners:", banners);
  
      const bannerNav = document.getElementById("bannerNav");
      const bannerContainer = document.getElementById("bannerContainer");
  
      if (!bannerNav || !bannerContainer) {
        console.error("bannerNav or bannerContainer not found!");
        return;
      }
  
      if (banners.length === 0) {
        console.log("No active banners found.");
        bannerContainer.innerHTML = "<p>No active banners at the moment.</p>";
        return;
      }
  
      banners.forEach((banner) => {
        const button = document.createElement("button");
        button.textContent = banner.name;
        button.onclick = () => showPage(banner.id);
        bannerNav.appendChild(button);
        console.log("Button created for banner:", banner.name);
  
        const bannerDiv = document.createElement("div");
        bannerDiv.id = banner.id;
        bannerDiv.className = "banner";
        bannerDiv.style.backgroundImage = `url(${banner.imageUrl})`;
        bannerDiv.style.backgroundSize = "cover";
        bannerDiv.style.backgroundPosition = "center";
        bannerDiv.innerHTML = `
          <h2>${banner.name}</h2>
          <p>Pity Count: <span id="${banner.id}Pity">0</span> / 80</p>
          <div class="summon-buttons">
            <button onclick="summon('${banner.id}', 1)">Summon 1x</button>
            <button onclick="summon('${banner.id}', 10)">Summon 10x</button>
          </div>
          <div id="summoningResult${banner.id}" class="summoning-result"></div>
          <div class="history">
            <h3>${banner.type === "hero" ? "Hero" : "Weapon"} Summon History</h3>
            <button onclick="clearHistory('${banner.id}')">Clear History</button>
            <ul id="${banner.id}HistoryList"></ul>
          </div>
        `;
        bannerContainer.appendChild(bannerDiv);
        console.log("Banner div created for:", banner.name);
  
        if (!summonData[banner.id]) {
          summonData[banner.id] = {
            pity: 0,
            lost50_50: false,
            history: [],
          };
        }
      });
  
      localStorage.setItem("summonData", JSON.stringify(summonData));
  
      if (banners.length > 0) {
        showPage(banners[0].id);
      }
    } catch (error) {
      console.error("Error fetching or processing events:", error);
    }
  }
  
  function showPage(bannerId) {
    console.log("showPage called for banner:", bannerId);
    document.querySelectorAll(".banner").forEach((banner) => {
      banner.style.display = "none";
    });
    const bannerDiv = document.getElementById(bannerId);
    if (bannerDiv) {
      bannerDiv.style.display = "block";
    } else {
      console.error("Banner div not found:", bannerId);
    }
  }

async function fetchPoolData() {
    const response = await fetch(poolDataUrl);
    return response.json();
}

function filterPoolData(data, type, includeLimited, featuredName) {
    return data.filter((item) => {
        const isTypeMatch = (type === "hero" && item.type === "resonator") || (type === "weapon" && item.type === "weapon") || item.type === "any";
        const isLimitedAllowed = includeLimited || !item.limited || item.name === featuredName;
        return isTypeMatch && isLimitedAllowed;
    });
}

function getRandomItem(pool, rarity) {
    const filteredPool = pool.filter((item) => item.rarity === rarity);
    if (filteredPool.length === 0) {
        return {
            name: `Unknown ${rarity}★`,
            rarity,
        };
    }
    return {
        ...filteredPool[Math.floor(Math.random() * filteredPool.length)],
    };
}

async function summon(bannerId, count) {
    const banner = banners.find((b) => b.id === bannerId);
    const includeLimited = document.getElementById("limitedToggle").checked;
    const poolData = await fetchPoolData();
    const pool = filterPoolData(poolData, banner.type, includeLimited, banner.featured);
    const results = [];
    const summonResults = [];

    for (let i = 0; i < count; i++) {
        summonData[bannerId].pity++;
        let pityCount = summonData[bannerId].pity;
        let rarity;
        let fiveStarRate = rates.base5Star;

        if (pityCount > rates.softPity) {
            fiveStarRate += (pityCount - rates.softPity) * rates.increased5StarPerSummon;
        }
        fiveStarRate = Math.min(fiveStarRate, 1);

        const random = Math.random();
        if (pityCount >= rates.guarantee5Star) {
            rarity = 5;
        } else if (pityCount % rates.guarantee4Star === 0) {
            rarity = 4;
        } else {
            if (random < fiveStarRate) {
                rarity = 5;
            } else if (random < fiveStarRate + rates.base4Star) {
                rarity = 4;
            } else {
                rarity = 3;
            }
        }

        let item = getRandomItem(pool, rarity);

        if (!item) continue;

        if (rarity === 5) {
            if (banner.type === "hero") {
                console.log("[Debug] Before 50/50:", item);
                check50_50System(bannerId, item, pool);
                console.log("[Debug] After 50/50:", item);
            } else if (banner.type === "weapon") {
                item.isFeatured = true;
            }
            showSummonResult(item, bannerId, summonData[bannerId].pity);
            summonData[bannerId].pity = 0;
        } else if (rarity === 4) {
            check4Star50_50System(bannerId, item, pool);
        }

        results.push(JSON.parse(JSON.stringify(item)));
        summonResults.push(JSON.parse(JSON.stringify(item)));
        saveToHistory(bannerId, item);
        console.log("[Debug] Result:", results);
        console.log("[Debug] summonResults:", summonResults);
    }

    showLatestSummonResult(bannerId, summonResults);
    updateHistoryDisplay(bannerId);
    updatePityCounter(bannerId);
    localStorage.setItem("summonData", JSON.stringify(summonData));
}

function saveToHistory(bannerId, item) {
    summonData[bannerId].history.push({
        name: item.name,
        rarity: item.rarity,
        time: new Date().toLocaleString(),
    });
}

function updateHistoryDisplay(bannerId) {
    const historyList = document.getElementById(`${bannerId}HistoryList`);
    historyList.innerHTML = "";
    summonData[bannerId].history.forEach((entry) => {
        const listItem = document.createElement("li");
        listItem.textContent = `${entry.name} at ${entry.time}`;
        if (entry.rarity === 5) {
            listItem.style.color = "gold";
        } else if (entry.rarity === 4) {
            listItem.style.color = "purple";
        } else {
            listItem.style.color = "blue";
        }
        historyList.appendChild(listItem);
    });
}

function updatePityCounter(bannerId) {
    document.getElementById(`${bannerId}Pity`).textContent = summonData[bannerId].pity;
}

function check50_50System(bannerId, item, pool) {
    const banner = banners.find((b) => b.id === bannerId);
    const featuredUnit = pool.find((i) => i.name === banner.featured && i.rarity === 5);

    if (summonData[bannerId].lost50_50) {
        Object.assign(item, featuredUnit);
        item.isFeatured = true;
        summonData[bannerId].lost50_50 = false;
    } else {
        if (Math.random() < 0.5) {
            Object.assign(item, featuredUnit);
            item.isFeatured = true;
        } else {
            const nonFeaturedPool = pool.filter((i) => i.rarity === 5 && !i.isFeatured);
            if (nonFeaturedPool.length > 0) {
                Object.assign(item, nonFeaturedPool[Math.floor(Math.random() * nonFeaturedPool.length)]);
                item.isFeatured = false;
            } else {
                item.name = "Unknown 5★ Unit";
                item.isFeatured = false;
            }
            summonData[bannerId].lost50_50 = true;
        }
    }
}

function check4Star50_50System(bannerId, item, pool) {
    const banner = banners.find((b) => b.id === bannerId);
    const featured4StarUnits = pool.filter((i) => banner.featured4Star.includes(i.name) && i.rarity === 4);

    if (summonData[bannerId].lost50_50_4) {
        if (featured4StarUnits.length > 0) {
            Object.assign(item, featured4StarUnits);
            item.isFeatured = true;
        } else {
            item = pool.find((i) => i.rarity === 4);
            item.isFeatured = false;
        }
        summonData[bannerId].lost50_50_4 = false;
    } else {
        if (Math.random() < 0.5) {
            if (featured4StarUnits.length > 0) {
                Object.assign(item, featured4StarUnits);
                item.isFeatured = true;
            } else {
                item = pool.find((i) => i.rarity === 4);
                item.isFeatured = false;
            }
        } else {
            const nonFeaturedPool = pool.filter((i) => i.rarity === 4 && !banner.featured4Star.includes(i.name));
            if (nonFeaturedPool.length > 0) {
                item = nonFeaturedPool[Math.floor(Math.random() * nonFeaturedPool.length)];
                item.isFeatured = false;
            } else {
                item = pool.find((i) => i.rarity === 4);
                item.isFeatured = false;
            }
            summonData[bannerId].lost50_50_4 = true;
        }
    }
    return item;
}

function showLatestSummonResult(bannerId, items) {
    const resultDiv = document.getElementById(`summoningResult${bannerId}`);
    if (!resultDiv) {
        console.error(`Element with ID 'summoningResult${bannerId}' not found.`);
        return;
    }
    console.log("Items:", items);
    resultDiv.innerHTML = "";

    items.forEach((item) => {
        // Ensure the item has the required properties
        if (!item || !item.rarity) {
            console.error("Invalid item:", item);
            return;
        }

        const resultContent = document.createElement("div");
        let imageUrl = "";
        let imageClass = "";

        // Determine image URL and class based on item type
        const itemType = item.type || "any"; // Fallback type
        if (itemType === "weapon" || (itemType === "any" && item.video === "none")) {
            imageUrl = `https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/weapon/${item.image || "default_weapon.webp"}`;
            imageClass = "summon-item-weapon";
        } else if (itemType === "resonator" || itemType === "any") {
            imageUrl = `https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/resonator/Character%20Model/${item.image || "default_resonator.webp"}`;
            imageClass = "summon-item-resonator";
        }

        // Ensure imageClass is not empty
        if (!imageClass) {
            console.error("Empty imageClass for item:", item);
            imageClass = "summon-item-default"; // Fallback class
        }

        // Add classes to the result content
        resultContent.classList.add("summon-item", `rarity-${item.rarity}`, imageClass);

        // Sanitize image URL
        imageUrl = imageUrl.replace(/#/g, "%23");

        // Set inner HTML
        resultContent.innerHTML = `<img src="${imageUrl}" alt="${item.name}" class="summon-image">`;

        // Append to the result container
        resultDiv.appendChild(resultContent);
    });
}

function showSummonResult(item, bannerId, pityCount) {
    const summonResultDiv = document.getElementById("summonResult");
    summonResultDiv.innerHTML = `<p>🎉 You got a <b>5⭐ ${item.name}</b> at <b>${pityCount}</b> pity!</p>`;
    summonResultDiv.style.display = "block";
}

function clearHistory(bannerId) {
    summonData[bannerId] = {
        pity: 0,
        lost50_50: false,
        history: [],
    };
    localStorage.setItem("summonData", JSON.stringify(summonData));
    updateHistoryDisplay(bannerId);
    updatePityCounter(bannerId);
}

function loadHistory() {
    banners.forEach((banner) => {
        updateHistoryDisplay(banner.id);
        updatePityCounter(banner.id);
    });
}

initializeBanners();
loadHistory();
if (banners.length > 0) {
    showPage(banners[0].id);
}