const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');
const moment = require('moment-timezone');
const countrynames = require('countrynames');
const axios = require('axios');

class Weather {
    constructor() {
        this.name = 'weather';
        this.category = KiramekiHelper.categories.GENERAL;
        this.cooldown = 5;
        this.help = {
            message: `Get the current weather information for a specified location. Specifying a location is optional if a location has been set before with the \`${KiramekiConfig.prefix}setweather\` command.`,
            usage: 'weather [location]',
            example: ['weather', 'weather Tokyo'],
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, location] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const weatherLocation = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM weather_locations WHERE discord_id = ?;', [message.author.id]);
        let city;

        if (!location && !weatherLocation.length) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        } else if (!location) {
            city = weatherLocation[0].location;
        } else {
            city = location;
        }

        try {
            const requestURL = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${KiramekiConfig.openWeatherMapApiKey}`
            const owmData = await axios.get(requestURL);
            const owmResult = owmData.data;

            const weatherIcon = KiramekiHelper.images.WEATHER.getWeatherIcon(owmResult.weather[0].icon);
            const formattedLocation = `:flag_${owmResult.sys.country.toLowerCase()}: ${owmResult.name}`;
            const latitude = owmResult.coord.lat;
            const longtitude = owmResult.coord.lon;
            const timeZoneData = await axios.get(`http://api.geonames.org/timezoneJSON?lat=${latitude}&lng=${longtitude}&username=${KiramekiConfig.geoNamesApplicationID}`);
            const timeZoneResult = timeZoneData.data;

            let sunriseTime;
            let sunsetTime;

            if (timeZoneResult.status) {
                sunriseTIme = `${KiramekiHelper.convertTimeStamp(owmResult.sys.sunrise)} UTC + 2`;
                sunsetTime = `${KiramekiHelper.convertTimeStamp(owmResult.sys.sunset)} UTC + 2`;
            }

            const sunriseDate = moment.unix(owmResult.sys.sunrise);
            const sunsetDate = moment.unix(owmResult.sys.sunset);

            sunriseTime = sunriseDate.tz(timeZoneResult.timezoneId).format('LTS');
            sunsetTime = sunsetDate.tz(timeZoneResult.timezoneId).format('LTS');

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setTitle('Weather')
                .setThumbnail(weatherIcon)
                .setDescription(`Current weather for **${formattedLocation}, ${KiramekiHelper.capitalize(countrynames.getName(owmResult.sys.country))}**`)
                .addField(
                    'Current Temperature', 
                    `${owmResult.main.temp} °C\n` +
                    `${parseFloat((owmResult.main.temp * (9/5) + 32)).toFixed(2)} °F`,
                    true
                )
                .addField(
                    'Wind',
                    `${parseFloat((owmResult.wind.speed) * 3.6).toFixed(2)} km/h\n` +
                    `${parseFloat(((owmResult.wind.speed) * 3.6) / 1.609344).toFixed(2)} mph`,
                    true
                )
                .addField('Weather condition', owmResult.weather[0].description, true)
                .addField('Humidity', `${owmResult.main.humidity}%`, true)
                .addField('Sunrise',sunriseTime, true)
                .addField('Sunset', sunsetTime, true)
                .setFooter(`Weather was requested by: ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 16))
            );
        } catch (weatherError) {
            if (weatherError.response.status === 404) {
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle(`Couldn't find any weather data for City **${city}**!`)
                );
            } else {
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('RED')
                    .setTitle('Something went wrong. Please try again.')
                );
            }
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEATHER', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Weather();