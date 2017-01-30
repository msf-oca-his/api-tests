var buildAuth = function(user) {
	return 'Basic ' + new Buffer(user.userCredentials.username + ':' + user.userCredentials.password).toString('base64');
};

module.exports = {
	buildParams: function(user) {
		return {headers: {'Authorization': buildAuth(user), 'Cache-Control': "no-cache"}}
	},
	
	hashCode: function(string) {
		var hash = 0, i, chr, len;
		if(string.length === 0) return hash;
		for(i = 0, len = string.length; i < len; i++) {
			chr = string.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	}
};
