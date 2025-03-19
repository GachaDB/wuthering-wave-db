// Function to scrape and parse the data from the current page into JSON
function scrapeDataToJSON() {
    const doc = document; // Use the current document

    // Extract Name
    const nameElement = doc.querySelector('.mw-page-title-main');
    const name = nameElement ? nameElement.textContent.replace('/Backstory', '') : '';

    // Function to collect all paragraph siblings after a section header as an array
    function getParagraphsAfterHeader(headerId) {
        console.log(`Searching for header with ID: ${headerId}`);
    
        const headerElement = document.getElementById(headerId);
        if (!headerElement) {
            console.warn(`Header with ID '${headerId}' not found.`);
            return [];
        }
    
        // Find the closest heading (h2, h3, h4, etc.)
        const header = headerElement.closest("h1, h2, h3, h4, h5, h6");
        if (!header) {
            console.warn(`No heading (h1-h6) found for header ID '${headerId}'.`);
            return [];
        }
    
        console.log(`Found header:`, header);
    
        const paragraphs = [];
        let nextElement = header.nextElementSibling;
    
        // Collect all <p> elements until another heading (h1-h6) or different section appears
        while (nextElement && !nextElement.matches("h1, h2, h3, h4, h5, h6")) {
            if (nextElement.tagName === "P") {
                console.log(`Found paragraph: ${nextElement.textContent.trim()}`);
                paragraphs.push(nextElement.textContent.trim());
            }
            nextElement = nextElement.nextElementSibling;
        }
    
        console.log(`Collected paragraphs:`, paragraphs);
        return paragraphs;
    }
    
    

    // Extract Personality (with multiple paragraphs as array)
    const personality = getParagraphsAfterHeader('Personality');

    // Extract Appearance (with multiple paragraphs as array)
    const firstTry = getParagraphsAfterHeader('Appearance');
    console.log("First try result:", firstTry);

    if (!firstTry || firstTry.length === 0) {
        console.log(`First attempt failed. Trying '${name}'s_Appearance'`);
    }

    const secondTry = getParagraphsAfterHeader(`${name}'s_Appearance`);
    console.log("Second try result:", secondTry);

    const appearance = firstTry.length > 0 ? firstTry : secondTry;
    console.log("Final appearance result:", appearance);

    console.log(appearance)

    // Extract Archive
    const archive = {};
    const basicInfoSection = doc.querySelector('#Basic_Information')?.parentElement?.nextElementSibling;
    archive.basicInformation = basicInfoSection ? basicInfoSection.textContent.trim() : '';

    const forteReport = {};
    const resonancePowerTable = doc.querySelector('.article-table');
    forteReport.resonancePower = resonancePowerTable ? resonancePowerTable.querySelector('td')?.textContent.trim() : '';

    // Function to extract full content (including nested <p> tags) from a table cell
    function getTableCellContent(headerText) {
        const rows = Array.from(doc.querySelectorAll('.article-table tr'));
        const headerRow = rows.find(row => row.querySelector('th')?.textContent.trim() === headerText);
        if (!headerRow) return '';
        const td = headerRow.nextElementSibling?.querySelector('td');
        if (!td) return '';
        const paragraphs = Array.from(td.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0);
        return paragraphs.join('\n\n');
    }

    forteReport.resonanceEvaluationReport = getTableCellContent('Resonance Evaluation Report');
    forteReport.overclockDiagnosticReport = getTableCellContent('Overclock Diagnostic Report');
    archive.forteExaminationReport = forteReport;

    // Extract Character Stories
    const characterStories = [];
    const charStoriesHeading = doc.querySelector('h2 span#Character_Stories')?.closest('h2');
    const cherishedItemsHeading = doc.querySelector('h2 span#Cherished_Items')?.closest('h2');

    if (charStoriesHeading && cherishedItemsHeading) {
        let nextElement = charStoriesHeading.nextElementSibling;
        while (nextElement && nextElement !== cherishedItemsHeading) {
            if (nextElement.matches('table.article-table')) {
                const rows = Array.from(nextElement.querySelectorAll('tr'));
                for (let i = 0; i < rows.length; i += 2) {
                    const headerRow = rows[i];
                    const contentRow = rows[i + 1];

                    if (headerRow && contentRow) {
                        const title = headerRow.querySelector('th')?.textContent.trim();
                        const unlockReq = headerRow.querySelector('th:nth-child(2) small i')?.textContent.trim();
                        const contentTd = contentRow.querySelector('td');

                        if (title && contentTd) {
                            const paragraphs = Array.from(contentTd.querySelectorAll('p'))
                                .map(p => p.textContent.trim())
                                .filter(text => text.length > 0);

                            characterStories.push({
                                title,
                                unlockRequirement: unlockReq || '',
                                content: paragraphs // Array of paragraphs
                            });
                        }
                    }
                }
            }
            nextElement = nextElement.nextElementSibling;
        }
    }

    // Extract Cherished Items
    const cherishedItems = [];
    if (cherishedItemsHeading) {
        let nextElement = cherishedItemsHeading.nextElementSibling;
        while (nextElement && !nextElement.matches('h2')) {
            if (nextElement.matches('table.article-table')) {
                const rows = Array.from(nextElement.querySelectorAll('tr'));
                rows.forEach(row => {
                    const imgElement = row.querySelector('img');
                    const imgSrc = imgElement ? imgElement.getAttribute('src') : '';

                    const descriptionCell = row.querySelector('td[colspan="2"]');
                    const description = descriptionCell ? descriptionCell.textContent.trim() : '';

                    if (imgSrc && description) {
                        cherishedItems.push({
                            image: imgSrc,
                            content: description
                        });
                    }
                });
            }
            nextElement = nextElement.nextElementSibling;
        }
    }

    // Extract Quests, Companion Quests and Events
    const questsAndEvents = {
        mainQuests: [],
        companionQuests: [],
        events: []
    };
    const questsEventsHeading = doc.querySelector('h2 span#Quests_and_Events')?.closest('h2');
    const characterTrialsHeading = doc.querySelector('h2 span#Character_Trials')?.closest('h2');
    const characterMentionsHeading = doc.querySelector('h2 span#Character_Mentions')?.closest('h2');

    if (questsEventsHeading) {
        const endHeading = characterTrialsHeading || characterMentionsHeading;
        let mainQuestsHeading = null;
        let companionQuestsHeading = [];
        let eventsHeading = null;
        let nextElement = questsEventsHeading.nextElementSibling;

        // Find Main Quests and Events headings
        while (nextElement && nextElement !== endHeading) {
            if (nextElement.matches('h3') && nextElement.querySelector('span#Main_Quests')) {
                mainQuestsHeading = nextElement;
            } else if (nextElement.matches('h3') && nextElement.querySelector('span#Events')) {
                eventsHeading = nextElement;
            } else if (nextElement.matches('h3') && nextElement.querySelector('span#Companion_Stories')) {
                companionQuestsHeading = nextElement;
            }
            nextElement = nextElement.nextElementSibling;
        }

        // Function to extract nested list items
        function extractNestedListItems(ulElement) {
            const items = [];
            const listItems = Array.from(ulElement.querySelectorAll(':scope > li'));
            listItems.forEach(li => {
                const link = li.querySelector('a');
                const title = link ? link.textContent.trim() : li.textContent.trim();
                const href = link ? link.href : '';
                const subUl = li.querySelector('ul');
                const subItems = subUl ? extractNestedListItems(subUl) : [];
                
                items.push({
                    title,
                    link: href,
                    subItems: subItems.length > 0 ? subItems : undefined
                });
            });
            return items;
        }

        // Extract Main Quests
        if (mainQuestsHeading) {
            let nextElement = mainQuestsHeading.nextElementSibling;
            while (nextElement && nextElement !== eventsHeading && nextElement !== endHeading) {
                if (nextElement.matches('ul')) {
                    questsAndEvents.mainQuests = extractNestedListItems(nextElement);
                    break; // Only process the first <ul> after Main_Quests
                }
                nextElement = nextElement.nextElementSibling;
            }
        }

        // Extract Events
        if (eventsHeading) {
            let nextElement = eventsHeading.nextElementSibling;
            while (nextElement && nextElement !== endHeading) {
                if (nextElement.matches('ul')) {
                    questsAndEvents.events = extractNestedListItems(nextElement);
                    break; // Only process the first <ul> after Events
                }
                nextElement = nextElement.nextElementSibling;
            }
        }

        // Extract Companion Quests
        if (companionQuestsHeading) {
            let nextElement = companionQuestsHeading.nextElementSibling;
            while (nextElement && nextElement !== endHeading) {
                if (nextElement.matches('ul')) {
                    questsAndEvents.companionQuests = extractNestedListItems(nextElement);
                    break; // Only process the first <ul> after Events
                }
                nextElement = nextElement.nextElementSibling;
            }
        }
    }

    // Construct JSON object
    const jsonData = {
        name,
        personality,
        appearance,
        archive,
        characterStories,
        cherishedItems,
        questsAndEvents
    };

    return jsonData;
}

