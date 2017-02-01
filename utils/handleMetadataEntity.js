var chakram  = require('chakram'),
    _        = require('lodash'),
    chai     = require('chai'),
    expect   = chakram.expect,
    env      = require('./integrationEnv'),
    localUrl = env.localUrl + env.api + env.version,
    hqUrl    = env.hqUrl + env.api + env.version,
    utils    = require('./utils.js');

var complexKeys = {
	TRANSLATIONS: 'translations',
	DATADIMENSIONITEMS: 'dataDimensionItems',
	ATTRIBUTEVALUES: 'attributeValues',
	GREYEDFIELDS: 'greyedFields'
};
var unnecessaryKeys = ["lastUpdated", "href", "created", "lastLogin", "user", 'publicAccess'];

var getSchema = function(entityName) {
	var schema = {};
	var schemaUrl = localUrl + "schemas/" + entityName + ".json?fields=properties[fieldName,propertyType,collectionName]";
	return chakram.get(schemaUrl, env.properRequestParams)
		.then(function(response) {
			_.map(response.body.properties, function(prop) {
				if(prop.propertyType == 'COLLECTION')
					schema[prop.collectionName] = prop;
				else
					schema[prop.fieldName] = prop;
			});
			return schema;
		});
};

var byJsonStringImpl = function(listOfObjects) {
	function generateJsonStringForEachProperty(object) {
		function generateJsonStringForEachObjectInArray(array) {
			return _(array)
				.map(JSON.stringify)
				.value()
		}

		return _.map(object, function(property) {
			if(property.constructor.name == 'Array')
				return generateJsonStringForEachObjectInArray(property);
			else
				return JSON.stringify(property);
		})
	}
	return _.map(listOfObjects, generateJsonStringForEachProperty);
};

var getPropertyData = function(data, key) {
	return _.map(data, function(entity) {
		return _.pick(entity, key);
	});
};

var getDataByKey = function(data, key) {
	var data = getPropertyData(data, key);
	return _.flattenDeep(byJsonStringImpl(data)).sort();
};

var compareComplexObjects = function(hqData, localData, key) {
	var sortedHqData = getDataByKey(hqData, key);
	var sortedLocalData = getDataByKey(localData, key);
	expect(sortedHqData).to.deep.equal(sortedLocalData);
};

var handleTranslations = function(hqData, localData) {
	return compareComplexObjects(hqData, localData, complexKeys.TRANSLATIONS);
};

var handleDataDimensionItems = function(hqData, localData) {
	return compareComplexObjects(hqData, localData, complexKeys.DATADIMENSIONITEMS);
};

var handleAttributeValues = function(hqData, localData) {
	return compareComplexObjects(hqData, localData, complexKeys.ATTRIBUTEVALUES);
};

var handleGreyedFields = function(hqData, localData) {
	return compareComplexObjects(hqData, localData, complexKeys.GREYEDFIELDS);
};

var handleNormalEntities = function(hqData, localData, metadataEntity, pluralEntityName) {
	var removeUnnecessaryKeys = function(metadataVersionData) {
		return _.map(metadataVersionData, function(metadataEntityData) {
			if(pluralEntityName == 'users') {
				delete(metadataEntityData.userCredentials.lastUpdated);
				delete(metadataEntityData.userCredentials.lastLogin);
			}
			return _(metadataEntityData)
				.omit(unnecessaryKeys)
				.omit(_.values(complexKeys))
				.value();
		});
	};

	var sortMetadataVersionData = function(filteredMetadataVersionData) {

		function sortEachProperty(value, key) {
			if(metadataEntity[key] == undefined) return;
			if(metadataEntity[key].propertyType == 'COLLECTION')
				return _.sortBy(value, 'id');
			else
				return value;
		};

		function sortMetadataEntity(unsortedMetadataEntity) {
			return _.map(unsortedMetadataEntity, sortEachProperty);
		}

		return _(filteredMetadataVersionData)
			.sortBy("id")
			.map(sortMetadataEntity)
			.value();
	};

	function prepareDataForComparision(metadataVersionData) {
		return sortMetadataVersionData(removeUnnecessaryKeys(metadataVersionData));
	}

	return expect(prepareDataForComparision(hqData)).to.deep.equal(prepareDataForComparision(localData));
};

function getDataFor(url, entityName, filterParam) {
	return chakram.get(url + entityName + "?filter=" + filterParam + "&fields=:all&paging=false", env.properRequestParams)
		.then(function(response) {
			return response.body[entityName];
		})
}
this.handle = function(filterParam, pluralEntityName, singularEntityName) {
	console.log(" comparing " + pluralEntityName + " of local with HQ");
	return Promise.all([getDataFor(hqUrl, pluralEntityName, filterParam), getDataFor(localUrl, pluralEntityName, filterParam), getSchema(singularEntityName)])
		.then(function(responses) {
			var hqData = responses[0];
			var localData = responses[1];
			var metadataEntity = responses[2];
			handleNormalEntities(hqData, localData, metadataEntity, pluralEntityName);
			handleTranslations(hqData, localData);
			handleDataDimensionItems(hqData, localData);
			handleAttributeValues(hqData, localData);
			handleGreyedFields(hqData, localData)
		})
		.catch(function(err) {
			console.log(err,"failed");
			throw new Error(err);
		});
};