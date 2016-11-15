#!/usr/bin/env bash
 mocha -b modules/metadataversion/ErrorMessageTest.js --timeout 20000
 mocha -b modules/metadataversion/GetVersionHistoryTest.js --timeout 20000
 mocha -b modules/metadataversion/GetVersionTest.js --timeout 20000
 mocha -b modules/metadataversion/CreateVersionTest.js --timeout 20000
 mocha -b modules/metadataversion/GetVersionDetailsTest.js --timeout 20000
 mocha -b modules/metadataversion/GetVersionDataTest.js --timeout 20000
 mocha -b modules/metadataversion/GetVersionDatagzTest.js --timeout 20000
 mocha -b modules/metadataversion/MetadataVersionsUserAuthTest.js --timeout 20000
 mocha -b modules/metadataversion/UnsupportedCallsTest.js --timeout 20000