document.addEventListener("DOMContentLoaded", () => {
	console.log("DOM fully loaded and parsed");
	initializeBanners();
	// Ensure banners are initialized before calling loadHistory()
	setTimeout(() => {
		console.log("Calling loadHistory after banners are initialized");
		loadHistory();
	}, 100); // Delay slightly to ensure banners are populated
	if (banners.length > 0) {
		showPage(banners[0].id);
	}
});

const eventsDataUrl = "https://raw.githubusercontent.com/GachaDB/wuthering-wave-db/refs/heads/main/Asset/Json/events.json";
const poolDataUrl = "https://raw.githubusercontent.com/GachaDB/wuthering-wave-db/refs/heads/main/Asset/Json/pool.json";
const paginationState = {};

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

// Initialize summonData for each event_detail.type
const initializeSummonData = (type) => {
	if (!summonData[type]) {
		summonData[type] = {
			pity: 0,
			lost50_50: false,
			history: [],
		};
	}
};

async function initializeBanners() {
	try {
		const response = await fetch(eventsDataUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
		}
		const events = await response.json();

		const now = new Date();

		const parseDate = (dateString) => {
			if (!dateString) return null;
			const [date, time] = dateString.split(" ");
			const [year, month, day] = date.split("-");
			const [hour, minute] = time.split(":");
			return new Date(year, month - 1, day, hour, minute);
		};

		const filteredEvents = events
			.filter((event) => event.type === "Convene")
			.filter((event) => {
				const start = parseDate(event.start);
				const end = parseDate(event.end);

				if (start === null || end === null) {
					return false;
				}

				return now >= start && now <= end;
			});

		banners = filteredEvents.map((event) => ({
			id: event.id,
			type: event.event_detail.type,
			name: event.name,
			featured: event.event_detail.featured,
			featured4Star: event.event_detail.featured4Star,
			imageUrl: `https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/other/Convene%20Event/${event.imageUrl}`,
		}));

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
            const fixedUrl = fixApostrophe(banner.imageUrl);
            const button = document.createElement("button");
            button.style.backgroundImage = `url(${fixedUrl})`;
            button.onclick = () => showPage(banner.id);
            bannerNav.appendChild(button);
        
            const bannerDiv = document.createElement("div");
bannerDiv.id = banner.id;
bannerDiv.className = "banner";
bannerDiv.innerHTML = `
    <img src="${fixedUrl}" alt="${banner.name}" class="banner-image">
    <div class="banner-content">
        <h2>${banner.name}</h2>
        <p class="pity-counter">Pity Count: <span id="${banner.id}Pity">${summonData[banner.type]?.pity || 0}</span> / 80</p>
        <div class="summon-buttons">
            <button class="main-button" onclick="summon('${banner.id}', '${banner.type}', 1)">
                <img src="https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/other/Items/Item_Radiant_Tide.webp" alt="Convene x1" class="summon-icon">x1 Summon 1x
            </button>
            <button class="main-button" onclick="summon('${banner.id}', '${banner.type}', 10)">
                <img src="https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/other/Items/Item_Radiant_Tide.webp" alt="Convene x10" class="summon-icon">x10 Summon 10x
            </button>
        </div>
        <button class="main-button history-button" onclick="openHistoryModal('${banner.id}')">Show History</button>
        <div id="historyModal${banner.id}" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>${banner.type === "hero" ? "Hero" : "Weapon"} Summon History</h3>
                <table id="${banner.type}HistoryTable" class="history-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Rarity</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody id="${banner.type}HistoryBody"></tbody>
                </table>
                <div class="pagination">
                    <button onclick="prevPage('${banner.type}')">Previous</button>
                    <span id="${banner.type}PageInfo"></span>
                    <button onclick="nextPage('${banner.type}')">Next</button>
                </div>
                <button class="main-button" onclick="clearHistory('${banner.type}')">Clear History</button>
                <button class="main-button" onclick="closeHistoryModal('${banner.id}')">Close</button>
            </div>
        </div>
        <div id="summonResultModal${banner.id}" class="modal" style="display: none;">
            <div class="modal-content">
                <div id="summoningResult${banner.id}" class="summoning-result"></div>
                <button class="main-button" onclick="closeSummonResultModal('${banner.id}')">Close</button>
            </div>
        </div>
    </div>
`;
            bannerContainer.appendChild(bannerDiv);
        
            initializeSummonData(banner.type);
        });

		localStorage.setItem("summonData", JSON.stringify(summonData));
		console.log("Saved summonData to localStorage:", summonData);

		if (banners.length > 0) {
			showPage(banners[0].id);
		}
	} catch (error) {
		console.error("Error fetching or processing events:", error);
	}
}

