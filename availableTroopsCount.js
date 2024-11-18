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
            if (category !== "own") return;

            const unitItems = Array.from(unitRow.querySelectorAll(".unit-item"));
            const units = {};

            unitItems.forEach((unit, unitIndex) => {
                const imgElement = table.querySelector(`thead th:nth-child(${unitIndex + 3}) img`);
                if (imgElement) {
                    const unitType = imgElement.src.split("/").pop().split(".")[0];
                    const unitValue = unit.classList.contains("hidden") ? 0 : parseInt(unit.innerText.trim(), 10);
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

    // Unit categories
    const defensiveUnits = ["unit_heavy", "unit_catapult", "unit_spear", "unit_sword", "unit_spy", "unit_archer"];
    const offensiveUnits = ["unit_light", "unit_axe", "unit_ram", "unit_marcher"];

    const totals = { defensive: {}, offensive: {} };

    villages.forEach((village) => {
        const ownUnits = village.units.own;
        Object.keys(ownUnits).forEach((unitType) => {
            const unit = ownUnits[unitType];

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
    Object.assign(container.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "#f4e4bc",
        border: "1px solid #ccc",
        padding: "20px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        zIndex: "10000",
        borderRadius: "8px",
        textAlign: "center",
        width: "80%",
        maxWidth: "900px",
        fontFamily: "Verdana",
        color: "#603000",
        overflowY: "auto",
        maxHeight: "80vh",
    });

    // Add title
    const title = document.createElement("h2");
    title.textContent = "Available Units";
    title.style.marginBottom = "20px";
    container.appendChild(title);

    // Add defensive and offensive summaries
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

    troopSections.appendChild(createTroopSection("Defensive Units", totals.defensive));
    troopSections.appendChild(createTroopSection("Offensive Units", totals.offensive));
    container.appendChild(troopSections);

    // Checkbox for village troop overview
    const checkboxContainer = document.createElement("div");
    checkboxContainer.style.marginTop = "20px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "show-overview";
    checkbox.style.marginRight = "10px";

    const checkboxLabel = document.createElement("label");
    checkboxLabel.htmlFor = "show-overview";
    checkboxLabel.textContent = "Show Village Troop Overview";

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkboxLabel);
    container.appendChild(checkboxContainer);

    const villageOverview = document.createElement("div");
    villageOverview.style.marginTop = "20px";
    villageOverview.style.textAlign = "left";
    villageOverview.style.display = "none";

    const overviewTable = document.createElement("table");
    overviewTable.style.width = "100%";
    overviewTable.style.borderCollapse = "collapse";

    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th")); // Empty cell for village names
    Object.keys(villages[0].units.own).forEach((unitType) => {
        const th = document.createElement("th");
        const img = document.createElement("img");
        img.src = villages[0].units.own[unitType].imgUrl;
        img.alt = unitType;
        img.style.width = "20px";
        th.appendChild(img);
        headerRow.appendChild(th);
    });
    overviewTable.appendChild(headerRow);

    villages.forEach((village) => {
        const row = document.createElement("tr");
        const villageCell = document.createElement("td");
        const link = document.createElement("a");
        link.href = village.link;
        link.textContent = village.name;
        villageCell.appendChild(link);
        row.appendChild(villageCell);

        Object.keys(village.units.own).forEach((unitType) => {
            const cell = document.createElement("td");
            cell.textContent = village.units.own[unitType].count;
            row.appendChild(cell);
        });
        overviewTable.appendChild(row);
    });

    villageOverview.appendChild(overviewTable);
    container.appendChild(villageOverview);

    checkbox.addEventListener("change", () => {
        villageOverview.style.display = checkbox.checked ? "block" : "none";
    });

    // Copy and Close buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.marginTop = "20px";

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy Summary";
    copyButton.onclick = () => {
        navigator.clipboard.writeText(formatForCopying(totals));
        alert("Summary copied to clipboard!");
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
