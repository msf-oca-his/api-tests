var chakram    = require('chakram'),
    _          = require('lodash'),
    chai       = require('chai'),
    chaiexpect = chai.expect,
    expect                 = chakram.expect,
    env        = require('./integrationEnv'),
    localUrl   = env.localUrl + env.api + env.version,
    hqUrl      = env.hqUrl + env.api + env.version,
    run        = process.env.run;

var parseJsonData = function(entitysJson, entityName) {
	return _.map(entitysJson[entityName], function(entityJson){
		delete(entityJson.lastUpdated);
		delete(entityJson.href);
		delete(entityJson.created);
		delete(entityJson.lastLogin);
		delete(entityJson.user);
		if(entityName == 'users'){
			delete(entityJson.userCredentials.lastUpdated);
			delete(entityJson.userCredentials.lastLogin);
		}
		return entityJson;
	});

};

this.compareMetadataEntity = function(filterParam, entityName) {

	// console.log(" comparing " + entityName + " of local with HQ");
		if(run == "withDB") {
			var localDataUrl = localUrl + "/" + entityName + "/" + element.id + ".json?fields=";
			_.map(entity, function(k, v) {
				localDataUrl = localDataUrl + v + ",";
			});
			return Promise.all([chakram.get(localDataUrl, env.properRequestParams)])
				.then(function(response) {
					var hqData = parseJsonData(entity);
					var localData = parseJsonData(response[0].body)
					chaiexpect(hqData).to.deep.equal(localData);
				});
		}
		else {
			return Promise.all([chakram.get(hqUrl + entityName + "?filter=" + filterParam +"&fields=:all&paging=false", env.properRequestParams), chakram.get(localUrl + entityName + "?filter=" + filterParam +"&fields=:all&paging=false", env.properRequestParams)])
				.then(function(responses) {
					console.log(entityName,"thisisithen")
					var hqData = parseJsonData(responses[0].body, entityName);
					var localData = parseJsonData(responses[1].body, entityName);
					expect(hqData).to.deep.equal(localData);
				})
				.catch(function(err) {
					throw new Error(err);
				});
		}
};