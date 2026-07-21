function randomItem(array) {

    if (!array || array.length === 0) {
        return null;
    }

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];
}

function pickDifferentItem(items, previousItem, fallbackItems = []) {
    const candidates = (items || []).filter((item) => item && item.name !== previousItem?.name);

    if (candidates.length > 0) {
        return randomItem(candidates);
    }

    const fallback = (items || []).length > 0 ? items : fallbackItems;
    return randomItem(fallback);
}

function budgetMatches(itemBudget, selectedBudget) {
    if (!selectedBudget) {
        return true;
    }

    const budgetRank = { "$": 1, "$$": 2, "$$$": 3 };
    const itemRank = budgetRank[itemBudget?.toLowerCase()] || 0;
    const selectedRank = budgetRank[selectedBudget.toLowerCase()] || 0;

    return itemRank > 0 && itemRank <= selectedRank;
}

function durationMatches(itemDuration, selectedDuration) {
    if (!selectedDuration) {
        return true;
    }

    const durationRank = {
        "under-1hr": 1,
        "1-2hrs": 2,
        "2plus-hrs": 3
    };

    const itemRank = durationRank[itemDuration?.toLowerCase()] || 0;
    const selectedRank = durationRank[selectedDuration.toLowerCase()] || 0;

    return itemRank > 0 && itemRank <= selectedRank;
}

export function getFilteredItems(items, filters = {}) {
    const budget = (filters.budget || "").toLowerCase();
    const location = (filters.location || "").trim().toLowerCase();
    const setting = (filters.setting || "").toLowerCase();
    const duration = (filters.duration || "").toLowerCase();

    return (items || []).filter((item) => {
        const normalizedBudget = (item.budget || "").toLowerCase();
        const normalizedDuration = (item.duration || "").toLowerCase();
        const hasBudget = Boolean(item.budget);
        const hasDuration = Boolean(item.duration);
        const matchesBudget = !budget || !hasBudget || budgetMatches(normalizedBudget, budget);
        const matchesDuration = !duration || !hasDuration || durationMatches(normalizedDuration, duration);
        const itemSetting = (item.setting || "").toLowerCase();
        const matchesSetting = !setting || !itemSetting || itemSetting === 'both' || itemSetting === setting;
        const itemLocation = (item.location || "").toLowerCase();
        const matchesLocation = !location || itemLocation === "both" || itemLocation === location || itemLocation === "";

        return matchesBudget && matchesDuration && matchesLocation && matchesSetting;
    });
}

export function generateDate(data, filters = {}, previousDate = {}) {

    const restaurants = getFilteredItems(data.restaurants, filters);
    const activities = getFilteredItems(data.activities, filters);
    const desserts = getFilteredItems(data.desserts, filters);

    return {

        restaurant:
            pickDifferentItem(
                restaurants.length > 0 ? restaurants : data.restaurants,
                previousDate.restaurant,
                data.restaurants
            ),

        activity:
            pickDifferentItem(
                activities.length > 0 ? activities : data.activities,
                previousDate.activity,
                data.activities
            ),

        dessert:
            pickDifferentItem(
                desserts.length > 0 ? desserts : data.desserts,
                previousDate.dessert,
                data.desserts
            )

    };
}