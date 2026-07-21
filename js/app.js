import { loadData, saveData } from "./storage.js";
import { generateDate } from "./generator.js";

const generateBtn = document.getElementById("generateBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const result = document.getElementById("result");
const budgetFilter = document.getElementById("budgetFilter");
const durationFilter = document.getElementById("durationFilter");
const settingFilter = document.getElementById("settingFilter");
const locationButtons = document.querySelectorAll(".toggle-btn");
const manageBtn = document.getElementById("manageBtn");
const manageModal = document.getElementById("manageModal");
const closeManageModalButton = document.getElementById("closeManageModal");
const tabButtons = document.querySelectorAll(".tab-btn");
const addItemBtn = document.getElementById("addItemBtn");
const itemName = document.getElementById("itemName");
const itemBudget = document.getElementById("itemBudget");
const itemDuration = document.getElementById("itemDuration");
const itemSetting = document.getElementById("itemSetting");
const budgetField = document.getElementById("budgetField");
const durationField = document.getElementById("durationField");
const settingField = document.getElementById("settingField");
const locationField = document.getElementById("locationField");
const itemLocationButtons = document.querySelectorAll("[data-item-location]");
const manageList = document.getElementById("manageList");
const editStatus = document.getElementById("editStatus");
const dbSpinner = document.getElementById("dbSpinner");

function showSpinner(message = 'Saving…') {
    if (dbSpinner) {
        dbSpinner.textContent = message;
        dbSpinner.classList.remove('hidden');
    }
}

function hideSpinner() {
    if (dbSpinner) dbSpinner.classList.add('hidden');
}

let data = {};
let activeCategory = "restaurants";
let lastGenerated = {};
let selectedLocation = "";
let selectedItemLocation = "";
let editingItem = null;

async function init() {
    data = await loadData();
    renderManageList();
}

function getCurrentFilters() {
    return {
        budget: budgetFilter.value,
        duration: durationFilter.value,
        setting: settingFilter ? settingFilter.value : "",
        location: selectedLocation
    };
}

function formatDetails(category, item) {
    const details = [];

    if (item?.location) {
        details.push(item.location);
    }

    if (category === "restaurant" && item?.budget) {
        details.push(`Budget: ${item.budget}`);
    }

    if (category === "activity" && item?.budget) {
        details.push(`Budget: ${item.budget}`);
    }

    if (category === "activity" && item?.duration) {
        details.push(`Duration: ${item.duration}`);
    }
    if (category === "activity" && item?.setting) {
        details.push(`Setting: ${item.setting}`);
    }

    if (category === "dessert" && item?.budget) {
        details.push(`Budget: ${item.budget}`);
    }

    return details.join(" • ");
}

function createResultCard(category, item, index = 0) {
    const labels = {
        restaurant: { title: "🍽 Restaurant", label: "Regenerate restaurant" },
        activity: { title: "🎯 Activity", label: "Regenerate activity" },
        dessert: { title: "🍨 Dessert", label: "Regenerate dessert" }
    };

    const { title, label } = labels[category] || labels.restaurant;

    return `
        <div class="result-card" data-category="${category}" style="--i:${index}">
            <div class="result-header">
                <h2>${title}</h2>
                <button class="icon-btn refresh-btn" data-category="${category}" type="button" aria-label="${label}">↻</button>
            </div>
            <p>${item?.name || ""}</p>
            <p class="small">${formatDetails(category, item)}</p>
        </div>
    `;
}

function renderResult(date, refreshedCategory = null) {
    if (!date || !date.restaurant || !date.activity || !date.dessert) {
        result.innerHTML = '<p class="small">No matching ideas yet. Try widening your filters or add a few options.</p>';
        return;
    }

    if (refreshedCategory) {
        const card = result.querySelector(`[data-category="${refreshedCategory}"]`);
        const item = date[refreshedCategory === "restaurant" ? "restaurant" : refreshedCategory === "activity" ? "activity" : "dessert"];

        if (card && item) {
            card.innerHTML = `
                <div class="result-header">
                    <h2>${refreshedCategory === "restaurant" ? "🍽 Restaurant" : refreshedCategory === "activity" ? "🎯 Activity" : "🍨 Dessert"}</h2>
                    <button class="icon-btn refresh-btn" data-category="${refreshedCategory}" type="button" aria-label="Regenerate ${refreshedCategory}">↻</button>
                </div>
                <p>${item.name}</p>
                <p class="small">${formatDetails(refreshedCategory, item)}</p>
            `;
            card.classList.remove("is-refreshing");
            void card.offsetWidth;
            card.classList.add("is-refreshing");
        }
        return;
    }

    result.innerHTML = [
        createResultCard("restaurant", date.restaurant, 0),
        createResultCard("activity", date.activity, 1),
        createResultCard("dessert", date.dessert, 2)
    ].join("");
}

function refreshCategory(category) {
    if (!selectedLocation) {
        result.innerHTML = '<p class="small">Please select Cincinnati or Columbus before regenerating.</p>';
        return;
    }

    const filters = getCurrentFilters();
    const nextDate = { ...lastGenerated };

    if (category === "restaurant") {
        nextDate.restaurant = generateDate(data, filters, nextDate).restaurant;
    } else if (category === "activity") {
        nextDate.activity = generateDate(data, filters, nextDate).activity;
    } else if (category === "dessert") {
        nextDate.dessert = generateDate(data, filters, nextDate).dessert;
    }

    lastGenerated = nextDate;
    renderResult(nextDate, category);
}

function sortItems(items) {
    return [...items].sort((a, b) => {
        const locationA = (a.location || "").toLowerCase();
        const locationB = (b.location || "").toLowerCase();

        if (locationA !== locationB) {
            return locationA.localeCompare(locationB);
        }

        return (a.name || "").localeCompare(b.name || "");
    });
}

function isActivityCategory() {
    return activeCategory === "activities";
}

function isDessertCategory() {
    return activeCategory === "desserts";
}

function updateFormFields() {
    budgetField.classList.toggle("field-hidden", isDessertCategory());
    durationField.classList.toggle("field-hidden", !isActivityCategory());
    settingField.classList.toggle("field-hidden", !isActivityCategory());
    locationField.classList.toggle("field-hidden", isDessertCategory());

    if (isDessertCategory()) {
        itemBudget.value = "";
        itemDuration.value = "";
        if (itemSetting) itemSetting.value = "";
    } else {
        if (!itemBudget.value) {
            itemBudget.value = "$$";
        }

        if (!isActivityCategory()) {
            itemDuration.value = "";
        } else if (!itemDuration.value) {
            itemDuration.value = "1-2hrs";
        }
    }
}

function renderManageList() {
    const items = sortItems(data[activeCategory] || []);

    if (items.length === 0) {
        manageList.innerHTML = '<li class="small">No saved ideas yet.</li>';
        return;
    }

    manageList.innerHTML = items
        .map((item) => {
            const details = [];

            if (isDessertCategory()) {
                if (item.location) {
                    details.push(item.location);
                }
            } else {
                details.push(item.location || "No location");

                if (item.budget) {
                    details.push(item.budget);
                }

                if (isActivityCategory() && item.duration) {
                    details.push(item.duration);
                }
                if (isActivityCategory() && item.setting) {
                    details.push(item.setting);
                }
            }

            return `
                <li>
                    <div>
                        <strong>${item.name}</strong>
                        <div class="small">${details.join(" • ")}</div>
                    </div>
                    <div class="actions-inline">
                        <button class="icon-btn" data-category="${activeCategory}" data-name="${item.name}">Edit</button>
                        <button class="icon-btn" data-category="${activeCategory}" data-name="${item.name}">Remove</button>
                    </div>
                </li>
            `;
        })
        .join("");
}

function setActiveTab(category) {
    activeCategory = category;

    tabButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === category);
    });

    updateFormFields();
    renderManageList();
}

