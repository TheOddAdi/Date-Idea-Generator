const STORAGE_KEY = "dateGeneratorData";

export async function loadData() {

    const saved =
        localStorage.getItem(STORAGE_KEY);

    if (saved) {
        return JSON.parse(saved);
    }

    const response =
        await fetch("../data/data.json");

    const data =
        await response.json();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

    return data;
}