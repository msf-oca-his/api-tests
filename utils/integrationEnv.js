var hqURL = process.env.DHIS_HQURL,
    hqport = process.env.DHIS_HQPORT,
    localURL = process.env.DHIS_LOCALURL,
    localport = process.env.DHIS_LOCALPORT;

if (typeof hqURL == 'undefined' || !hqURL) {
    hqURL = 'localhost'
}
if (typeof hqport == 'undefined' || !hqport) {
    hqport = 8080
}
if (typeof localURL == 'undefined' || !localURL) {
    localURL = 'localhost'
}
if (typeof localport == 'undefined' || !localport) {
    localport = 8085
}
module.exports = {
    hqUrl: "http://" + hqURL + ":" + hqport,
    localUrl: "http://" + localURL + ":" + localport,
    api: "/api/",
    version: "25/",
    properRequestParams: {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Basic YWRtaW46ZGlzdHJpY3Q='
        }
    },
    improperRequestParams: {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'Basic YWRtaW4xOmRpc3RyaWN0'
        }
    }
};
