(function () {
    const currentUrl = window.location.href;

    // Correct URL path
    const correctScreen = "screen=overview_villages";
    const correctMode = "mode=units";

    // Check if the current URL includes the correct screen and mode
    if (!currentUrl.includes(correctScreen) || !currentUrl.includes(correctMode)) {
        const villageId = new URLSearchParams(window.location.search).get("village") || "0";
        window.location.href = `/game.php?village=${villageId}&screen=overview_villages&mode=units`;
        return;
    }

    const table = document.getElementById("units_table");
    if (!table) {
        alert("Units table not found!");
        return;
    }

    const villages = [];
    const rows = table.querySelectorAll("tbody");

    // Extract data
    rows.forEach((row) => {
        const villageData = {};
        const headerRow = row.querySelector("tr td[rowspan]");

        const villageNameElem = headerRow.querySelector("a span.quickedit-label");
        villageData.name = villageNameElem ? villageNameElem.textContent.trim() : "Unknown Village";
        villageData.link = headerRow.querySelector("a").href;

        const unitRows = row.querySelectorAll("tr");
        const troopCategories = ["own", "in_village", "outside", "transit", "total"];
        villageData.units = {};

        unitRows.forEach((unitRow, index) => {
            const category = troopCategories[index];
            const unitItems = Array.from(unitRow.querySelectorAll(".unit-item"));
            const units = {};

            unitItems.forEach((unit, unitIndex) => {
                const imgElement = table.querySelector(`thead th:nth-child(${unitIndex + 3}) img`);
                if (imgElement) {
                    const unitType = imgElement.src.split("/").pop().split(".")[0];
                    const unitValue = unit.classList.contains("hidden")
                        ? 0
                        : parseInt(unit.innerText.trim(), 10);
                    units[unitType] = {
                        count: unitValue,
                        imgUrl: imgElement.src,
                        label: imgElement.getAttribute("data-title"),
                    };
                }
            });

            villageData.units[category] = units;
        });

        villages.push(villageData);
    });

    const defensiveUnits = ["unit_heavy", "unit_catapult", "unit_spear", "unit_sword", "unit_spy", "unit_archer"];
    const offensiveUnits = ["unit_light", "unit_axe", "unit_ram", "unit_marcher"];

    const totals = { defensive: {}, offensive: {} };

    // Function to calculate totals for a specific category
    function calculateTotals(category) {
        const result = { defensive: {}, offensive: {} };
        villages.forEach((village) => {
            const units = village.units[category];
            Object.keys(units).forEach((unitType) => {
                const unit = units[unitType];

                if (defensiveUnits.includes(unitType)) {
                    if (!result.defensive[unitType]) {
                        result.defensive[unitType] = {
                            count: 0,
                            imgUrl: unit.imgUrl,
                            label: unit.label,
                        };
                    }
                    result.defensive[unitType].count += unit.count;
                }

                if (offensiveUnits.includes(unitType)) {
                    if (!result.offensive[unitType]) {
                        result.offensive[unitType] = {
                            count: 0,
                            imgUrl: unit.imgUrl,
                            label: unit.label,
                        };
                    }
                    result.offensive[unitType].count += unit.count;
                }
            });
        });
        return result;
    }

    let currentCategory = "own"; // Default category is "Available Units"
    const totalsForDisplay = calculateTotals(currentCategory);

    // Function to format data for copying
    function formatForCopying(totals) {
        return Object.keys(totals)
            .map(
                (category) =>
                    `${category.toUpperCase()}:\n` +
                    Object.values(totals[category])
                        .map((unit) => `${unit.label}: ${unit.count}`)
                        .join("\n")
            )
            .join("\n\n");
    }

    // Create floating div container
    const container = document.createElement("div");
    container.id = "troop-overlay";
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.backgroundColor = "#f4e4bc";
    container.style.border = "1px solid #ccc";
    container.style.padding = "20px";
    container.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    container.style.zIndex = "10000";
    container.style.borderRadius = "8px";
    container.style.textAlign = "center";
    container.style.width = "80%";
    container.style.maxWidth = "900px";
    container.style.fontFamily = "Verdana";
    container.style.color = "#603000";
    container.style.overflowY = "auto";
    container.style.maxHeight = "80vh";

    // Add title
    const title = document.createElement("h2");
    title.textContent = "Available Units";
    title.style.marginBottom = "20px";
    container.appendChild(title);

    // Wrapper for troop sections
    const troopSections = document.createElement("div");
    troopSections.style.display = "flex";
    troopSections.style.flexWrap = "wrap";
    troopSections.style.justifyContent = "space-around";

    function createTroopSection(title, units) {
        const section = document.createElement("div");
        section.style.marginBottom = "15px";
        section.style.width = "45%";

        const header = document.createElement("h3");
        header.textContent = title;
        header.style.marginBottom = "10px";
        section.appendChild(header);

        const troopContainer = document.createElement("div");
        troopContainer.style.display = "grid";
        troopContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(100px, 1fr))";
        troopContainer.style.gap = "10px";

        Object.keys(units).forEach((unitType) => {
            const unit = units[unitType];

            const troopDiv = document.createElement("div");
            troopDiv.style.display = "flex";
            troopDiv.style.flexDirection = "column";
            troopDiv.style.alignItems = "center";

            const img = document.createElement("img");
            img.src = unit.imgUrl;
            img.alt = unit.label;
            img.style.width = "40px";
            img.style.height = "40px";

            const count = document.createElement("span");
            count.textContent = unit.count;
            count.style.marginTop = "5px";
            count.style.fontWeight = "bold";

            troopDiv.appendChild(img);
            troopDiv.appendChild(count);
            troopContainer.appendChild(troopDiv);
        });

        section.appendChild(troopContainer);
        return section;
    }

    function updateTroopSections() {
        troopSections.innerHTML = "";
        const totals = calculateTotals(currentCategory);
        troopSections.appendChild(createTroopSection("Defensive Units", totals.defensive));
        troopSections.appendChild(createTroopSection("Offensive Units", totals.offensive));
    }

    updateTroopSections();
    container.appendChild(troopSections);

    // Checkbox to switch between categories
    const categoryCheckboxContainer = document.createElement("div");
    categoryCheckboxContainer.style.marginTop = "20px";

    const categoryCheckbox = document.createElement("input");
    categoryCheckbox.type = "checkbox";
    categoryCheckbox.id = "switch-category";
    categoryCheckbox.style.marginRight = "10px";

    const categoryCheckboxLabel = document.createElement("label");
    categoryCheckboxLabel.htmlFor = "switch-category";
    categoryCheckboxLabel.textContent = "Show Total Troops";

    categoryCheckbox.addEventListener("change", () => {
        currentCategory = categoryCheckbox.checked ? "total" : "own";
        title.textContent = categoryCheckbox.checked ? "Total Troops" : "Available Units";
        updateTroopSections();
    });

    categoryCheckboxContainer.appendChild(categoryCheckbox);
    categoryCheckboxContainer.appendChild(categoryCheckboxLabel);
    container.appendChild(categoryCheckboxContainer);

    // Add Copy and Close buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "20px";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    copyButton.onclick = () => {
        navigator.clipboard.writeText(formatForCopying(calculateTotals(currentCategory)));
        copyButton.textContent = "Copied!";
        setTimeout(() => {
            copyButton.textContent = "Copy";
        }, 2000);
    };

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.onclick = () => {
        container.remove();
    };

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);
    container.appendChild(buttonContainer);

    document.body.appendChild(container);
})();
