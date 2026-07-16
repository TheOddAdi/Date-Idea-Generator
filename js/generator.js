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

export function getFilteredItems(items, filters = {}) {
    const budget = (filters.budget || "").toLowerCase();
    const location = (filters.location || "").trim().toLowerCase();

    return (items || []).filter((item) => {
        const matchesBudget = !budget || (item.budget || "mid").toLowerCase() === budget;
        const matchesLocation = !location || (item.location || "").toLowerCase() === location;

        return matchesBudget && matchesLocation;
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