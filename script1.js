//setting env variable
require('dotenv').config()

//importing fs

const fs = require('fs')

//setting http request function

const requestOptions = {
    method: "GET",
    headers: {
        'X-Public-Key': process.env.TOKEN
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

//finding a city 

function find_city_id(city_name, cities) {
    var new_york_id
    cities.map(city => {
        if (city.name === city_name) {
            new_york_id = city.id
        }
    })
    return new_york_id
}

//finding events in a city

async function getCityEvents(city_id, page, limit) {
    const all_events = []
    var url = 'https://api-live.hellotickets.com/v1/events?limit=' + limit + '&page=' + page + '&city_id=' + city_id
    const data = await httpRequest(url, requestOptions)
    const total_events = data.total_count
    data.events.map(event => {
        all_events.push({
            event_name: event.name,
            event_url: event.url,
            event_venue: event.venue.name,
            event_category: event.category.name
        })
    })
    while (all_events.length < total_events) {
        page = page + 1
        const url = 'https://api-live.hellotickets.com/v1/events?limit=' + limit + '&page=' + page + '&city_id=' + city_id
        const data = await httpRequest(url, requestOptions)
        data.events.map(event => {
            all_events.push({
                event_name: event.name,
                event_url: event.url,
                event_venue: event.venue.name,
                event_category: event.category.name
            })
        })
    }
    return all_events
}

// Functions to create CSV

function convertToCSV(data) {
    const headers = 'event_name, event_url, event_venue, event_category'
    const lines = data.map(event => {
        return `${event.event_name}, ${event.event_url}, ${event.event_venue}, ${event.event_category}`
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

// Init Script

get_country_cities(1, 50, 'USA')
    .then(cities => {
        const city_id = find_city_id('New York', cities)
        getCityEvents(city_id, 1, 50)
            .then(events => {
                exportToCSV(events, 'output.csv')
            })
    })