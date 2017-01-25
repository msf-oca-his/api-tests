var chakram    = require('chakram'),
    _          = require('lodash'),
    chai       = require('chai'),
    chaiexpect = chai.expect,
    expect                 = chakram.expect,
    env        = require('./integrationEnv'),
    localUrl   = env.localUrl + env.api + env.version,
    hqUrl      = env.hqUrl + env.api + env.version,
    run        = process.env.run;

var excludedKeys = ['translations', 'dataDimensionItems', 'attributeValues', 'greyedFields'];
var unnecessaryKeys = ["lastUpdated", "href", "created", "lastLogin", "user", 'publicAccess'];

var parseJsonData = function(entitysJson, entityName) {
	return _.map(entitysJson[entityName], function(entityJson) {
		var parsedEntityJson = _(entityJson)
			.omit(entityJson, unnecessaryKeys)
			.omit(entityJson, excludedKeys)
			.value();
		if(entityName == 'users') {
			delete(parsedEntityJson.userCredentials.lastUpdated);
			delete(parsedEntityJson.userCredentials.lastLogin);
		}
		return parsedEntityJson;
	});

};

var getSchema = function(entityName) {
	var schema = [];
	var subEntityName = entityName.substring(0, entityName.length - 1);
	var schemaUrl = localUrl + "schemas/" + subEntityName + ".json";
	return chakram.get(schemaUrl, env.properRequestParams)
		.then(function(entitySchema) {
			_.map(entitySchema.body.properties, function(prop) {
				if(prop.propertyType == 'COLLECTION') {
					schema.push({fieldName: prop.collectionName, propertyType: 'COLLECTION'});
				}
				else
					schema.push({fieldName: prop.fieldName, propertyType: 'NON COLLECTION'})
			});
			return schema;
		});
};

var getExcludedData = function(data, entityName) {
	var excludedData = [];
	_.map(data[entityName], function(entity) {
		var excludedProp = _.pick(entity, excludedKeys);
		excludedData.push(excludedProp);
	});
	return excludedData;
};

var sortData = function(unsortedData, config) {
	var sortedData = [];
	var firstLevelSortedData = _.sortBy(unsortedData,"id");
	_.map(firstLevelSortedData, function(unsortedEntity) {
		var sortedEntity = {};
		_.map(unsortedEntity, function(v, k) {
			for(var i = 0; i < config.length; i++) {
				if(config[i].fieldName == k && config[i].propertyType == 'COLLECTION') {
					sortedEntity[k] = _.sortBy(v, "id");
				}
				if(config[i].fieldName == k && config[i].propertyType != 'COLLECTION') {
					sortedEntity[k] = v
				}
			}
		});
		sortedData.push(sortedEntity);
	});
	return sortedData;
};

var sortExcludedProps = function(props) {

	String.prototype.hashCode = function() {
		var hash = 0, i, chr, len;
		if(this.length === 0) return hash;
		for(i = 0, len = this.length; i < len; i++) {
			chr = this.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	};
	var properties = [];
	_.map(props, function(prop) {
		_.map(prop, function(obj) {
			if(obj.constructor.name == 'Array')
					_.map(obj, function(eachProp) {
						var object = JSON.stringify(eachProp);
						var objCode = object.hashCode();
						properties.push(objCode);
					});
			var object = JSON.stringify(obj);
			var objCode = object.hashCode();
			properties.push(objCode);
		})
	});
	return _.sortBy(properties);
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
					var excludedHqProps = getExcludedData(responses[0].body, entityName);
					var excludedLocalProps = getExcludedData(responses[1].body, entityName);
					var hqData = parseJsonData(responses[0].body, entityName);
					var localData = parseJsonData(responses[1].body, entityName);
					var sortedHqData = sortData(hqData, config);
					var sortedLocalData = sortData(localData, config);
					var sortedExcludedHqProps = sortExcludedProps(excludedHqProps);
					var sortedExcludedLocalProps = sortExcludedProps(excludedLocalProps);
					// expect(sortedHqData).to.deep.equal(sortedLocalData);
					expect(sortedExcludedHqProps).to.deep.equal(sortedExcludedLocalProps);
					process.exit(0)
				})
				.catch(function(err) {
					throw new Error(err);
				});
		});
	}
};