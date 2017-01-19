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
		delete (entityJson.translations);
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
	var subEntityName = entityName.substring(0,entityName.length);
	var schemaUrl = hqUrl + "schemas/"+subEntityName+".json";
	return chakram.get(schemaUrl, env.properRequestParams)
		.then(function(entitySchema) {
			_.map(entitySchema.properties, function(prop) {
				if(prop.propertyType == 'COLLECTION')
					schema.push({fieldName: prop.fieldName, propertyType: 'COLLECTION'});
				else
					schema.push({fieldName: prop.fieldName, propertyType: 'NON COLLECTION'})
			});
			return schema;
		});
};

var sortData = function(unsortedData, config) {
	var sortedData = [];
	var firstLevelSortedData = _.sortBy(unsortedData,"id");
	_.map(firstLevelSortedData, function(unsortedEntity) {
		var sortedEntity = {};
		_.map(unsortedEntity, function(v, k) {
			for(var i = 0; i < config.length; i++) {
				if(config[i].fieldName == k && config[i].propertyType == 'COLLECTION')
					sortedEntity[k] = _.sortBy(v, "id");
				if(config[i].fieldName == k && config[i].propertyType != 'COLLECTION')
					sortedEntity[k] = v
			}
		});
		sortedData.push(sortedEntity);
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
					var sortedHqData = sortData(hqData,config);
					var sortedLocalData = sortData(localData,config);
					expect(sortedHqData).to.deep.equal(sortedLocalData);
				})
				.catch(function(err) {
					throw new Error(err);
				});
		});
	}
};