function fixApostrophe(url) {
	return url.replace(/%27/g, "%2527");
}

function showPage(bannerId) {
    console.log("showPage called for banner:", bannerId);
    document.querySelectorAll(".banner").forEach((banner) => {
        banner.classList.remove("active");
    });
    const bannerDiv = document.getElementById(bannerId);
    if (bannerDiv) {
        bannerDiv.classList.add("active");

        setTimeout(() => {
            loadHistory();
        }, 50);
    } else {
        console.error("Banner div not found:", bannerId);
    }
}

async function fetchPoolData() {
	try {
		const response = await fetch(poolDataUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch pool data: ${response.status} ${response.statusText}`);
		}
		const poolData = await response.json();
		return poolData;
	} catch (error) {
		console.error("Error fetching pool data:", error);
		return [];
	}
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

// Add these after your banners.forEach loop
function openHistoryModal(bannerId) {
    document.getElementById(`historyModal${bannerId}`).style.display = "flex";
}

function closeHistoryModal(bannerId) {
    document.getElementById(`historyModal${bannerId}`).style.display = "none";
}

function openSummonResultModal(bannerId) {
    document.getElementById(`summonResultModal${bannerId}`).style.display = "flex";
}

function closeSummonResultModal(bannerId) {
    document.getElementById(`summonResultModal${bannerId}`).style.display = "none";
}

async function summon(bannerId, bannerType, count) {
	const banner = banners.find((b) => b.id === bannerId);
	const includeLimited = document.getElementById("limitedToggle").checked;
	const poolData = await fetchPoolData();
	const pool = filterPoolData(poolData, banner.type, includeLimited, banner.featured);
	const results = [];
	const summonResults = [];

	for (let i = 0; i < count; i++) {
		summonData[bannerType].pity++;
		let pityCount = summonData[bannerType].pity;
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
			if (banner.type === "hero" || banner.type === "weapon") {
				check50_50System(bannerId, bannerType, item, pool);
			}
			showSummonResult(item, bannerId, summonData[bannerType].pity);
			summonData[bannerType].pity = 0;
		} else if (rarity === 4) {
			check4Star50_50System(bannerId, bannerType, item, pool);
		}

		results.push(JSON.parse(JSON.stringify(item)));
		summonResults.push(JSON.parse(JSON.stringify(item)));
		saveToHistory(bannerType, item);
	}

    openSummonResultModal(bannerId);
	showLatestSummonResult(bannerId, summonResults);
	updateHistoryDisplay(bannerType);
	updatePityCounter(bannerType);
	localStorage.setItem("summonData", JSON.stringify(summonData));
}

function saveToHistory(bannerType, item) {
	summonData[bannerType].history.push({
		name: item.name,
		rarity: item.rarity,
		time: new Date().toLocaleString(),
	});
}

function updateHistoryDisplay(bannerType) {
    console.log("Updating history display for banner type:", bannerType);
    const historyBodies = document.querySelectorAll(`#${bannerType}HistoryBody`);
    const pageInfoElements = document.querySelectorAll(`#${bannerType}PageInfo`);
    if (historyBodies.length === 0) {
        console.error(`History table body not found for banner type: ${bannerType}`);
        return;
    }

    historyBodies.forEach((historyBody, index) => {
        const pageInfo = pageInfoElements[index];
        historyBody.innerHTML = "";
        if (!summonData[bannerType] || !summonData[bannerType].history || summonData[bannerType].history.length === 0) {
            historyBody.innerHTML = "<tr><td colspan='3'>No history available</td></tr>";
            pageInfo.textContent = "Page 1 of 1";
            return;
        }

        // Pagination logic
        const itemsPerPage = 5;
        if (!paginationState[bannerType]) {
            paginationState[bannerType] = { currentPage: 1 };
        }
        const totalItems = summonData[bannerType].history.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        let currentPage = paginationState[bannerType].currentPage;

        // Ensure currentPage is valid
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        paginationState[bannerType].currentPage = currentPage;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedHistory = summonData[bannerType].history.slice(startIndex, endIndex);

        paginatedHistory.forEach((entry) => {
            const rarityClass = `rarity-${entry.rarity}`; // e.g., rarity-5, rarity-4
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="${rarityClass}">${entry.name}</td>
                <td class="${rarityClass}">${entry.rarity}⭐</td>
                <td class="${rarityClass}">${entry.time}</td>
            `;
            historyBody.appendChild(row);
        });

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    });
}

function prevPage(bannerType) {
    if (paginationState[bannerType] && paginationState[bannerType].currentPage > 1) {
        paginationState[bannerType].currentPage--;
        updateHistoryDisplay(bannerType);
    }
}

function nextPage(bannerType) {
    if (!summonData[bannerType] || !summonData[bannerType].history) return;
    const totalItems = summonData[bannerType].history.length;
    const totalPages = Math.ceil(totalItems / 5);
    if (paginationState[bannerType] && paginationState[bannerType].currentPage < totalPages) {
        paginationState[bannerType].currentPage++;
        updateHistoryDisplay(bannerType);
    }
}

function updatePityCounter(bannerType) {
	console.log(`Current pity value for ${bannerType}:`, summonData[bannerType].pity);
	const bannersOfSameType = banners.filter((b) => b.type === bannerType);
	console.log(`Number of banners of type ${bannerType}:`, bannersOfSameType.length);
	bannersOfSameType.forEach((banner) => {
		const pityElement = document.getElementById(`${banner.id}Pity`);
		if (pityElement) {
			pityElement.textContent = summonData[bannerType].pity;
			console.log(`Updated pity counter for ${banner.id} to:`, summonData[bannerType].pity);
		} else {
			console.error(`Pity counter element not found for banner ID: ${banner.id}`);
		}
	});
}

function check50_50System(bannerId, bannerType, item, pool) {
	const banner = banners.find((b) => b.id === bannerId);
	const featuredUnit = pool.find((i) => i.name === banner.featured && i.rarity === 5);

	if (banner.type === "hero") {
		if (summonData[bannerType].lost50_50) {
			Object.assign(item, featuredUnit);
			item.isFeatured = true;
			summonData[bannerType].lost50_50 = false;
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
				summonData[bannerType].lost50_50 = true;
			}
		}
	} else {
		Object.assign(item, featuredUnit);
		item.isFeatured = true;
	}
}

function check4Star50_50System(bannerId, bannerType, item, pool) {
	const banner = banners.find((b) => b.id === bannerId);
	const featured4StarUnits = pool.filter((i) => banner.featured4Star.includes(i.name) && i.rarity === 4);

	if (summonData[bannerType].lost50_50_4) {
		if (featured4StarUnits.length > 0) {
			Object.assign(item, featured4StarUnits);
			item.isFeatured = true;
		} else {
			item = pool.find((i) => i.rarity === 4);
			item.isFeatured = false;
		}
		summonData[bannerType].lost50_50_4 = false;
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
			summonData[bannerType].lost50_50_4 = true;
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
		if (!item || !item.rarity) {
			console.error("Invalid item:", item);
			return;
		}

		const resultContent = document.createElement("div");
		let imageUrl = "";
		let imageClass = "";

		const itemType = item.type || "any";
		if (itemType === "weapon" || (itemType === "any" && item.video === "none")) {
			imageUrl = `https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/weapon/${item.image || "default_weapon.webp"}`;
			imageClass = "summon-item-weapon";
		} else if (itemType === "resonator" || itemType === "any") {
			imageUrl = `https://raw.githubusercontent.com/GachaDB/Wuthering-Waves-Assets/refs/heads/main/resonator/Character%20Model/${item.image || "default_resonator.webp"}`;
			imageClass = "summon-item-resonator";
		}

		if (!imageClass) {
			console.error("Empty imageClass for item:", item);
			imageClass = "summon-item-default";
		}

		resultContent.classList.add("summon-item", `rarity-${item.rarity}`, imageClass);
		imageUrl = imageUrl.replace(/#/g, "%23");
		resultContent.innerHTML = `<img src="${imageUrl}" alt="${item.name}" class="summon-image">`;
		resultDiv.appendChild(resultContent);
	});
}

function showSummonResult(item, bannerId, pityCount) {
	const summonResultDiv = document.getElementById("summonResult");
	summonResultDiv.innerHTML = `<p>🎉 You got a <b>5⭐ ${item.name}</b> at <b>${pityCount}</b> pity!</p>`;
	summonResultDiv.style.display = "block";
    setTimeout(() => {
        summonResultDiv.style.display = "none";
    }, 5000);
}

function clearHistory(bannerType) {
	summonData[bannerType] = {
		pity: 0,
		lost50_50: false,
		history: [],
	};
	localStorage.setItem("summonData", JSON.stringify(summonData));
	updateHistoryDisplay(bannerType);
	updatePityCounter(bannerType);
}

function loadHistory() {
	banners.forEach((banner) => {
		console.log(`Updating history for banner type: ${banner.type}`);
		updateHistoryDisplay(banner.type);
		updatePityCounter(banner.type);
	});
}