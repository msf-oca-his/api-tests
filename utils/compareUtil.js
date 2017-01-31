var chakram              = require('chakram'),
    _                    = require('lodash'),
    chai                 = require('chai'),
    handleMetadataEntity = require('./handleMetadataEntity');

var compareEachEntity = function(allEntitiesContent, pluralEntityName, singularEntityName) {
	var resolve, reject;
	var innerPromise = new Promise(function(res, rej) {
		resolve = res;
		reject = rej;
	});
	var currentIndex = 0;
	var tests = allEntitiesContent[pluralEntityName];

	function getFilterParamForNext50Ids(currentIndex, filterParam) {
		for(var index = 0; (index < 50) && (currentIndex < tests.length); index++, currentIndex++) {
			filterParam = filterParam + tests[currentIndex].id + ","
		}
		filterParam = filterParam + ']';
		return filterParam
	}

	function executeBatchWiseTests() {
		if(currentIndex >= tests.length) {
			resolve();
			return;
		}
		console.log('batch running...', currentIndex, tests.length);
		var filterParam = 'id:in:[';
		var index;
		filterParam = getFilterParamForNext50Ids(currentIndex, filterParam);
		currentIndex = currentIndex + 50;
		return handleMetadataEntity.handle(filterParam, pluralEntityName, singularEntityName)
			.then(function() {
				setTimeout(executeBatchWiseTests, 30);
			})
			.catch(reject);
	}
	setTimeout(executeBatchWiseTests, 30);
	return innerPromise;
};

var getEntitySchemaNames = function(entitySchemaNames, entityName) {
	return _.filter(entitySchemaNames, function(entitySchemaName) {
		return entitySchemaName.plural == entityName;
	});
};

this.compareAllEntities = function(response, entitySchemaNames, resolve, reject) {
	var body = response.body;
	var entities = Object.keys(body);
	var filteredEntities = _.omit(entities, ["system"]);

	if(filteredEntities.length == 1) {
		var entitySchemaName = getEntitySchemaNames(entitySchemaNames, entities[0]);
		return compareEachEntity(body, entitySchemaName[0].plural, entitySchemaName[0].singular)
			.then(resolve)
			.catch(reject);
	}
	else {
		_.reduce(filteredEntities, function(result, entityName) {
			return Promise.resolve(result)
				.then(function() {
					var entitySchemaName = getEntitySchemaNames(entitySchemaNames, entityName);
					return compareEachEntity(body, entitySchemaName[0].plural, entitySchemaName[0].singular);
				})
				.catch(reject)
		}).then(resolve)
	}
};