//setting environmental variables
require('dotenv').config()

var requestOptions = {
    method: 'GET',
    headers: {
        'X-Public-Key': process.env.TOKEN,
        'X-currency': 'USD'
    }
};

async function getTheatreCategory() {
    var page = 1
    const response = await fetch("https://api-live.hellotickets.com/v1/categories", requestOptions)
    const data = await response.json()
    var category_id
    data.categories.map(category => {
        if(category.name === "Theatre"){
            category_id = category.id
        }
    })
    return category_id
}

getTheatreCategory().
   then(async category_id => {
        const response = await fetch("https://api-live.hellotickets.com/v1/extend/data/events?limit=100&page=1&start_date=2024-05-20&end_date=2024-06-01&city_id=1&category_id=" + category_id, requestOptions )
        const data = await response.json()
        const performances = []
        data.events.map(event => {
            event.performances.map(performance => {
                if(performance.price_range.min_price > 120){
                    performances.push(performance.id, performance.name)
                }
            })
        })
        console.log(performances)
        console.log(performances.length)
   })