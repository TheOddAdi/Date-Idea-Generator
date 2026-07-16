import { loadData, saveData } from "./storage.js";
import { generateDate } from "./generator.js";

const generateBtn = document.getElementById("generateBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const result = document.getElementById("result");
const budgetFilter = document.getElementById("budgetFilter");
const locationButtons = document.querySelectorAll(".toggle-btn");
const manageBtn = document.getElementById("manageBtn");
const manageModal = document.getElementById("manageModal");
const closeManageModalButton = document.getElementById("closeManageModal");
const tabButtons = document.querySelectorAll(".tab-btn");
const addItemBtn = document.getElementById("addItemBtn");
const itemName = document.getElementById("itemName");
const itemBudget = document.getElementById("itemBudget");
const itemLocation = document.getElementById("itemLocation");
const manageList = document.getElementById("manageList");

let data = {};
let activeCategory = "restaurants";
let lastGenerated = {};
let selectedLocation = "";

async function init() {
    data = await loadData();
    renderManageList();
}

function renderResult(date) {
    if (!date || !date.restaurant || !date.activity || !date.dessert) {
        result.innerHTML = '<p class="small">No matching ideas yet. Try widening your filters or add a few options.</p>';
        return;
    }

    result.innerHTML = `
        <div class="result-card">
            <h2>🍽 Restaurant</h2>
            <p>${date.restaurant.name}</p>
            <p class="small">${date.restaurant.location || ""}</p>
        </div>
        <div class="result-card">
            <h2>🎯 Activity</h2>
            <p>${date.activity.name}</p>
            <p class="small">${date.activity.location || ""}</p>
        </div>
        <div class="result-card">
            <h2>🍨 Dessert</h2>
            <p>${date.dessert.name}</p>
            <p class="small">${date.dessert.location || ""}</p>
        </div>
    `;
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

function renderManageList() {
    const items = sortItems(data[activeCategory] || []);

    if (items.length === 0) {
        manageList.innerHTML = '<li class="small">No saved ideas yet.</li>';
        return;
    }

    manageList.innerHTML = items
        .map((item) => `
            <li>
                <div>
                    <strong>${item.name}</strong>
                    <div class="small">${item.location || "No location"} • ${item.budget || "mid"}</div>
                </div>
                <button class="icon-btn" data-category="${activeCategory}" data-name="${item.name}">Remove</button>
            </li>
        `)
        .join("");
}

function setActiveTab(category) {
    activeCategory = category;

    tabButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === category);
    });

    renderManageList();
}

function openManageModal() {
    manageModal.classList.remove("hidden");
}

function hideManageModal() {
    manageModal.classList.add("hidden");
}

function addItem() {
    const name = itemName.value.trim();
    if (!name) {
        return;
    }

    const newItem = {
        name,
        budget: itemBudget.value,
        location: itemLocation.value.trim()
    };

    if (!data[activeCategory]) {
        data[activeCategory] = [];
    }

    data[activeCategory].push(newItem);
    saveData(data);
    renderManageList();
    itemName.value = "";
    itemLocation.value = "";
}

function removeItem(category, name) {
    if (!data[category]) {
        return;
    }

    data[category] = data[category].filter((item) => item.name !== name);
    saveData(data);
    renderManageList();
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

    const filters = {
        budget: budgetFilter.value,
        location: selectedLocation
    };

    const date = generateDate(data, filters, lastGenerated);
    renderResult(date);
    lastGenerated = date;
});

clearFiltersBtn.addEventListener("click", () => {
    budgetFilter.value = "";
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

addItemBtn.addEventListener("click", addItem);

manageList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) {
        return;
    }

    removeItem(button.dataset.category, button.dataset.name);
});

init();
setActiveTab(activeCategory);
setLocationSelection(selectedLocation);