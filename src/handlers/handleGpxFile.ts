import {encodePolyline, getSQLDate} from "../helpers/gpsHelper";

const { DOMParser } = require('xmldom')
const { SportsLib } = require('@sports-alliance/sports-lib');

export const handleGPXStream = async (stream: ReadableStream): Promise<string> => {
    const trackDataRaw = [];
    const metaDataRaw = [];
    const gpxString = stream.toString();
    const event = await SportsLib.importFromGPX(gpxString, DOMParser);
    const stats = event.getStats();
    const dom = await new DOMParser().parseFromString(gpxString, 'application/xml');

    const startDate = event.startDate;
    const endDate = event.endDate;

    const startDateTS = Math.floor(event.startDate / 1000);
    const endDateTS = Math.floor(event.endDate / 1000);


    const timeNodes = dom.getElementsByTagName('trkpt');
    let prevTime = 0;
    Array.from(timeNodes)
        .forEach((trkpt1, i) => {
            const trkpt = trkpt1 as Element;
            const lat = +trkpt.getAttribute('lat');
            const lon = +trkpt.getAttribute('lon');
            const ele = +trkpt.getElementsByTagName('ele')?.[0]?.textContent || 0;
            trackDataRaw.push([lat, lon ,ele]);
            const date = new Date(Date.parse(trkpt.getElementsByTagName('time')[0].textContent));
            const dateTS = Math.floor(+date / 1000);

            const atempEls = trkpt.getElementsByTagNameNS('*', 'atemp');
            const atemp = atempEls.length ? parseInt(atempEls[0].textContent) : -127;
            const hrEls = trkpt.getElementsByTagNameNS('*', 'hr');
            const hr = hrEls.length ? parseInt(hrEls[0].textContent) : 0;
            metaDataRaw.push([prevTime > 0 ? dateTS - prevTime : 0, hr, atemp]);
            prevTime = dateTS;
        });




    const trackData = {
        trackDataRaw,
        metaDataRaw,
        startDate,
        endDate,
    };
    stats.forEach(( x, k) => {
        //console.log(k, x.getValue(), x.getDisplayUnit(), x.getDisplayType(), x.getUnit());
        trackData[k] = x.getValue();
    })


    const forBackendData = {
        name,
        workout_type: 1,
        trackdata: encodePolyline(trackData.trackDataRaw),
        trackmeta: encodePolyline(trackData.metaDataRaw),
        date_start: getSQLDate(trackData.startDate),
        date_finish: getSQLDate(trackData.endDate),
        activity_type: trackData['Activity Types']?.[0] || '',
        distance: Math.round(trackData['Distance']),
        alt_ascent: Math.round(trackData['Ascent']),
        alt_descent: Math.round(trackData['Descent']),
        alt_max: Math.round(trackData['Maximum Altitude']),
        alt_min: Math.round(trackData['Minimum Altitude']),
        alt_avg: Math.round(trackData['Average Altitude']),
        speed_max: Math.round(trackData['Maximum speed in kilometers per hour'] * 10),
        speed_min: Math.round(trackData['Minimum speed in kilometers per hour'] * 10),
        speed_avg: Math.round(trackData['Average speed in kilometers per hour'] * 10),
        time_mooving: Math.round(trackData['Moving time']),
        time_pause: Math.round(trackData['Pause Time']),
    }


    if (trackData['Average Heart Rate']) {
        Object.assign(forBackendData, {
            hr_max: Math.round(trackData['Maximum Heart Rate']),
            hr_min: Math.round(trackData['Minimum Heart Rate']),
            hr_avg: Math.round(trackData['Average Heart Rate']),

        })
    }
    if (trackData['Average Temperature']) {
        Object.assign(forBackendData, {
            temp_max: Math.round(trackData['Maximum Temperature']),
            temp_min: Math.round(trackData['Minimum Temperature']),
            temp_avg: Math.round(trackData['Average Temperature']),
        })
    }

    return JSON.stringify(forBackendData, null, '  ');
}
