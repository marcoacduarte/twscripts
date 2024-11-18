(function () {
    const currentUrl = window.location.href;

    // Correct URL path
    const correctScreen = "screen=overview_villages";
    const correctMode = "mode=units";

    // Redirect if not on the correct page
    if (!currentUrl.includes(correctScreen) || !currentUrl.includes(correctMode)) {
        const villageId = new URLSearchParams(window.location.search).get("village") || "0";
        window.location.href = `/game.php?village=${villageId}&screen=overview_villages&mode=units`;
        return;
    }

    const table = document.getElementById('units_table');
    if (!table) {
        alert("Units table not found!");
        return;
    }

    const categories = Array.from(
        table.querySelectorAll('tbody > tr:nth-child(1) > td:not([rowspan])')
    ).map(td => td.textContent.trim().toLowerCase());

    const villages = [];
    const rows = table.querySelectorAll('tbody');

    // Extract data
    rows.forEach(row => {
        const villageData = {};
        const headerRow = row.querySelector('tr td[rowspan]');

        const villageNameElem = headerRow.querySelector('a span.quickedit-label');
        villageData.name = villageNameElem ? villageNameElem.textContent.trim() : 'Unknown Village';
        villageData.link = headerRow.querySelector('a').href;

        const unitRows = row.querySelectorAll('tr');
        villageData.units = {};

        unitRows.forEach((unitRow, index) => {
            const category = categories[index];

            const unitItems = Array.from(unitRow.querySelectorAll('.unit-item'));
            const units = {};

            unitItems.forEach((unit, unitIndex) => {
                const imgElement = table.querySelector(`thead th:nth-child(${unitIndex + 3}) img`);
                if (imgElement) {
                    const unitType = imgElement.src.split('/').pop().split('.')[0]; // Extract unit identifier without .png
                    const unitValue = unit.classList.contains('hidden') ? 0 : parseInt(unit.innerText.trim(), 10);
                    units[unitType] = {
                        count: unitValue,
                        imgUrl: imgElement.src,
                        label: imgElement.getAttribute('data-title'),
                    };
                }
            });

            villageData.units[category] = units;
        });

        villages.push(villageData);
    });

    const defensiveUnits = ["unit_heavy", "unit_catapult", "unit_spear", "unit_sword", "unit_spy", "unit_archer"];
    const offensiveUnits = ["unit_light", "unit_axe", "unit_ram", "unit_marcher"];

    let currentCategory = categories[0]; // Default filter

    function calculateTotals(category) {
        const totals = { defensive: {}, offensive: {} };

        villages.forEach(village => {
            const units = village.units[category];

            Object.keys(units).forEach(unitType => {
                const unit = units[unitType];

                if (defensiveUnits.includes(unitType)) {
                    if (!totals.defensive[unitType]) {
                        totals.defensive[unitType] = { count: 0, imgUrl: unit.imgUrl, label: unit.label };
                    }
                    totals.defensive[unitType].count += unit.count;
                }

                if (offensiveUnits.includes(unitType)) {
                    if (!totals.offensive[unitType]) {
                        totals.offensive[unitType] = { count: 0, imgUrl: unit.imgUrl, label: unit.label };
                    }
                    totals.offensive[unitType].count += unit.count;
                }
            });
        });

        return totals;
    }

    function formatCopyContent(totals, category) {
        const totalContent = Object.keys(totals)
            .map(
                troopType =>
                    `**${troopType.toUpperCase()}**\n` +
                    Object.values(totals[troopType])
                        .map(unit => `${unit.label}: ${unit.count}`)
                        .join('\n')
            )
            .join('\n\n');

        const villageContent = villages
            .map(village => {
                const units = village.units[category];
                return `**${village.name}** (${category.toUpperCase()})\n` +
                    Object.values(units)
                        .map(unit => `${unit.label}: ${unit.count}`)
                        .join('\n');
            })
            .join('\n\n');

        return `${totalContent}\n\n---\n\n${villageContent}`;
    }

    function updateTroopSections() {
        troopSections.innerHTML = "";
        const totals = calculateTotals(currentCategory);
        troopSections.appendChild(createTroopSection("Defensive Units", totals.defensive));
        troopSections.appendChild(createTroopSection("Offensive Units", totals.offensive));
        updateVillageOverview(); // Update the table
    }

    function updateVillageOverview() {
        overviewTable.innerHTML = ""; // Clear previous content
        overviewTable.appendChild(overviewHeaderRow); // Add header row

        villages.forEach(village => {
            const row = document.createElement('tr');
            const villageCell = document.createElement('td');
            const villageLink = document.createElement('a');
            villageLink.href = village.link;
            villageLink.textContent = village.name;
            villageLink.style.textDecoration = 'none';
            villageLink.style.color = '#603000';
            villageCell.appendChild(villageLink);
            villageCell.style.border = '1px solid #603000';
            row.appendChild(villageCell);

            Object.keys(village.units[currentCategory]).forEach(unitType => {
                const unit = village.units[currentCategory][unitType];
                const cell = document.createElement('td');
                cell.style.border = '1px solid #603000';
                cell.style.textAlign = 'center';
                cell.textContent = unit.count;
                row.appendChild(cell);
            });

            overviewTable.appendChild(row);
        });
    }

    const container = document.createElement('div');
    container.id = 'troop-overlay';
    container.style = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background-color: #f4e4bc; border: 1px solid #ccc; padding: 20px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 10000;
        border-radius: 8px; text-align: center; width: 80%; max-width: 900px;
        font-family: Verdana; color: #603000; overflow-y: auto; max-height: 80vh;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Available Units';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';
    container.appendChild(title);

    const troopSections = document.createElement('div');
    troopSections.style.display = 'flex';
    troopSections.style.flexWrap = 'wrap';
    troopSections.style.justifyContent = 'space-around';

    container.appendChild(troopSections);

    const villageOverview = document.createElement('div');
    villageOverview.style.marginTop = '20px';
    villageOverview.style.textAlign = 'left';
    villageOverview.style.display = 'none'; // Initially hidden

    const overviewTable = document.createElement('table');
    overviewTable.style = `
        width: 100%; border-collapse: collapse; margin-top: 10px;
    `;

    const overviewHeaderRow = document.createElement('tr');
    const villageHeader = document.createElement('th');
    villageHeader.textContent = 'Village';
    villageHeader.style = `
        border: 1px solid #603000; text-align: center; font-weight: bold;
    `;
    overviewHeaderRow.appendChild(villageHeader);

    Object.keys(villages[0].units[currentCategory]).forEach(unitType => {
        const th = document.createElement('th');
        th.style = `
            border: 1px solid #603000; text-align: center;
        `;
        const img = document.createElement('img');
        img.src = villages[0].units[currentCategory][unitType].imgUrl;
        img.alt = unitType;
        img.style = `
            width: 20px; height: 20px;
        `;
        th.appendChild(img);
        overviewHeaderRow.appendChild(th);
    });

    overviewTable.appendChild(overviewHeaderRow);

    villageOverview.appendChild(overviewTable);
    container.appendChild(villageOverview);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.onclick = () => {
        const totals = calculateTotals(currentCategory);
        const copyContent = formatCopyContent(totals, currentCategory);
        navigator.clipboard.writeText(copyContent);
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy';
        }, 2000);
    };

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => {
        container.remove();
    };

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    container.appendChild(buttonContainer);

    document.body.appendChild(container);
})();
