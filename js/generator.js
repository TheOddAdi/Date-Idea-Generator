function randomItem(array) {

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];
}

export function generateDate(data) {

    return {

        restaurant:
            randomItem(
                data.restaurants
            ),

        activity:
            randomItem(
                data.activities
            ),

        dessert:
            randomItem(
                data.desserts
            )

    };
}