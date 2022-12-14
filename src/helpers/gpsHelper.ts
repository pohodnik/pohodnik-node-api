/**
 * Дистанция между двумя GPS точками в метрах
 * @param {Array<number>} latLon1
 * @param {Array<number>} latLon2
 * @returns {number}
 * @link https://www.movable-type.co.uk/scripts/latlong.html
 */
export function getDistanceBetweenPointsInMeters([lat1, lon1], [lat2, lon2]) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
        + Math.cos(φ1) * Math.cos(φ2)
        * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres

    return d;
}

export function getDistanceByCoordsInMeters(latLonArray) {
    return latLonArray.reduce((acc, cur, index, arr) => {
        if (index === 0) {
            return acc;
        }

        return acc + getDistanceBetweenPointsInMeters(arr[index - 1], cur);
    }, 0);
}

/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */

export function py2_round(value) {
    // Google's polyline algorithm uses the same rounding strategy as Python 2,
    // which is different from JS for negative values
    return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

export function encode(_current, _previous, factor) {
    const current = py2_round(_current * factor);
    const previous = py2_round(_previous * factor);
    let coordinate = current - previous;
    coordinate <<= 1;
    if (current - previous < 0) {
        coordinate = ~coordinate;
    }
    let output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

export const encodePolyline = (coordinates, precision = 5) => {
    if (!coordinates.length) { return ''; }

    const factor = 10 ** precision;
    let output = encode(coordinates[0][0], 0, factor)
        + encode(coordinates[0][1], 0, factor)
        + encode(coordinates[0][2], 0, factor);

    for (let i = 1; i < coordinates.length; i++) {
        const a = coordinates[i];
        const b = coordinates[i - 1];
        output += encode(a[0], b[0], factor);
        output += encode(a[1], b[1], factor);
        output += encode(a[2], b[2], factor);
    }

    return output;
};

/**
 * Decode an x,y or x,y,z encoded polyline
 * @param {*} encodedPolyline
 * @param {Boolean} includeElevation - true for x,y,z polyline
 * @returns {Array} of coordinates
 */
export const decodePolyline = encodedPolyline => {
    // array that holds the points
    const points = [];
    let index = 0;
    const len = encodedPolyline.length;
    let lat = 0;
    let lng = 0;
    let ele = 0;
    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encodedPolyline.charAt(index++).charCodeAt(0) - 63; // finds ascii
            // and subtract it by 63
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        lat += ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        shift = 0;
        result = 0;
        do {
            b = encodedPolyline.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));

        shift = 0;
        result = 0;
        do {
            b = encodedPolyline.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        ele += ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        try {
            points.push([(lat / 1E5), (lng / 1E5), (ele / 1E5)]);
        } catch (e) {
            console.log(e);
        }
    }
    return points;
};

export function getSQLDate(jsDate) {
    const timeOffset = new Date().getTimezoneOffset();
    return new Date(jsDate.getTime() - (timeOffset * 60000))
        .toISOString()
        .substr(0, 19)
        .replace('T', ' ');
}
