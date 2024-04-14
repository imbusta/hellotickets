//setting env variable
require('dotenv').config()

//importing fs

const fs = require('fs')

//setting http request function

const requestOptions = {
    method: "GET",
    headers: {
        'X-Public-Key': process.env.TOKEN,
        'x-currency': 'USD' //to get the prices in USD
    }
}

async function httpRequest(url, requestOptions) {
    const response = await fetch(url, requestOptions)
    if (!response.ok) {
        const error = await response.json()
        throw new Error('error: ' + error)
    }
    const data = response.json()
    return data
}

//Setting functions to get info from hellotickets

//Geting category_id based on a category description

async function get_category(category) {
    var category_id
    const response = await fetch("https://api-live.hellotickets.com/v1/categories", requestOptions)
    const data = await response.json()
    data.categories.map(category => {
        if (category.name === "Theatre") {
            category_id = category.id
        }
    })
    return category_id
}


//get cities in a country

async function get_country_cities(page, limit, country) {
    const all_cities = []
    var url = 'https://api-live.hellotickets.com/v1/cities?country_code=' + country + '&page=' + page + '&limit=' + limit
    const cities = await httpRequest(url, requestOptions)
    cities.cities.map(city => { all_cities.push(city) })
    const total_cities = cities.total_count
    while (all_cities.length < total_cities) {
        page = page + 1
        url = 'https://api-live.hellotickets.com/v1/cities?country_code=' + country + '&page=' + page + '&limit=' + limit
        const data = await httpRequest(url, requestOptions)
        data.cities.map(city => { all_cities.push(city) })
    }
    return all_cities
}

//finding a city id

function find_city_id(city_name, cities) {
    var new_york_id
    cities.map(city => {
        if (city.name === city_name) {
            new_york_id = city.id
        }
    })
    return new_york_id
}

//finding performances

async function getPerformances(date_from, date_to, category_id, city, limit, page) {
    const total_performances = []
    var url = "https://api-live.hellotickets.com/v1/extend/data/events?limit=" + limit + "&page=" + page + "&start_date=" + date_from + "&end_date=" + date_to + "&city_id=" + city + "&category_id=" + category_id
    const events = await httpRequest(url, requestOptions)
    events.events.map(event => {
        event.performances.map(performance => {
            if (performance.price_range.min_price < 120) {
                total_performances.push({
                    performance_id: performance.id,
                    performance_name: performance.name
                })
            }
        })
    })
    const total_calls = Math.ceil(events.total_count / limit)
    while (page < total_calls) {
        page = page + 1
        url = "https://api-live.hellotickets.com/v1/extend/data/events?limit=" + limit + "&page=" + page + "&start_date=" + date_from + "&end_date=" + date_to + "&city_id=" + city + "&category_id=" + category_id
        const data = await httpRequest(url, requestOptions)
        data.events.map(events => {
            events.performances.map(performance => {
                if (performance.price_range.min_price < 120) {
                    total_performances.push({
                        performance_id: performance.id,
                        performance_name: performance.name
                    })
                }
            })
        })
    }
    return total_performances
}

// Functions to create CSV

function convertToCSV(data) {
    const headers = 'performance_id, performance_name'
    const lines = data.map(performance => {
        return `${performance.performance_id}, ${performance.performance_name}`
    })
    const csvContent = headers + '\n' + lines.join('\n')
    return csvContent
}

function exportToCSV(data, fileName) {
    const csvContent = convertToCSV(data)
    fs.writeFile(fileName, csvContent, err => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        console.log('Done in: ', fileName);

    })
}

//Init script: the result will be the id and name of performances bellow to 120USD in New York that belong to 'Theatre'


get_category('Theatre')
    .then(category_id => {
        get_country_cities(1, 50, 'USA')
            .then(cities => {
                const city_id = find_city_id('New York', cities)
                getPerformances('2024-05-20', '2024-06-01', category_id, city_id, 20, 1)
                    .then(performances => {
                        console.log(performances)
                        exportToCSV(performances, 'output2.csv')
                    })
            })
    })