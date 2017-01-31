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

var byHashCodeImpl = function(listOfObjects) {
	function generateHashCodeForEachProperty(object) {
		function getHashCodesOfEachObjectInArray(array) {
			return _(array)
				.map(JSON.stringify)
				.map(utils.hashCode)
				.value()
		}

		return _.map(object, function(property) {
			if(property.constructor.name == 'Array')
				return getHashCodesOfEachObjectInArray(property);
			else
				return utils.hashCode(JSON.stringify(property));
		})
	}
	return _.map(listOfObjects, generateHashCodeForEachProperty);
};

var getPropertyData = function(data, key) {
	return _.map(data, function(entity) {
		return _.pick(entity, key);
	});
};

var getDataByKey = function(data, key) {
	var data = getPropertyData(data, key);
	return _.sortBy(_.flattenDeep(byHashCodeImpl(data)));
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

var handleNormalEntities = function(hqData, localData, entitySchema, pluralEntityName) {
	var removeUnnecessaryKeys = function(data) {
		return _.map(data, function(entityJson) {
			if(pluralEntityName == 'users') {
				delete(entityJson.userCredentials.lastUpdated);
				delete(entityJson.userCredentials.lastLogin);
			}
			return _(entityJson)
				.omit(unnecessaryKeys)
				.omit(_.values(complexKeys))
				.value();
		});
	};

	var sortData = function(filteredData) {
		
		function sortEachProperty(value, key) {
			if(entitySchema[key] == undefined) return;
			if(entitySchema[key].propertyType == 'COLLECTION')
				return _.sortBy(value, 'id');
			else
				return value;
		};

		function sortEntity(unsortedEntity) {
			return _.map(unsortedEntity, sortEachProperty);
		}

		return _(filteredData)
			.sortBy("id")
			.map(sortEntity)
			.value();
	};

	function prepareDataForComparision(data) {
		return sortData(removeUnnecessaryKeys(data));
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
			var entitySchema = responses[2];
			handleNormalEntities(hqData, localData, entitySchema, pluralEntityName);
			handleTranslations(hqData, localData);
			handleDataDimensionItems(hqData, localData);
			handleAttributeValues(hqData, localData);
			handleGreyedFields(hqData, localData)
		})
		.catch(function(err) {
			throw new Error(err);
		});
};