// Function to add JSON to localStorage with duplicate detection
function addToLocalStorage(jsonData) {
    const storageKey = 'scrapedData';
    let storedData = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Check for duplicate based on name
    const isDuplicate = storedData.some(item => item.name === jsonData.name);
    if (isDuplicate) {
        console.log(`Duplicate detected: "${jsonData.name}" already exists in localStorage. Skipping...`);
        return false;
    }

    storedData.push(jsonData);
    localStorage.setItem(storageKey, JSON.stringify(storedData));
    console.log(`Added "${jsonData.name}" to localStorage.`);
    return true;
}

// Function to clear localStorage
function clearLocalStorage() {
    const storageKey = 'scrapedData';
    localStorage.removeItem(storageKey);
    console.log('LocalStorage cleared.');
}

// Function to remove an item from localStorage by name
function removeFromLocalStorage(name) {
    const storageKey = 'scrapedData';
    let storedData = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    const initialLength = storedData.length;
    storedData = storedData.filter(item => item.name !== name);
    
    if (storedData.length === initialLength) {
        console.log(`No item found with name "${name}" in localStorage.`);
        return false;
    }

    localStorage.setItem(storageKey, JSON.stringify(storedData));
    console.log(`Removed "${name}" from localStorage.`);
    return true;
}

// Function to download localStorage data as JSON file
function downloadLocalStorageAsJSON() {
    const storageKey = 'scrapedData';
    const storedData = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    if (storedData.length === 0) {
        console.log('No data in localStorage to download.');
        return;
    }

    const jsonString = JSON.stringify(storedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scrapedData.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('Downloaded localStorage data as scrapedData.json');
}

// Execute the script
const jsonData = scrapeDataToJSON();
console.log(JSON.stringify(jsonData, null, 2));

// Add to localStorage with duplicate detection
addToLocalStorage(jsonData);

// Example usage of additional functions (uncomment to test):
// clearLocalStorage();
// removeFromLocalStorage('Jinhsi');
// downloadLocalStorageAsJSON();