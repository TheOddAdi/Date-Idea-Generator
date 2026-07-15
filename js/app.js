import { loadData }
    from "./storage.js";

import { generateDate }
    from "./generator.js";

const button =
    document.getElementById(
        "generateBtn"
    );

const result =
    document.getElementById(
        "result"
    );

const data =
    await loadData();

button.addEventListener(
    "click",
    () => {

        const date =
            generateDate(data);

        result.innerHTML = `
            <h2>🍽 Restaurant</h2>
            <p>${date.restaurant.name}</p>

            <h2>🎯 Activity</h2>
            <p>${date.activity.name}</p>

            <h2>🍨 Dessert</h2>
            <p>${date.dessert.name}</p>
        `;
    }
);