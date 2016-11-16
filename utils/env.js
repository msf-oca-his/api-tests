var host = process.env.DHIS_HOST;
var port = process.env.DHIS_PORT;

if (typeof host == 'undefined' || !host) {
    host = '10.136.23.138'
}
if (typeof port == 'undefined' || !port) {
    port = 8080
}

module.exports = { //TODO: this would be more of conf than util.
    url: "http://" + host + ":" + port,
    api: "/api/",
    api23: '/api/23/',
    version: "",
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
            Accept: 'application/xml',
            Authorization: 'Basic YWsdsRtaW4xOmRpc3RyaWN0'
        }
    },
    properResponseParamsXML: {
        headers: {
            Accept: 'application/xml',
            Authorization: 'Basic YWRtaW46ZGlzdHJpY3Q='
        }
    }
};