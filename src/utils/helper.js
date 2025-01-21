import moment from 'moment-timezone';

function utcToTimezone(utcDate, timezone) {
    return moment.utc(utcDate).tz(timezone).format();
}

function timezoneToUtc(date, timezone) {
    return moment.tz(date, timezone).utc().format();
}

export { utcToTimezone, timezoneToUtc };