function openManageModal() {
    manageModal.classList.remove('hidden', 'closing');
}

function hideManageModal() {
    manageModal.classList.add('closing');
    manageModal.addEventListener('animationend', () => {
        manageModal.classList.add('hidden');
        manageModal.classList.remove('closing');
    }, { once: true });
}

function resetEditor() {
    editingItem = null;
    itemName.value = "";
    itemBudget.value = isDessertCategory() ? "" : "$$";
    itemDuration.value = isActivityCategory() ? "1-2hrs" : "";
    setItemLocationSelection("");
    if (itemSetting) itemSetting.value = "";
    addItemBtn.textContent = "Add idea";
    editStatus.textContent = "";
}

async function addItem() {
    const name = itemName.value.trim();
    if (!name) {
        return;
    }

    const itemData = {
        name
    };

    if (!isDessertCategory() && selectedItemLocation) {
        itemData.location = selectedItemLocation;
    }

    if (!isDessertCategory() && itemBudget.value) {
        itemData.budget = itemBudget.value;
    }

    if (isActivityCategory() && itemDuration.value) {
        itemData.duration = itemDuration.value;
    }
    if (isActivityCategory() && itemSetting && itemSetting.value) {
        itemData.setting = itemSetting.value;
    }

    if (!data[activeCategory]) {
        data[activeCategory] = [];
    }

    if (editingItem) {
        const index = data[activeCategory].findIndex((item) => item.name === editingItem.name && item.location === editingItem.location && item.budget === editingItem.budget);
        if (index >= 0) {
            data[activeCategory][index] = { ...data[activeCategory][index], ...itemData };
        }
    } else {
        data[activeCategory].push(itemData);
    }

    addItemBtn.disabled = true;
    showSpinner('Saving…');
    try {
        await saveData(data);
        renderManageList();
        resetEditor();
    } catch (err) {
        console.error('Save failed', err);
        editStatus.textContent = 'Save failed. See console.';
    } finally {
        addItemBtn.disabled = false;
        hideSpinner();
    }
}

