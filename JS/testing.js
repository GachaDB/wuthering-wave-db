// [Previous Local Storage Functions remain unchanged]

// Expose utility functions globally
window.clearLocalStorage = clearLocalStorage;
window.removeHeroFromLocalStorage = removeHeroFromLocalStorage;
window.downloadLocalStorageData = downloadLocalStorageData;

function scrapeCharacterData() {
    const characterData = {};

    // Helper function to safely get text content
    function getText(selector, errorMsg) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(errorMsg);
            return "not found";
        }
        return element.textContent.trim();
    }

    // Helper function to extract affiliations as an array of objects
    function getAffiliations(valueElement) {
        const links = valueElement.querySelectorAll('a');
        if (!links.length) return [{ name: "not found", link: "not found" }];
        return Array.from(links).map(link => ({
            name: link.textContent.trim(),
            link: link.href || "not found"
        }));
    }

    // Basic info
    characterData.name = getText('h2[data-source="name"]', 'Name element not found');
    characterData.title = getText('h2[data-item-name="secondary_title"]', 'Title element not found');

    if (characterData.name === "not found" || characterData.title === "not found") {
        console.error('Missing required basic info. Aborting scrape.');
        return null;
    }

    // Data from pi-item elements
    const dataItems = document.querySelectorAll('.wds-tab__content.wds-is-current .pi-item.pi-data');
    dataItems.forEach(item => {
        const labelElement = item.querySelector('.pi-data-label');
        const valueElement = item.querySelector('.pi-data-value');

        if (!labelElement || !valueElement) return;

        const label = labelElement.textContent.toLowerCase();
        const value = valueElement.textContent.trim();

        switch(label) {
            case 'class':
                characterData.class = value || "not found";
                break;
            case 'gender':
                characterData.gender = value || "not found";
                break;
            case 'birthday':
                characterData.birthday = value || "not found";
                break;
            case 'birthplace':
                characterData.birthplace = value.split(' ')[0] || "not found";
                break;
            case 'nation':
                characterData.nation = value.split(' ')[0] || "not found";
                break;
            case 'affiliations':
                characterData.affiliations = getAffiliations(valueElement);
                break;
            case 'release date':
                const dateMatch = value.match(/[A-Za-z]+\s\d{1,2},\s\d{4}/);
                characterData.release_date = dateMatch ? dateMatch[0] : (value.split('\n')[0] || "not found");
                break;
        }
    });

    // Special dish
    const dishName = getText('.pi-horizontal-group-item .card-text', 'Special dish name not found');
    const dishImage = document.querySelector('.pi-horizontal-group-item img');
    if (dishName !== "not found" && dishImage) {
        characterData.special_dish = {
            name: dishName,
            image_url: dishImage.src || "not found"
        };
    } else {
        characterData.special_dish = "not found";
    }

    // Voice actors
    characterData.voice_actors = {};
    const validLanguages = ['english', 'chinese', 'japanese', 'korean'];
    const allTabContents = document.querySelectorAll('.wds-tab__content');
    allTabContents.forEach(tab => {
        const voiceItems = tab.querySelectorAll('.pi-item.pi-data');
        voiceItems.forEach(item => {
            const langElement = item.querySelector('.pi-data-label');
            const valueElement = item.querySelector('.pi-data-value a');
            if (!langElement || !valueElement) return;

            const lang = langElement.textContent.toLowerCase();
            if (!validLanguages.includes(lang)) return;

            const name = valueElement.textContent.trim() || "not found";
            const link = valueElement.href || "not found";
            const nativeNameElement = item.querySelector('span[lang]');
            const nativeName = nativeNameElement ? ` (${nativeNameElement.textContent.trim()})` : "";
            characterData.voice_actors[lang] = {
                name: `${name}${nativeName}`,
                link: link
            };
        });
    });

    // Quotes
    characterData.quotes = Array.from(document.querySelectorAll('.pull-quote')).map(quote => {
        const textElement = quote.querySelector('.pull-quote__text');
        const sourceElement = quote.querySelector('.pull-quote__source');
        if (!textElement || !sourceElement) return null;

        const text = textElement.innerText.trim() || "not found";
        const source = sourceElement.textContent.trim() || "not found";
        const sourceLink = quote.querySelector('.pull-quote__source a')?.href || "not found";

        return {
            text: text.includes('\n') ? text.split('\n') : text,
            source,
            ...(sourceLink !== "not found" && { source_link: sourceLink })
        };
    }).filter(quote => quote !== null);

    // Element, Weapon, and Rarity (Button Modal)
    const weapons = ["Swords", "Broadblades", "Pistols", "Gauntlets", "Rectifiers"];
    const elements = [
        { name: "Fusion", color: "red" },
        { name: "Glacio", color: "blue" },
        { name: "Aero", color: "green" },
        { name: "Electro", color: "purple" },
        { name: "Spectro", color: "yellow" },
        { name: "Havoc", color: "darkred" }
    ];
    const rarities = [
        { name: "5*", color: "gold" },
        { name: "4*", color: "purple" }
    ];

    function createButtonModal(options, label, useColors = false) {
        return new Promise(resolve => {
            const modal = document.createElement("div");
            modal.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid black; z-index: 1000; text-align: center;";
            const title = document.createElement("p");
            title.textContent = `Select ${label}:`;
            title.style.marginBottom = "10px";
            modal.appendChild(title);

            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "flex";
            buttonContainer.style.flexWrap = "wrap";
            buttonContainer.style.gap = "10px";
            buttonContainer.style.justifyContent = "center";

            const notFoundButton = document.createElement("button");
            notFoundButton.textContent = "Not Found";
            notFoundButton.style.padding = "5px 10px";
            notFoundButton.onclick = () => {
                resolve("not found");
                document.body.removeChild(modal);
            };
            buttonContainer.appendChild(notFoundButton);

            options.forEach(option => {
                const button = document.createElement("button");
                const optionName = useColors ? option.name : option;
                button.textContent = optionName;
                button.style.padding = "5px 10px";
                if (useColors) {
                    button.style.backgroundColor = option.color;
                    button.style.color = "white";
                    button.style.border = "none";
                    button.style.borderRadius = "5px";
                }
                button.onclick = () => {
                    resolve(optionName);
                    document.body.removeChild(modal);
                };
                buttonContainer.appendChild(button);
            });

            modal.appendChild(buttonContainer);
            document.body.appendChild(modal);
        });
    }

    // Main execution with Promise
    return Promise.resolve()
        .then(() => createButtonModal(weapons, "weapon"))
        .then(weapon => {
            characterData.weapon = weapon;
            return createButtonModal(elements, "element", true);
        })
        .then(element => {
            characterData.element = element;
            return createButtonModal(rarities, "rarity", true);
        })
        .then(rarity => {
            characterData.rarity = rarity;

            // Official names by language
            characterData.official_names_by_language = {};
            const officialNameTable = document.querySelector('table.article-table.alternating-colors-table');
            if (officialNameTable) {
                const rows = officialNameTable.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const languageCell = row.querySelector('td:first-child');
                    const nameCell = row.querySelector('td:last-child');

                    if (!languageCell || !nameCell) return;

                    const language = languageCell.textContent.trim().replace(/\s+/g, ' ') || "not found";
                    const officialName = nameCell.textContent.trim() || "not found";

                    characterData.official_names_by_language[language] = officialName;
                });
            } else {
                characterData.official_names_by_language = "not found";
            }

            // Log and save
            console.log(JSON.stringify(characterData, null, 2));
            saveToLocalStorage(characterData);
        })
        .catch(error => console.error('Error during execution:', error));
}

// Run the scraper
scrapeCharacterData();