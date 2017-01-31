var chakram              = require('chakram'),
    _                    = require('lodash'),
    chai                 = require('chai'),
    handleMetadataEntity = require('./handleMetadataEntity');

var compareEachEntity = function(metadataVersionData, pluralEntityName, singularEntityName) {
	var onSuccess, onFailure;
	var waitForEntityToBeCompared = new Promise(function(resolve, reject) {
		onSuccess = resolve;
		onFailure = reject;
	});
	var currentIndex = 0;
	var tests = metadataVersionData[pluralEntityName];

	function getFilterParamForNext50Ids(currentIndex, filterParam) {
		for(var index = 0; (index < 50) && (currentIndex < tests.length); index++, currentIndex++) {
			filterParam = filterParam + tests[currentIndex].id + ","
		}
		filterParam = filterParam + ']';
		return filterParam
	}

	function executeBatchWiseTests() {
		if(currentIndex >= tests.length) {
			onSuccess();
			return;
		}
		console.log('batch running...', currentIndex, tests.length);
		var filterParam = 'id:in:[';
		var index;
		filterParam = getFilterParamForNext50Ids(currentIndex, filterParam);
		console.log("filter param"+ filterParam)
		currentIndex = currentIndex + 50;
		return handleMetadataEntity.handle(filterParam, pluralEntityName, singularEntityName)
			.then(function() {
				setTimeout(executeBatchWiseTests, 30);
			})
			.catch(onFailure);
	}
	setTimeout(executeBatchWiseTests, 30);
	return waitForEntityToBeCompared;
};

var getSingluarPluralNamesOfEntity = function(schemaOfEntities, metadataEntity) {
	return _.first(_.filter(schemaOfEntities, {plural: metadataEntity}));
};

this.compareAllEntities = function(metadataVersionData, schemaOfEntities, onSuccess, onFailure) {
	var metadataEntities = _(metadataVersionData)
													.keys()
													.pull('system')
													.value();
	if(metadataEntities.length == 1) {
		var singularPluralNamesOfEntity = getSingluarPluralNamesOfEntity(schemaOfEntities, metadataEntities[0]);
		return compareEachEntity(metadataVersionData, singularPluralNamesOfEntity.plural, singularPluralNamesOfEntity.singular)
			.then(onSuccess)
			.catch(onFailure);
	}
	else {
		_.reduce(metadataEntities, function(result, metadataEntity) {
			return Promise.resolve(result)
				.then(function() {
					var singularPluralNamesOfEntity = getSingluarPluralNamesOfEntity(schemaOfEntities, metadataEntity);
					return compareEachEntity(metadataVersionData, singularPluralNamesOfEntity.plural, singularPluralNamesOfEntity.singular);
				})
				.catch(onFailure)
		}).then(onSuccess)
	}
};