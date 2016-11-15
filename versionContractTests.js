var Mocha = require('mocha');
var mocha = new Mocha({timeout:20000});
mocha.addFile('modules/metadataversion/ErrorMessageTest.js');
mocha.addFile('modules/metadataversion/GetVersionHistoryTest.js');
mocha.addFile('modules/metadataversion/GetVersionTest.js');
mocha.addFile('modules/metadataversion/CreateVersionTest.js');
mocha.addFile('modules/metadataversion/GetVersionDetailsTest.js');
mocha.addFile('modules/metadataversion/GetVersionDataTest.js');
mocha.addFile('modules/metadataversion/GetVersionDatagzTest.js');
mocha.addFile('modules/metadataversion/MetadataVersionsUserAuthTest.js');
mocha.addFile('modules/metadataversion/UnsupportedCallsTest.js');
mocha.run(function(failures){
	process.on('exit', function () {
		process.exit(failures);
	});
});