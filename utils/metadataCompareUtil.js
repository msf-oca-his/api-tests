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
		if(entityName == 'users') {
			delete(entityJson.userCredentials.lastUpdated);
			delete(entityJson.userCredentials.lastLogin);
		}
		return entityJson;
	});

};

var getSchema = function(entityName) {
	var schema = [];
	var schemaUrl = hqUrl + "schemas.json";
	return chakram.get(schemaUrl, env.properRequestParams)
		.then(function(response) {
			var entitySchema = _.find(response.body.schemas, function(obj) {
				return obj.collectionName == entityName;
			});
			_.map(entitySchema.properties, function(prop) {
				if(prop.propertyType == 'COLLECTION')
					schema.push({fieldName: prop.fieldName, propertyType: 'COLLECTION'})
				else if(prop.propertyType == 'COMPLEX')
					schema.push({fieldName: prop.fieldName, propertyType: 'COMPLEX'})
				else if(prop.propertyType == 'REFERENCE')
					schema.push({fieldName: prop.fieldName, propertyType: 'REFERENCE'})
				else
					schema.push({fieldName: prop.fieldName, propertyType: 'SIMPLE'})
			});
			return schema;
		});
};

var sortData = function(data, config) {
	var sortedData = {};
	_.map(data, function(v, k) {
		for(var i = 0; i < config.length; i++) {
			if(config[i].fieldName == k && config[i].propertyType == 'COLLECTION')
				sortedData[k] = _.sortBy(v, "id");
			if(config[i].fieldName == k && config[i].propertyType != 'COLLECTION')
				sortedData[k] = v
		}
	});
	return sortedData;
};

this.compareMetadataEntity = function(filterParam, entityName) {
	console.log(" comparing " + entityName + " of local with HQ");
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
		return getSchema(entityName).then(function(config) {
			return Promise.all([chakram.get(hqUrl + entityName + "?filter=" + filterParam + "&fields=:all&paging=false", env.properRequestParams), chakram.get(localUrl + entityName + "?filter=" + filterParam + "&fields=:all&paging=false", env.properRequestParams)])
				.then(function(responses) {
					var hqData = parseJsonData(responses[0].body, entityName);
					var localData = parseJsonData(responses[1].body, entityName);
					var sortedHqData = [];
					var sortedLocalData = [];
					_.map(hqData, function(entity) {
						sortedHqData.push(sortData(entity, config))
					});
					_.map(localData, function(entity) {
						sortedLocalData.push(sortData(entity, config));
					});
					expect(sortedHqData).to.deep.equal(sortedLocalData);
				})
				.catch(function(err) {
					throw new Error(err);
				});
		});
	}
};