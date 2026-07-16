const STORAGE_KEY = "dateGeneratorData";

export async function loadData() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (saved) {
        return JSON.parse(saved);
    }

    const response =
        await fetch(new URL("../data/data.json", import.meta.url));

    const data =
        await response.json();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

    return data;
}

export function saveData(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}