async function removeItem(category, name) {
    if (!data[category]) {
        return;
    }

    data[category] = data[category].filter((item) => item.name !== name);
    showSpinner('Removing…');
    try {
        await saveData(data);
        renderManageList();
    } catch (err) {
        console.error('Remove failed', err);
        // revert in-memory change by reloading from DB
        try {
            data = await loadData();
            renderManageList();
        } catch (e) {
            console.error('Failed to reload data after failed remove', e);
        }
    } finally {
        hideSpinner();
    }
}

function editItem(category, name) {
    if (!data[category]) {
        return;
    }

    const item = data[category].find((entry) => entry.name === name);
    if (!item) {
        return;
    }

    editingItem = item;
    itemName.value = item.name;
    itemBudget.value = isDessertCategory() ? (item.budget || "") : (item.budget || "$$");
    itemDuration.value = isActivityCategory() ? (item.duration || "1-2hrs") : "";
    if (itemSetting) itemSetting.value = isActivityCategory() ? (item.setting || "") : "";
    setItemLocationSelection(isDessertCategory() ? "" : (item.location || ""));
    addItemBtn.textContent = "Save changes";
    editStatus.textContent = `Editing ${item.name}`;
    openManageModal();
}

function setItemLocationSelection(location) {
    selectedItemLocation = location;

    itemLocationButtons.forEach((button) => {
        const isActive = button.dataset.itemLocation === location;
        button.classList.toggle("active", isActive);
    });
}

function setLocationSelection(location) {
    selectedLocation = location;

    locationButtons.forEach((button) => {
        const isActive = button.dataset.location === location;
        button.classList.toggle("active", isActive);
    });
}

generateBtn.addEventListener("click", () => {
    if (!selectedLocation) {
        result.innerHTML = '<p class="small">Please select Cincinnati or Columbus before generating.</p>';
        return;
    }

    const filters = getCurrentFilters();
    const date = generateDate(data, filters, lastGenerated);
    renderResult(date);
    lastGenerated = date;
});

clearFiltersBtn.addEventListener("click", () => {
    budgetFilter.value = "";
    durationFilter.value = "";
    if (settingFilter) settingFilter.value = "";
    setLocationSelection("");
});

manageBtn.addEventListener("click", openManageModal);
closeManageModalButton.addEventListener("click", hideManageModal);

manageModal.addEventListener("click", (event) => {
    if (event.target === manageModal) {
        hideManageModal();
    }
});

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setActiveTab(button.dataset.tab);
    });
});

locationButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const nextLocation = button.dataset.location === selectedLocation ? "" : button.dataset.location;
        setLocationSelection(nextLocation);
    });
});

itemLocationButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const nextLocation = button.dataset.itemLocation === selectedItemLocation ? "" : button.dataset.itemLocation;
        setItemLocationSelection(nextLocation);
    });
});

addItemBtn.addEventListener("click", addItem);

manageList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) {
        return;
    }

    const { category, name } = button.dataset;
    const action = button.textContent.trim().toLowerCase();

    if (action === "edit") {
        editItem(category, name);
    } else {
        await removeItem(category, name);
    }
});

result.addEventListener("click", (event) => {
    const button = event.target.closest(".refresh-btn");
    if (!button) {
        return;
    }

    refreshCategory(button.dataset.category);
});

init();
setActiveTab(activeCategory);
setLocationSelection(selectedLocation);
setItemLocationSelection(selectedItemLocation);