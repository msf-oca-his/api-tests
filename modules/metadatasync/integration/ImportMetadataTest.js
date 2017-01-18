var chakram                = require('chakram'),
    _                      = require('lodash'),
    expect                 = chakram.expect,
    chai                   = require('chai'),
    chaiexpect             = chai.expect,
    env                    = require('../../../utils/integrationEnv'),
    localUrl               = env.localUrl + env.api + env.version,
    hqUrl                  = env.hqUrl + env.api + env.version,
    createVersionURL       = hqUrl + "metadata/version/create?type=",
    syncMetadataLocalUrl   = localUrl + "metadata/sync?versionName=",
    getVersionDataHqURL    = hqUrl + "metadata/version/",
    getVersionDataLocalURL = localUrl + "metadata/version/",
    //TODO refactor version /24 when 2.25 releases.
    importHqURL            = hqUrl + "metadata/",
    version                = process.env.version,
    run                    = process.env.run,
    data                   = require('../../../data/metadatasync/versiondata/' + version),
	serverData = require('../../../data/metadatasync/ContractTestData'),
	metadataCompareUtil    = require('../../../utils/metadataCompareUtil');

console.log(version);
console.log(run);

describe("metadata sync API ", function() {
	var setupData, syncSetUp, locResponse;
	before("creating versions on HQ after importing json", function() {
		chakram.post(localUrl + "systemSettings", serverData.validServerDetails, env.properRequestParams);
		if(run != "withDB")
			return chakram.post(importHqURL, data.body, env.properRequestParams)
				.then(function(chakramResponse) {
					console.log("itsdone")
					return chakramResponse.body;
				})
				.then(function() {
					return chakram.post(createVersionURL + data.type, {}, env.properRequestParams)
						.then(function(data) {
							console.log("version created ....itsdone")
							setupData = data;
						});
				});
	});


	it("should sync version from HQ to local", function() {
		locResponse = chakram.get(syncMetadataLocalUrl + version, env.properRequestParams);
		console.log("dowlonaded to local ....itsdone")
		expect(locResponse).to.have.status(200);
		return chakram.wait();
	});

	it("should get version data same as in hq after metadata sync", function() {
		var hQData;
		String.prototype.hashCode = function() {
			var hash = 0, i, chr, len;
			if (this.length === 0) return hash;
			for (i = 0, len = this.length; i < len; i++) {
				chr   = this.charCodeAt(i);
				hash  = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			return hash;
		};
		return chakram.get(getVersionDataHqURL + version + "/data", env.properRequestParams)
			.then(function(res) {
				expect(res).to.have.status(200);
				hQData = res.body;
				return chakram.get(getVersionDataLocalURL + version + "/data", env.properRequestParams);
			})
			.then(function(localData) {
				expect(localData).to.have.status(200);
				var k = JSON.stringify(localData.body);
				var l = JSON.stringify(hQData);
				console.log(k.hashCode(), l.hashCode());
				expect(k.hashCode()).to.equal(l.hashCode());
			});
	});

	it('test test',function() {
		var bigres, bigrej;
		var bigPromise = new Promise(function(res, rej){
			bigres =res;
			bigrej = rej;
		});
		Promise.all([chakram.get(getVersionDataHqURL + version + "/data", env.properRequestParams)])
			.then(function(response) {
				chaiexpect(response[0].response.statusCode).to.equal(200);
				var body = response[0].body;
				var entities = Object.keys(body);
				entities.shift();
				function testEntity(allEntitiesContent, entityName) {
					var res, rej;
					var a = new Promise(function(resolve, reject) {
						res = resolve;
						rej = reject;
					});
					var i = 0;
					var tests;
					tests = allEntitiesContent[entityName];


					function executeTestCasesNdUpdateTimenScheduleYourself() {
						if(i >= tests.length) {
							res();
							return;
						}
						 console.log('batch running...', i, tests.length);
						var filterParam = 'id:in:['
						var k;
						for(k = 0; (k < 50) && (i < tests.length); k++, i++) {
							filterParam = filterParam + tests[i].id + ","
						}
						filterParam = filterParam + ']';
						console.log(filterParam,"filterparam")
						return metadataCompareUtil.compareMetadataEntity(filterParam, entityName)
							.then(function() {
								setTimeout(executeTestCasesNdUpdateTimenScheduleYourself, 30);
							})
							.catch(rej);
					}
					setTimeout(executeTestCasesNdUpdateTimenScheduleYourself, 30);
					return a;
				}

				if(entities.length == 1) {
					return testEntity(body,entities[22])
						.then(bigres)
						.catch(bigrej);
				}
				else {
					_.reduce(entities, function(result, entityName, index) {
						return Promise.resolve(result)
							.then(function() {
								return testEntity(body, entityName);
							})
							.catch(bigrej)
					}).then(bigres)
				}
		}).catch(bigrej);
		return bigPromise;
	})
});

