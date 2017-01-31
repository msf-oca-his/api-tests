var chakram                = require('chakram'),
    _                      = require('lodash'),
    expect                 = chakram.expect,
    chai                   = require('chai'),
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
    serverData             = require('../../../data/metadatasync/ContractTestData'),
    compareUtil            = require('../../../utils/compareUtil'),
    utils                  = require('../../../utils/utils');
console.log(version);
console.log(run);

describe("metadata sync API ", function() {
	var setupData, syncSetUp, locResponse;
	// before("creating versions on HQ after importing json", function() {
	// 	chakram.post(localUrl + "systemSettings", serverData.validServerDetails, env.properRequestParams);
	// 	if(run != "withDB")
	// 		return chakram.post(importHqURL, data.body, env.properRequestParams)
	// 			.then(function(chakramResponse) {
	// 				console.log("itsdone")
	// 				return chakramResponse.body;
	// 			})
	// 			.then(function() {
	// 				return chakram.post(createVersionURL + data.type, {}, env.properRequestParams)
	// 					.then(function(data) {
	// 						console.log("version created ....itsdone")
	// 						setupData = data;
	// 					});
	// 			});
	// });

	xit("should sync version from HQ to local", function() {
		locResponse = chakram.get(syncMetadataLocalUrl + version, env.properRequestParams);
		console.log("dowlonaded to local ....itsdone")
		expect(locResponse).to.have.status(200);
		return chakram.wait();
	});

	xit("should get version data same as in hq after metadata sync", function() {
		var hQData;
		return chakram.get(getVersionDataHqURL + version + "/data", env.properRequestParams)
			.then(function(res) {
				expect(res).to.have.status(200);
				hQData = res.body;
				return chakram.get(getVersionDataLocalURL + version + "/data", env.properRequestParams);
			})
			.then(function(localData) {
				expect(localData).to.have.status(200);
				var local = JSON.stringify(localData.body);
				var hq = JSON.stringify(hQData);
				var localDataHashCode = utils.hashCode(local);
				var hqDataHashCode = utils.hashCode(hq);
				expect(localDataHashCode).to.equal(hqDataHashCode);
			});
	});

	it('should compare each entity data after metadata sync', function() {
		var onSuccess, onFailure;
		var waitForAllEntitiesToBeCompared = new Promise(function(resolve,reject) {
			onSuccess = resolve;
			onFailure = reject;
		});
		Promise.all([chakram.get(getVersionDataHqURL + version + "/data", env.properRequestParams), chakram.get(hqUrl + "schemas.json?fields=plural,singular", env.properRequestParams)])
			.then(function(responses) {
				var schemaOfEntities = responses[1].body.schemas;
				var metadataVersionData = responses[0].body;
				return compareUtil.compareAllEntities(metadataVersionData, schemaOfEntities, onSuccess, onFailure);
			}).catch(onFailure);
		return waitForAllEntitiesToBeCompared;
	})
});

