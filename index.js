//setting environmental variables
require('dotenv').config()


//importing packages
const fs = require('fs')

//defining functions to build the csv structure 

function convertToCSV(data) {
    const headers = 'event_name, event_url, event_venue, event_category'
    const lines = data.map(event => { return `${event.event_name}, ${event.event_url}, ${event.event_venue}, ${event.event_category}`
    })
    const csvContent = headers + '\n' +  lines.join('\n')
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
//setting request configurations

var requestOptions = {
    method: 'GET',
    headers: {
        'X-Public-Key': process.env.TOKEN
    }
};

const events_in_new_york = []

//function to fetch all the cities in USA
async function getCitiesList(page) {
    const response = await fetch("https://api-live.hellotickets.com/v1/cities?country_code=USA&limit=100&page=" + page, requestOptions)
    if (!response.ok) {
        const error = await response.json()
        return { status: response.status, error: error.error_message }
    }
    const data = await response.json()
    return data
}

async function getEventsByCity(city_id, page) {
    const response = await fetch("https://api-live.hellotickets.com/v1/events?limit=100&page=" + page + "&city_id=" + city_id, requestOptions)
    const data = await response.json();
    console.log(data.total_count)
    return data
}

getCitiesList(1) // Requesting the list of US cities. Returns a Promise.
    .then(data => {
        var new_york_id
        data.cities.map(city => { //Getting the ny city_id
            if (city.name === 'New York') {
                console.log(city.id)
                new_york_id = city.id
            }
        })
        return new_york_id
    })
    .then(city_id => {
        getEventsByCity(city_id, 1) // Requesting first page of events by city_id
            .then(data => {
                data.events.map(event => { //With the response, I iterate the array and push in the array defined above the required event info
                    events_in_new_york.push({
                        event_name: event.name,
                        event_url: event.url,
                        event_venue: event.venue.name,
                        event_category: event.category.name
                    })
                })
                if (events_in_new_york.length < data.total_count) { // Checking if I need to make more requests
                    getEventsByCity(city_id, 2)
                        .then(data => {
                            data.events.map(event => {
                                events_in_new_york.push({
                                    event_name: event.name,
                                    event_url: event.url,
                                    event_venue: event.venue.name,
                                    event_category: event.category.name
                                })
                            })
                            
                            if (events_in_new_york.length < data.total_count) {
                                // Here I can manage better the pagination
                            } else {
                                exportToCSV(events_in_new_york, 'output.csv')
                            }
                        })
                }
            })
    })
    .catch(error => console.log(error))
