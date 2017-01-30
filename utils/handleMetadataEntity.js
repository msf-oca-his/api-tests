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
	var schema = [];
	var schemaUrl = localUrl + "schemas/" + entityName + ".json";
	return chakram.get(schemaUrl, env.properRequestParams)
		.then(function(entitySchema) {
			_.map(entitySchema.body.properties, function(prop) {
				if(prop.propertyType == 'COLLECTION')
					schema.push({fieldName: prop.collectionName, propertyType: 'COLLECTION'});
				else
					schema.push({fieldName: prop.fieldName, propertyType: 'NON COLLECTION'})
			});
			return schema;
		});
};

var parseJsonData = function(data, entityName) {
	return _.map(data, function(entityJson) {
		var parsedEntityJson = _(entityJson)
			.omit(entityJson, unnecessaryKeys)
			.omit(entityJson, _.values(complexKeys))
			.value();
		if(entityName == 'users') {
			delete(parsedEntityJson.userCredentials.lastUpdated);
			delete(parsedEntityJson.userCredentials.lastLogin);
		}
		return parsedEntityJson;
	});
};

var sortData = function(unsortedData, entitySchema) {
	var sortedData = [];
	var firstLevelSortedData = _.sortBy(unsortedData, "id");
	_.map(firstLevelSortedData, function(unsortedEntity) {
		var sortedEntity = {};
		_.map(unsortedEntity, function(value, key) {
			var collectionEntity = _.filter(entitySchema, function(schemaObj) {
				return schemaObj.fieldName == key && schemaObj.propertyType == 'COLLECTION'
			});
			var nonCollectionEntity = _.filter(entitySchema, function(schemaObj) {
				return schemaObj.fieldName == key && schemaObj.propertyType != 'COLLECTION'
			});
			if(!(_.isEmpty(collectionEntity))) sortedEntity[key] = _.sortBy(value, "id");
			if(!(_.isEmpty(nonCollectionEntity))) sortedEntity[key] = value;
		});
		sortedData.push(sortedEntity);
	});
	return sortedData;
};

var byHashCodeImpl = function(listOfObjects) {
	var hashCodes = [];
	_.map(listOfObjects, function(object) {
		_.map(object, function(prop) {
			if(prop.constructor.name == 'Array')
				_.map(prop, function(obj) {
					hashCodes.push(utils.hashCode(JSON.stringify(obj)));
				});
			else
				hashCodes.push(utils.hashCode(JSON.stringify(prop)));
		})
	});
	return hashCodes;
};

var getPropertyData = function(data, prop) {
	var propertyData = [];
	_.map(data, function(entity) {
		var propData = _.pick(entity, prop);
		propertyData.push(propData);
	});
	return propertyData;
};

var getTranslationData = function(data) {

	var allTranslationsData = getPropertyData(data, complexKeys.TRANSLATIONS);

	return _.sortBy(byHashCodeImpl(allTranslationsData));

};

var getDataDimensionItemsData = function(data) {

	var allDataDimensionItems = getPropertyData(data, complexKeys.DATADIMENSIONITEMS);

	return _.sortBy(byHashCodeImpl(allDataDimensionItems))
};

var getAttributeValuesData = function(data) {

	var allAttributeValues = getPropertyData(data, complexKeys.ATTRIBUTEVALUES);

	return _.sortBy(byHashCodeImpl(allAttributeValues));
};

var getGreyedFieldsData = function(data) {

	var allGreyedFields = getPropertyData(data, complexKeys.GREYEDFIELDS);

	return _.sortBy(byHashCodeImpl(allGreyedFields));
};

var handleTranslations = function(hqData, localData) {
	var sortedHqData = getTranslationData(hqData);
	var sortedLocalData = getTranslationData(localData);
	expect(sortedHqData).to.deep.equal(sortedLocalData);
};

var handleDataDimensionItems = function(hqData, localData) {
	var sortedHqData = getDataDimensionItemsData(hqData);
	var sortedLocalData = getDataDimensionItemsData(localData);
	expect(sortedHqData).to.deep.equal(sortedLocalData);
};

var handleAttributeValues = function(hqData, localData) {
	var sortedHqData = getAttributeValuesData(hqData);
	var sortedLocalData = getAttributeValuesData(localData);
	expect(sortedHqData).to.deep.equal(sortedLocalData);
};

var handleGreyedFields = function(hqData, localData) {
	var sortedHqData = getGreyedFieldsData(hqData);
	var sortedLocalData = getGreyedFieldsData(localData);
	expect(sortedHqData).to.deep.equal(sortedLocalData);
};

var handleNormalEntities = function(hqData, localData, entitySchema, pluralEntityName) {
	var parsedHqData = parseJsonData(hqData, pluralEntityName);
	var parsedLocalData = parseJsonData(localData, pluralEntityName);
	var sortedHqData = sortData(parsedHqData, entitySchema);
	var sortedLocalData = sortData(parsedLocalData, entitySchema);
	expect(sortedHqData).to.deep.equal(sortedLocalData);
};

this.handle = function(filterParam, pluralEntityName, singularEntityName) {
	console.log(" comparing " + pluralEntityName + " of local with HQ");
	return getSchema(singularEntityName).then(function(entitySchema) {
		return Promise.all([chakram.get(hqUrl + pluralEntityName + "?filter=" + filterParam + "&fields=:all&paging=false", env.properRequestParams), chakram.get(localUrl + pluralEntityName + "?filter=" + filterParam + "&fields=:all&paging=false", env.properRequestParams)])
			.then(function(responses) {
				var hqResponse = responses[0].body;
				var localResponse = responses[1].body;
				var hqData = hqResponse[pluralEntityName];
				var localData = localResponse[pluralEntityName];
				handleNormalEntities(hqData, localData, entitySchema, pluralEntityName);
				handleTranslations(hqData, localData);
				handleDataDimensionItems(hqData, localData);
				handleAttributeValues(hqData, localData);
				handleGreyedFields(hqData, localData)
			})
			.catch(function(err) {
				throw new Error(err);
			});
	});
};